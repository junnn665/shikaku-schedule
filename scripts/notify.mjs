// ☆を付けた試験の締切・試験日・合格発表を通知する。
// GitHub Actions（.github/workflows/notify.yml）から毎朝実行。
//
// 環境変数:
//   STATE_GIST_ID  サイトの同期で作られた Gist の ID（必須）
//   GITHUB_TOKEN / GITHUB_REPOSITORY / REPO_OWNER  Issue で通知するため（Actions が自動で渡す）
//   NTFY_TOPIC     任意。ntfy.sh のトピック名を入れるとスマホにプッシュ通知も送る
//   STATE_FILE     テスト用。Gist の代わりにローカルの JSON を読む
//   TODAY          テスト用。YYYY-MM-DD
//   DRY_RUN=1      テスト用。送信せず内容を表示するだけ
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = process.env;
const TODAY = env.TODAY || new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
const SITE = env.SITE_URL || `https://${(env.GITHUB_REPOSITORY || "junnn665/shikaku-schedule").split("/")[0]}.github.io/${(env.GITHUB_REPOSITORY || "junnn665/shikaku-schedule").split("/")[1]}/`;

// ---- データ読み込み（サイトと同じ data.js / data_auto.js）
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ["data.js", "data_auto.js"]) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f });
}
const EXAMS = ctx.window.EXAMS;
const AUTO = ctx.window.AUTO || {};
for (const ex of EXAMS) if (Array.isArray(AUTO[ex.id]) && AUTO[ex.id].length) ex.sessions = AUTO[ex.id];
const SESSIONS = EXAMS.flatMap((ex) => ex.sessions.map((s, i) => ({ ...s, ex, key: s.id ? `${ex.id}@${s.id}` : `${ex.id}#${i}` })));

// ---- ☆の状態
async function loadState() {
  if (env.STATE_FILE) return JSON.parse(fs.readFileSync(env.STATE_FILE, "utf8"));
  if (!env.STATE_GIST_ID) return null;
  const res = await fetch(`https://api.github.com/gists/${env.STATE_GIST_ID}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "shikaku-schedule-notify" },
  });
  if (!res.ok) throw new Error(`Gist を読めませんでした (${res.status})`);
  const g = await res.json();
  const f = g.files["state.json"];
  const text = f.truncated ? await (await fetch(f.raw_url)).text() : f.content;
  return JSON.parse(text);
}

// ---- 日付
const toD = (s) => new Date(`${s}T00:00:00Z`);
const diff = (a, b) => Math.round((toD(b) - toD(a)) / 86400000);
const WD = ["日", "月", "火", "水", "木", "金", "土"];
const md = (s) => { const d = toD(s); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${WD[d.getUTCDay()]})`; };

// pr：サイトの「申込→入金→受験票→受験→結果確認」チェック
function eventsFor(s, pr = {}) {
  const out = [];
  if (s.apply && !(pr.applied && pr.paid)) {
    if (s.apply[0] === TODAY && !pr.applied) out.push({ pri: 2, text: `申込受付が始まりました（締切 ${md(s.apply[1])}）` });
    const n = diff(TODAY, s.apply[1]);
    const what = pr.applied ? "受験料の支払い" : "申込";
    if (n === 0) out.push({ pri: 0, text: `⚠️ 今日が${what}の締切です` });
    else if ([1, 3, 7].includes(n)) out.push({ pri: n === 1 ? 0 : 1, text: `${what}の締切まであと${n}日（${md(s.apply[1])}）` });
  }
  const e = diff(TODAY, s.exam[0]);
  const ticket = pr.applied && !pr.ticket ? "。受験票・会場を確認しましょう" : "";
  if (e === 1) out.push({ pri: 1, text: `明日が試験です（${md(s.exam[0])}）${ticket}` });
  else if (e === 7) out.push({ pri: 2, text: `試験まであと1週間（${md(s.exam[0])}）${ticket}` });
  if (s.announce === TODAY && !pr.result) out.push({ pri: 1, text: `今日は${s.announceLabel || "合格発表"}の日です` });
  return out;
}

const addYMD = (d, y = 0, m = 0) => { const t = toD(d); t.setUTCFullYear(t.getUTCFullYear() + y, t.getUTCMonth() + m); return t.toISOString().slice(0, 10); };
const fyEnd = (d, plus) => { const t = toD(d); const fy = t.getUTCMonth() >= 3 ? t.getUTCFullYear() : t.getUTCFullYear() - 1; return `${fy + plus + 1}-03-31`; };
const SOON = [90, 30, 7, 0];

async function main() {
  const state = await loadState();
  if (!state) { console.log("::warning::STATE_GIST_ID（Actions の Variables）が見つからないため通知しません"); return; }
  const stars = state.stars || {};
  const passed = state.passed || {};
  const passedParts = state.passedParts || {};
  // サイトと同じ判定：その回で受けられる区分がすべて合格済みなら通知しない
  const done = (s) => {
    if (passed[s.ex.id]) return true;
    if (!s.ex.parts) return false;
    const ids = s.parts || s.ex.parts.map((p) => p[0]);
    const pp = passedParts[s.ex.id] || {};
    return ids.length > 0 && ids.every((id) => pp[id]);
  };

  const items = [];
  for (const s of SESSIONS) {
    if (!stars[s.key] || done(s)) continue;
    if (env.TEST_ALL) {
      // テスト送信：☆を付けた今後の回の次の予定を1件ずつ
      const next = s.apply && s.apply[1] >= TODAY ? `申込締切 ${md(s.apply[1])}` : s.exam[0] >= TODAY ? `試験 ${md(s.exam[0])}` : null;
      if (next) items.push({ pri: 3, text: `（テスト）次の予定：${next}`, s });
      continue;
    }
    for (const ev of eventsFor(s, (state.progress || {})[s.key])) items.push({ ...ev, s });
  }

  if (!env.TEST_ALL) {
    // 免状の更新期限（取得済みタブで設定したもの）
    for (const [id, lic] of Object.entries(state.licenses || {})) {
      const ex = EXAMS.find((e) => e.id === id);
      if (!ex || !lic.renew) continue;
      const n = diff(TODAY, lic.renew);
      if (SOON.includes(n)) items.push({ pri: n <= 7 ? 0 : 2, text: n === 0 ? "⚠️ 今日が更新期限です" : `更新期限まであと${n}日（${md(lic.renew)}）`, s: { ex, label: "免状・更新" } });
    }
    // スコアの有効期限（TOEIC：有効な最高スコアの2年）
    for (const ex of EXAMS.filter((e) => e.score)) {
      const total = (sc) => Object.values(sc.sections || {}).reduce((x, y) => x + (Number(y) || 0), 0);
      const valid = ((state.scores || {})[ex.id] || []).filter((sc) => addYMD(sc.date, ex.score.validYears || 2) >= TODAY);
      const best = valid.sort((a, b) => total(b) - total(a) || b.date.localeCompare(a.date))[0];
      if (!best) continue;
      const until = addYMD(best.date, ex.score.validYears || 2);
      const n = diff(TODAY, until);
      if ([90, 30, 7].includes(n)) items.push({ pri: n <= 7 ? 1 : 2, text: `${total(best)}点（${md(best.date)}受験）の有効期限まであと${n}日（${md(until)}）`, s: { ex, label: "スコアの期限" } });
    }
    // 科目合格・一部免除の期限（残りの区分がある場合）
    for (const ex of EXAMS) {
      const pp = passedParts[ex.id] || {};
      if (passed[ex.id] || (ex.parts && ex.parts.every(([p]) => pp[p]))) continue;
      for (const r of ex.credits || []) {
        if ((r.unless || []).some((u) => pp[u])) continue;
        for (const pid of r.parts) {
          if (!pp[pid]) continue;
          const until = r.fyEnd ? fyEnd(pp[pid], r.years || 0) : addYMD(pp[pid], r.years || 0, r.months || 0);
          const n = diff(TODAY, until);
          if ([90, 30].includes(n)) items.push({ pri: 2, text: `${pid} の合格による免除の期限が近づいています（目安 ${md(until)}、あと${n}日）`, s: { ex, label: "免除の期限" } });
        }
      }
    }
  }
  console.log(`::notice::☆ ${Object.keys(stars).length}件 / 合格記録 ${Object.keys(passedParts).length + Object.keys(passed).length}件を読み込み`);
  if (!items.length) { console.log(`::notice::${TODAY}: 通知する予定はありません`); return; }
  items.sort((a, b) => a.pri - b.pri);

  const title = (env.TEST_ALL ? "【テスト】" : "") + `【資格】${md(TODAY)} のお知らせ ${items.length}件` + (items.some((i) => i.pri === 0) ? "（締切間近あり）" : "");
  const lines = items.map(({ s, text }) => `- **${s.ex.name}**（${s.label}）\n  ${text}\n  [公式ページ](${s.ex.url})`);
  const body = `${lines.join("\n")}\n\n[資格スケジュール帳を開く](${SITE}#plan)`;
  const plain = items.map(({ s, text }) => `・${s.ex.name}：${text}`).join("\n");

  if (env.DRY_RUN) { console.log(title + "\n\n" + body); return; }

  // GitHub Issue（作成者以外＝Actions からの割り当てとメンションで、メールと GitHub アプリに通知が届く）
  if (env.GITHUB_TOKEN && env.GITHUB_REPOSITORY) {
    const owner = env.REPO_OWNER || env.GITHUB_REPOSITORY.split("/")[0];
    const api = `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues`;
    const headers = { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" };
    const res = await fetch(api, { method: "POST", headers, body: JSON.stringify({ title, body: `@${owner}\n\n${body}`, assignees: [owner] }) });
    if (!res.ok) throw new Error(`Issue を作れませんでした (${res.status}) ${await res.text()}`);
    const issue = await res.json();
    // 通知は作成時に届くので、一覧が散らからないようすぐ閉じる
    await fetch(`${api}/${issue.number}`, { method: "PATCH", headers, body: JSON.stringify({ state: "closed", state_reason: "completed" }) });
    console.log(`Issue #${issue.number} で通知しました`);
  }

  if (env.NTFY_TOPIC) {
    const res = await fetch("https://ntfy.sh/", {
      method: "POST",
      body: JSON.stringify({ topic: env.NTFY_TOPIC, title, message: plain, click: `${SITE}#plan`, priority: items.some((i) => i.pri === 0) ? 4 : 3, tags: ["date"] }),
    });
    console.log(res.ok ? "ntfy に送りました" : `ntfy 送信失敗 (${res.status})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
