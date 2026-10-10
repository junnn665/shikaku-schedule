(() => {
  "use strict";

  // ---------- 日付ユーティリティ ----------
  const qs = new URLSearchParams(location.search);
  const TODAY = qs.get("today") || new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
  const WD = ["日", "月", "火", "水", "木", "金", "土"];
  const toD = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const toS = (d) => d.toISOString().slice(0, 10);
  const diff = (a, b) => Math.round((toD(b) - toD(a)) / 86400000); // b - a (日)
  const addDays = (s, n) => { const d = toD(s); d.setUTCDate(d.getUTCDate() + n); return toS(d); };
  const fmt = (s, withYear) => {
    const d = toD(s);
    const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
    const showY = withYear || String(y) !== TODAY.slice(0, 4);
    return `${showY ? y + "/" : ""}${m}/${day}(${WD[d.getUTCDay()]})`;
  };
  const fmtRange = (r) => (r[0] === r[1] ? fmt(r[0]) : `${fmt(r[0])} 〜 ${fmt(r[1])}`);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- 保存（このブラウザのみ） ----------
  const KEY = "shikaku-schedule:v1";
  const store = (() => {
    let s = { stars: {}, memo: {}, cats: [], pref: "愛知県", passed: {}, passedParts: {}, feeChoice: {}, progress: {}, licenses: {}, scores: {}, targets: {}, updatedAt: 0 };
    try { s = { ...s, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) { /* 使えない環境 */ }
    return s;
  })();
  // synced=false は表示フィルターなど端末ごとの変更（同期しない）
  const save = (synced = true) => {
    if (synced) store.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 無視 */ }
    if (synced && window.__schedulePush) window.__schedulePush();
  };

  // ---------- データ整形 ----------
  const CATS = window.CATEGORIES;
  const EXAMS = window.EXAMS;
  const PREFS = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];
  if (!PREFS.includes(store.pref)) store.pref = "愛知県";

  // 全回（受験予定用）と、選んだ受験地で表示する回
  // GitHub Actions が自動で取り込んだ日程（data_auto.js）があれば、そちらを優先
  const AUTO = window.AUTO || {};
  EXAMS.forEach((ex) => {
    if (Array.isArray(AUTO[ex.id]) && AUTO[ex.id].length) ex.sessions = AUTO[ex.id];
  });
  const ALL_SESSIONS = [];
  EXAMS.forEach((ex) => {
    ex.sessions.forEach((s, i) => ALL_SESSIONS.push({ ...s, key: s.id ? `${ex.id}@${s.id}` : `${ex.id}#${i}`, exam_: ex }));
  });
  let SESSIONS = [];
  function rebuild() {
    SESSIONS = ALL_SESSIONS.filter((s) => {
      if (sessionDone(s)) return false;
      if (s.pref) return s.pref === store.pref;
      if (s.fallback) return !ALL_SESSIONS.some((o) => o.exam_ === s.exam_ && o.pref === store.pref);
      return true;
    });
  }
  // 合格の記録：区分（parts）がある資格は区分ごと、ない資格は資格ごと
  const partIds = (ex) => (ex.parts ? ex.parts.map((p) => p[0]) : null);
  const partName = (ex, id) => { const p = (ex.parts || []).find((q) => q[0] === id); return p ? p[1] : id; };
  const passedPartsOf = (ex) => (store.passedParts && store.passedParts[ex.id]) || {};
  const isPassed = (ex) => {
    if (ex.score) return false; // スコア型（TOEIC）は合否ではなくスコアで管理
    if (store.passed && store.passed[ex.id]) return true;
    const ids = partIds(ex);
    return !!ids && ids.every((id) => passedPartsOf(ex)[id]);
  };
  const sessionParts = (s) => s.parts || partIds(s.exam_) || [];
  // その回で受けられる区分がすべて合格済みなら、その回はもう不要
  const sessionDone = (s) => isPassed(s.exam_) || (!!s.exam_.parts && sessionParts(s).length > 0 && sessionParts(s).every((id) => passedPartsOf(s.exam_)[id]));
  // 以前の「資格まるごと合格」の記録を区分ごとの記録に移す（スコア型は合格記録を使わない）
  EXAMS.forEach((ex) => {
    if (ex.score && store.passed && store.passed[ex.id]) delete store.passed[ex.id];
    if (ex.parts && store.passed && store.passed[ex.id]) {
      store.passedParts[ex.id] = Object.fromEntries(partIds(ex).map((id) => [id, store.passed[ex.id]]));
      delete store.passed[ex.id];
    }
  });
  rebuild();
  const noteOf = (ex) => (ex.prefNote && ex.prefNote[store.pref]) || ex.note;
  const urlOf = (ex) => (ex.prefUrl && ex.prefUrl[store.pref]) || ex.url;
  const hasSessions = (ex) => SESSIONS.some((s) => s.exam_ === ex);

  function statusOf(s) {
    if (s.exam && s.exam[1] < TODAY) {
      if (s.announce && s.announce >= TODAY) {
        const n = diff(TODAY, s.announce);
        return { code: "result", label: "結果待ち", cls: "st-soon", n, unit: n === 0 ? "今日発表" : "日後に発表" };
      }
      return { code: "past", label: "終了", cls: "st-closed" };
    }
    if (!s.apply) return { code: "unknown", label: "申込 要確認", cls: "st-closed" };
    if (TODAY < s.apply[0]) {
      const n = diff(TODAY, s.apply[0]);
      return { code: "before", label: "受付前", cls: "st-soon", n, unit: "日後に受付開始" };
    }
    if (TODAY <= s.apply[1]) {
      const n = diff(TODAY, s.apply[1]);
      return { code: "open", label: n <= 7 ? "締切間近" : "受付中", cls: n <= 7 ? "st-urgent" : "st-open", n, unit: n === 0 ? "今日締切" : "日で締切" };
    }
    return { code: "closed", label: "申込終了", cls: "st-closed", n: diff(TODAY, s.exam[0]), unit: "日後に試験" };
  }

  const catOn = (cat) => store.cats.length === 0 || store.cats.includes(cat);

  // ---------- 検索 ----------
  const ALIASES = {
    denken3: "でんけん 電験 三種", denken2: "でんけん 電験 二種", denkikouji1: "でんこう 電工 一種", denkikouji2: "でんこう 電工 二種",
    takken: "たっけん", kikenbutsu: "きけんぶつ 乙4 おつよん", shoubou: "しょうぼう", boki1: "ぼき", boki23: "ぼき",
    fp1: "ふぁいなんしゃるぷらんなー", fp23: "ふぁいなんしゃるぷらんなー", ap: "おうよう", fe: "きほん", ip: "あいてぃーぱすぽーと",
    sc: "しえんし せきゅりてぃ", sharoushi: "しゃろうし 社労士", shindanshi: "しんだんし", gyosei: "ぎょうせい", kangyou: "かんぎょう",
    eisei: "えいせい", gkentei: "じーけんてい", eshikaku: "いーしかく", toeic: "とーいっく", eiken: "えいけん", bijihou: "びじほう",
    gijutsushi: "ぎじゅつし", kenchiku: "けんちく せこうかん", doboku: "どぼく せこうかん", kankouji: "かんこうじ せこうかん", zouen: "ぞうえん", denkisekou: "でんきせこう",
  };
  const norm = (t) => String(t || "").normalize("NFKC").toLowerCase().replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)).replace(/\s+/g, "");
  let query = "";
  const hay = new Map();
  const haystack = (ex) => {
    if (!hay.has(ex.id)) hay.set(ex.id, norm([ex.name, ex.org, ALIASES[ex.id], ...(ex.parts || []).flat()].join(" ")));
    return hay.get(ex.id);
  };
  const matchQ = (ex) => !query || query.split(/[ 　]+/).filter(Boolean).every((w) => haystack(ex).includes(norm(w)));
  const shown = (ex) => catOn(ex.cat) && matchQ(ex);
  const isStar = (key) => !!store.stars[key];

  // ---------- 部品 ----------
  const starBtn = (key) => `<button class="star ${isStar(key) ? "is-on" : ""}" data-star="${key}" aria-label="受験予定に追加" title="受験予定に追加">${isStar(key) ? "★" : "☆"}</button>`;
  const catStyle = (ex) => `style="--cat:${CATS[ex.cat].color}"`;
  const subLine = (ex) => `<div class="sub">${esc(CATS[ex.cat].label)} ・ ${esc(ex.org)}</div>`;
  const officialLink = (ex) => `<div class="links"><a href="${esc(urlOf(ex))}" target="_blank" rel="noopener">公式・出典ページ ↗</a>
    ${passBtn(ex)}</div>`;
  // ---------- スコア（TOEIC） ----------
  const addYMD = (d, y = 0, m = 0) => { const t = toD(d); t.setUTCFullYear(t.getUTCFullYear() + y, t.getUTCMonth() + m); return toS(t); };
  const scoresOf = (ex) => ((store.scores && store.scores[ex.id]) || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const totalOf = (sc) => (sc.sections ? Object.values(sc.sections) : []).reduce((a, b) => a + (Number(b) || 0), 0);
  const scoreUntil = (ex, sc) => addYMD(sc.date, ex.score.validYears || 2);
  const validScores = (ex) => scoresOf(ex).filter((sc) => scoreUntil(ex, sc) >= TODAY);
  const bestValid = (ex) => validScores(ex).sort((a, b) => totalOf(b) - totalOf(a) || b.date.localeCompare(a.date))[0];
  function passBtn(ex) {
    if (ex.score) {
      const b = bestValid(ex);
      return `<button class="pass-btn ${b ? "has" : ""}" data-score="${ex.id}" title="スコアを記録します">📝 スコアを記録${b ? `（有効な最高 ${totalOf(b)}点）` : ""}</button>`;
    }
    if (!ex.parts) return `<button class="pass-btn" data-pass="${ex.id}" title="合格した資格を表示から外します">✓ 合格済みにする</button>`;
    const n = Object.keys(passedPartsOf(ex)).length;
    return `<button class="pass-btn ${n ? "has" : ""}" data-passparts="${ex.id}" title="区分ごとに合格を記録します">✓ 合格を記録${n ? `（${n}/${ex.parts.length}）` : ""}</button>`;
  }
  // 回で受けられる区分のチップ（合格済みは ✓）
  function partChips(s) {
    const ex = s.exam_;
    if (!ex.parts) return "";
    const ids = sessionParts(s), done = passedPartsOf(ex);
    if (ids.length <= 1 && !Object.keys(done).length) return "";
    return `<div class="chips">${ids.map((id) => `<span class="pchip ${done[id] ? "done" : ""}" title="${esc(partName(ex, id))}">${done[id] ? "✓ " : ""}${esc(id)}</span>`).join("")}</div>`;
  }

  const yen = (n) => n.toLocaleString("ja-JP") + "円";
  const announceOf = (s) => (s.announce ? fmt(s.announce) : s.announceText || "");
  const announceLabel = (s) => s.announceLabel || "合格発表";
  function feeText(ex) {
    if (!ex.fees || !ex.fees.length) return "公式サイトで確認";
    const t = ex.fees.length === 1 && !ex.fees[0].label ? yen(ex.fees[0].yen)
      : ex.fees.slice(0, 3).map((f) => `${f.label} ${yen(f.yen)}`).join("／") + (ex.fees.length > 3 ? " ほか" : "");
    return t;
  }

  // 申込から結果までのチェック
  const STEPS = [["applied", "申込"], ["paid", "入金"], ["ticket", "受験票"], ["taken", "受験"], ["result", "結果確認"]];
  const progOf = (key) => (store.progress && store.progress[key]) || {};
  function nextStep(s) {
    const pr = progOf(s.key), st = statusOf(s);
    if (!pr.applied) {
      if (st.code === "open") return `申込をしましょう（締切 ${fmt(s.apply[1])}）`;
      if (st.code === "before") return `申込は ${fmt(s.apply[0])} から`;
      if (st.code === "unknown") return "申込期間を公式で確認";
      return "";
    }
    if (!pr.paid) return st.code === "open" ? `受験料の支払い（締切 ${fmt(s.apply[1])}）` : "受験料の支払いを確認";
    if (!pr.ticket && s.exam[0] >= TODAY) return diff(TODAY, s.exam[0]) <= 14 ? "受験票（会場・時間）を確認" : "受験票が届いたらチェック";
    if (!pr.taken) return s.exam[0] > TODAY ? `試験まであと${diff(TODAY, s.exam[0])}日` : "受験したらチェック";
    if (!pr.result) {
      if (s.announce && s.announce > TODAY) return `結果発表は ${fmt(s.announce)}`;
      return s.exam_.score ? "スコアを確認して「取得済み」に記録" : "結果を確認";
    }
    return "完了";
  }
  function progressBlock(s) {
    const pr = progOf(s.key);
    return `<div class="progress">
      <div class="steps-row">${STEPS.map(([k, label], i) => `<button class="step ${pr[k] ? "on" : ""}" data-step="${k}" data-key="${s.key}" title="${pr[k] ? `${label}：${pr[k]}` : label}"><span>${pr[k] ? "✓" : i + 1}</span>${label}</button>`).join("")}</div>
      <div class="next-step">次にやること：<b>${esc(nextStep(s))}</b></div>
    </div>`;
  }

  function sessionCard(s, opts = {}) {
    const ex = s.exam_, st = statusOf(s);
    const cd = st.n != null && st.code !== "past"
      ? `<div class="countdown ${st.code === "open" && st.n <= 7 ? "urgent" : ""}"><div class="n">${st.n === 0 ? "!" : st.n}</div><div class="u">${st.unit}</div></div>` : "";
    return `
      <article class="card" ${catStyle(ex)}>
        <div class="card-head">
          ${starBtn(s.key)}
          <div class="card-title">
            <h3>${esc(ex.name)}</h3>
            <div class="sub"><span class="status ${st.cls}">${st.label}</span> ${esc(s.label)}</div>
          </div>
          ${cd}
        </div>
        <dl class="rows">
          <dt>申込期間</dt><dd>${s.apply ? fmtRange(s.apply) : "公式サイトで確認"}</dd>
          <dt>試験日</dt><dd>${fmtRange(s.exam)}</dd>
          ${announceOf(s) ? `<dt>${announceLabel(s) === "合格発表" ? "合格発表" : "結果発表"}</dt><dd>${esc(announceOf(s))}</dd>` : ""}
          <dt>受験料</dt><dd>${esc(feeText(ex))}</dd>
        </dl>
        ${partChips(s)}
        ${s.detail ? `<div class="detail">${esc(s.detail)}</div>` : ""}
        ${opts.progress ? progressBlock(s) : ""}
        ${officialLink(ex)}
      </article>`;
  }

  function simpleExamCard(ex, extra = "") {
    const key = `${ex.id}#any`;
    return `
      <article class="card" data-exam="${ex.id}" ${catStyle(ex)}>
        <div class="card-head">
          ${starBtn(key)}
          <div class="card-title"><h3>${esc(ex.name)}</h3>${subLine(ex)}</div>
        </div>
        <p class="note">${esc(noteOf(ex))}</p>
        <dl class="rows"><dt>受験料</dt><dd>${esc(feeText(ex))}</dd></dl>
        ${officialLink(ex)}
        ${extra}
      </article>`;
  }

  // ---------- フィルター ----------
  function renderPref() {
    const sel = document.getElementById("pref");
    sel.innerHTML = PREFS.map((p) => `<option ${p === store.pref ? "selected" : ""}>${p}</option>`).join("");
  }

  function renderFilters() {
    const all = store.cats.length === 0;
    let h = `<button class="chip ${all ? "is-on" : ""}" data-cat="">すべて</button>`;
    for (const [k, c] of Object.entries(CATS)) {
      h += `<button class="chip ${!all && store.cats.includes(k) ? "is-on" : ""}" data-cat="${k}"><span class="dot" style="background:${c.color}"></span>${esc(c.label)}</button>`;
    }
    document.getElementById("filters").innerHTML = h;
  }

  // ---------- 締切が近い ----------
  let showFar = false;
  function renderDeadline() {
    const list = SESSIONS.filter((s) => shown(s.exam_));
    const open = list.filter((s) => statusOf(s).code === "open").sort((a, b) => a.apply[1].localeCompare(b.apply[1]));
    const before = list.filter((s) => statusOf(s).code === "before").sort((a, b) => a.apply[0].localeCompare(b.apply[0]));
    const anytime = EXAMS.filter((e) => !hasSessions(e) && shown(e) && !isPassed(e));

    let h = `<h2 class="section-title">いま申込できる（締切が近い順）</h2>`;
    h += open.length ? open.map(sessionCard).join("") : `<div class="empty">受付中の試験はありません</div>`;
    const near = before.filter((s) => diff(TODAY, s.apply[0]) <= 60);
    const far = before.filter((s) => diff(TODAY, s.apply[0]) > 60);
    h += `<h2 class="section-title">これから申込が始まる（60日以内）</h2>`;
    h += near.length ? near.map(sessionCard).join("") : `<div class="empty">60日以内に受付が始まる試験はありません</div>`;
    if (far.length) {
      h += showFar ? `<h2 class="section-title">その先の予定</h2>` + far.map(sessionCard).join("")
        : `<button class="more-btn" data-far="1">その先の予定を表示（${far.length}件）</button>`;
    }
    if (anytime.length) {
      h += `<h2 class="section-title">随時受験・地域ごとの試験</h2>`;
      h += anytime.map((e) => simpleExamCard(e)).join("");
    }
    document.getElementById("view-deadline").innerHTML = h;
  }

  // ---------- 一覧 ----------
  const showPast = new Set();
  function renderList() {
    let h = "";
    for (const [k, c] of Object.entries(CATS)) {
      if (!catOn(k)) continue;
      const exams = EXAMS.filter((e) => e.cat === k && !isPassed(e) && matchQ(e));
      if (!exams.length) continue;
      h += `<h2 class="section-title">${esc(c.label)}</h2>`;
      for (const ex of exams) {
        if (!hasSessions(ex)) { h += simpleExamCard(ex); continue; }
        const ss = SESSIONS.filter((s) => s.exam_ === ex);
        const past = ss.filter((s) => statusOf(s).code === "past");
        const visible = showPast.has(ex.id) ? ss : ss.filter((s) => statusOf(s).code !== "past");
        h += `
          <article class="card" id="ex-${ex.id}" ${catStyle(ex)}>
            <div class="card-head"><div class="card-title"><h3>${esc(ex.name)}</h3>${subLine(ex)}</div></div>
            <p class="note">${esc(noteOf(ex))}</p>
            <div class="note">受験料：${esc(feeText(ex))}${ex.feeNote ? `（${esc(ex.feeNote)}）` : ""}</div>
            <div class="sessions">
              ${visible.length ? visible.map((s) => {
                const st = statusOf(s);
                return `<div class="session ${st.code === "past" ? "is-past" : ""}">
                  ${starBtn(s.key)}
                  <div class="session-body">
                    <div class="session-label">${esc(s.label)} <span class="status ${st.cls}">${st.label}</span></div>
                    <div class="session-dates">申込 <b>${s.apply ? fmtRange(s.apply) : "要確認"}</b></div>
                    <div class="session-dates">試験 <b>${fmtRange(s.exam)}</b></div>
                    ${announceOf(s) ? `<div class="session-dates">発表 <b>${esc(announceOf(s))}</b></div>` : ""}
                    ${partChips(s)}
                    ${s.detail ? `<div class="detail">${esc(s.detail)}</div>` : ""}
                  </div></div>`;
              }).join("") : `<div class="detail" style="padding:10px 0">今後の予定は未掲載です</div>`}
            </div>
            ${past.length ? `<button class="toggle-past" data-past="${ex.id}">${showPast.has(ex.id) ? "終了した回を隠す" : `終了した回を表示（${past.length}）`}</button>` : ""}
            ${officialLink(ex)}
          </article>`;
      }
    }
    document.getElementById("view-list").innerHTML = h || `<div class="empty">該当する資格がありません${query ? `（「${esc(query)}」で検索中）` : ""}</div>`;
  }

  // ---------- カレンダー ----------
  let calMonth = TODAY.slice(0, 7);
  let calSel = TODAY;
  let calStarOnly = false;

  function calEvents() {
    const map = {};
    const add = (d, ev) => (map[d] ||= []).push(ev);
    for (const s of SESSIONS) {
      if (!shown(s.exam_)) continue;
      if (calStarOnly && !isStar(s.key)) continue;
      const base = { s, color: CATS[s.exam_.cat].color };
      if (s.apply) {
        add(s.apply[0], { ...base, kind: "start", text: "申込開始" });
        add(s.apply[1], { ...base, kind: "end", text: "申込締切" });
      }
      if (s.exam[0] === s.exam[1]) add(s.exam[0], { ...base, kind: "exam", text: "試験" });
      else {
        add(s.exam[0], { ...base, kind: "exam", text: "試験期間 開始" });
        add(s.exam[1], { ...base, kind: "exam", text: "試験期間 終了" });
      }
      if (s.announce) add(s.announce, { ...base, kind: "result", text: announceLabel(s) });
      (s.extra || []).forEach((x) => add(x.date, { ...base, kind: "exam", text: x.text }));
    }
    const order = { end: 0, exam: 1, result: 2, start: 3 };
    Object.values(map).forEach((a) => a.sort((x, y) => order[x.kind] - order[y.kind]));
    return map;
  }

  function shortName(ex) { return ex.name.replace(/（.*?）/g, "").replace(/試験$/, ""); }

  function renderCalendar() {
    const map = calEvents();
    const [y, m] = calMonth.split("-").map(Number);
    const first = `${calMonth}-01`;
    const startDow = toD(first).getUTCDay();
    const start = addDays(first, -startDow);
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells = Math.ceil((startDow + daysInMonth) / 7) * 7;

    let grid = WD.map((w, i) => `<div class="dow ${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${w}</div>`).join("");
    for (let i = 0; i < cells; i++) {
      const d = addDays(start, i);
      const dow = i % 7;
      const evs = map[d] || [];
      const cls = ["day", d.slice(0, 7) !== calMonth ? "other" : "", d === TODAY ? "is-today" : "", d === calSel ? "is-selected" : "", dow === 0 ? "sun" : dow === 6 ? "sat" : ""].join(" ");
      const labels = evs.slice(0, 3).map((e) => `<div class="ev k-${e.kind}" style="--c:${e.color}">${{ end: "締", start: "申", exam: "試", result: "発" }[e.kind]} ${esc(shortName(e.s.exam_))}</div>`).join("")
        + (evs.length > 3 ? `<div class="ev more">+${evs.length - 3}</div>` : "");
      const dots = evs.slice(0, 8).map((e) => `<i class="mk-${e.kind}"></i>`).join("");
      grid += `<button class="${cls}" data-day="${d}"><span class="num">${Number(d.slice(8))}</span>${labels}<span class="dots">${dots}</span></button>`;
    }

    const sel = map[calSel] || [];
    const kindLabel = { start: "申込開始", end: "申込締切", exam: "試験", result: "発表" };
    const dayList = `
      <div class="day-list">
        <h3>${fmt(calSel, true)}</h3>
        ${sel.length ? sel.map((e) => `<div class="day-item"><span class="kind k-${e.kind}">${kindLabel[e.kind]}</span>
          <div><b>${esc(e.s.exam_.name)}</b> <span style="color:var(--ink-3);font-size:12px">${esc(e.s.label)}</span>
          <div style="font-size:12px;color:var(--ink-2)">${esc(e.text)}　申込 ${e.s.apply ? fmtRange(e.s.apply) : "要確認"} ／ 試験 ${fmtRange(e.s.exam)}</div></div></div>`).join("")
          : `<div class="empty">この日の予定はありません</div>`}
      </div>`;

    document.getElementById("view-calendar").innerHTML = `
      <div class="cal-nav">
        <button data-cal="-1" aria-label="前の月">‹</button>
        <h2>${y}年${m}月</h2>
        <button data-cal="1" aria-label="次の月">›</button>
      </div>
      <div class="legend">
        <span><i class="ev k-end" style="padding:0 4px">締</i>申込締切</span>
        <span><i class="ev k-start" style="--c:var(--ink-2);padding:0 4px">申</i>申込開始</span>
        <span><i class="ev k-exam" style="--c:var(--ink);padding:0 4px">試</i>試験</span>
        <span><i class="ev k-result" style="--c:var(--ink-2);padding:0 4px">発</i>合格発表</span>
        <label style="margin-left:auto;cursor:pointer"><input type="checkbox" id="calStar" ${calStarOnly ? "checked" : ""}> ☆だけ表示</label>
      </div>
      <div class="cal">${grid}</div>
      ${dayList}`;
  }

  // ---------- 受験予定 ----------
  function renderPlan() {
    const starredSessions = ALL_SESSIONS.filter((s) => isStar(s.key) && !sessionDone(s));
    const starredAny = EXAMS.filter((e) => isStar(`${e.id}#any`) && !isPassed(e));
    const examIds = [...new Set([...starredSessions.map((s) => s.exam_.id), ...starredAny.map((e) => e.id)])];
    document.getElementById("planCount").textContent = starredSessions.length + starredAny.length || "";

    if (!examIds.length) {
      document.getElementById("view-plan").innerHTML = `<div class="empty">☆を付けた試験がここに並びます。<br>「締切が近い」や「一覧」で受けたい回の☆を押してください。</div>`;
      return;
    }
    const nextDate = (s) => { const st = statusOf(s); return st.code === "before" ? s.apply[0] : st.code === "open" ? s.apply[1] : s.exam[0]; };
    const upcoming = starredSessions.filter((s) => statusOf(s).code !== "past").sort((a, b) => nextDate(a).localeCompare(nextDate(b)));
    const past = starredSessions.filter((s) => statusOf(s).code === "past");

    let h = `<div class="plan-actions">
      <button class="btn" id="icsBtn" ${upcoming.length ? "" : "disabled"}>カレンダー用に書き出す（.ics）</button>
    </div>`;
    h += feeSummary(upcoming);
    h += `<h2 class="section-title">これからの予定</h2>`;
    h += upcoming.length ? upcoming.map((s) => sessionCard(s, { progress: true })).join("") : `<div class="empty">今後の予定はありません</div>`;
    if (starredAny.length) {
      h += `<h2 class="section-title">随時・地域ごとの試験</h2>` + starredAny.map((e) => simpleExamCard(e)).join("");
    }
    h += `<h2 class="section-title">メモ</h2>`;
    for (const id of examIds) {
      const ex = EXAMS.find((e) => e.id === id);
      h += `<article class="card" ${catStyle(ex)}><div class="card-title"><h3>${esc(ex.name)}</h3></div>
        <textarea class="memo" data-memo="${id}" placeholder="教材、勉強の進み具合、受験料など">${esc(store.memo[id] || "")}</textarea></article>`;
    }
    if (past.length) h += `<h2 class="section-title">終了した回</h2>` + past.map((s) => sessionCard(s, { progress: true })).join("");
    document.getElementById("view-plan").innerHTML = h;
  }

  // ☆を付けたこれからの回の受験料合計
  function feeSummary(list) {
    const ss = list.filter((s) => s.exam[0] >= TODAY);
    if (!ss.length) return "";
    let total = 0, unknown = 0;
    const rows = ss.map((s) => {
      const ex = s.exam_, fees = ex.fees || [];
      let cell;
      if (!fees.length) { unknown++; cell = `<span class="muted">不明</span>`; }
      else {
        const i = Math.min(store.feeChoice[ex.id] || 0, fees.length - 1);
        total += fees[i].yen;
        cell = fees.length > 1
          ? `<select class="fee-select" data-fee="${ex.id}">${fees.map((f, j) => `<option value="${j}" ${j === i ? "selected" : ""}>${esc(f.label)} ${yen(f.yen)}</option>`).join("")}</select>`
          : `<b>${yen(fees[0].yen)}</b>`;
      }
      return `<div class="fee-row"><div class="fee-name">${esc(ex.name)}<span>${esc(s.label)}・${fmt(s.exam[0])}</span></div><div class="fee-val">${cell}</div></div>`;
    }).join("");
    return `<h2 class="section-title">受験料</h2>
      <div class="card fee-card">${rows}
        <div class="fee-total"><span>合計${unknown ? `（不明 ${unknown}件を除く）` : ""}</span><b>${yen(total)}</b></div>
      </div>`;
  }

  // ---------- 取得済み：合格の記録・免状・期限 ----------
  const fyEnd = (d, plusYears) => { const t = toD(d); const fy = t.getUTCMonth() >= 3 ? t.getUTCFullYear() : t.getUTCFullYear() - 1; return `${fy + plusYears + 1}-03-31`; };
  const passDateOf = (ex, part) => (part ? passedPartsOf(ex)[part] : store.passed[ex.id]) || "";
  const hasRecord = (ex) => (ex.score ? scoresOf(ex).length > 0 : !!store.passed[ex.id] || Object.keys(passedPartsOf(ex)).length > 0);
  const licOf = (id) => (store.licenses && store.licenses[id]) || {};

  // 科目合格・一部免除などの期限（まだ残りの区分がある場合だけ）
  function creditItems() {
    const out = [];
    for (const ex of EXAMS) {
      for (const r of ex.credits || []) {
        if (isPassed(ex)) continue;
        const done = passedPartsOf(ex);
        if ((r.unless || []).some((u) => done[u])) continue;
        for (const pid of r.parts) {
          const d = done[pid];
          if (!d) continue;
          const until = r.fyEnd ? fyEnd(d, r.years || 0) : addYMD(d, r.years || 0, r.months || 0);
          out.push({ ex, pid, since: d, until, text: r.text, n: diff(TODAY, until) });
        }
      }
    }
    return out.sort((a, b) => a.until.localeCompare(b.until));
  }
  function renewItems() {
    return EXAMS.filter((ex) => hasRecord(ex) && licOf(ex.id).renew).map((ex) => ({ ex, until: licOf(ex.id).renew, n: diff(TODAY, licOf(ex.id).renew) }))
      .sort((a, b) => a.until.localeCompare(b.until));
  }

  function scoreCard(ex) {
    const all = scoresOf(ex), best = bestValid(ex), latestS = all[0];
    const target = (store.targets || {})[ex.id];
    const secs = ex.score.sections;
    return `<article class="card have-card" ${catStyle(ex)}>
      <div class="card-head"><div class="card-title"><h3>${esc(ex.name)}</h3>${subLine(ex)}</div>
        <button class="btn ghost small" data-score="${ex.id}">スコアを追加・編集</button></div>
      <div class="score-hero">
        <div><small>有効な最高スコア</small><b>${best ? totalOf(best) : "—"}</b>${best ? `<span>${fmt(best.date, true)} 受験 ・ ${fmt(scoreUntil(ex, best), true)} まで</span>` : `<span>2年以内のスコアがありません</span>`}</div>
        <div><small>目標</small><b>${target || "—"}</b>${target && best ? `<span>${totalOf(best) >= target ? "達成 🎉" : `あと ${target - totalOf(best)}点`}</span>` : `<span>&nbsp;</span>`}</div>
      </div>
      <table class="score-table"><thead><tr><th>受験日</th>${secs.map(([k]) => `<th>${esc(k)}</th>`).join("")}<th>合計</th><th>期限</th></tr></thead><tbody>
        ${all.map((sc) => { const u = scoreUntil(ex, sc), exp = u < TODAY; return `<tr class="${exp ? "expired" : ""} ${sc === best ? "best" : ""}"><td>${fmt(sc.date, true)}</td>${secs.map(([k]) => `<td>${esc(sc.sections[k] ?? "")}</td>`).join("")}<td><b>${totalOf(sc)}</b></td><td>${exp ? "期限切れ" : fmt(u, true)}</td></tr>`; }).join("")}
      </tbody></table>
      ${latestS && best && latestS !== best ? `<div class="detail">最新：${totalOf(latestS)}点（${fmt(latestS.date, true)}）</div>` : ""}
      <div class="detail">${esc(ex.score.validText)}</div>
    </article>`;
  }

  // スコア入力ダイアログ
  let scoreEditing = null;
  function openScoreDialog(id) {
    const ex = EXAMS.find((e) => e.id === id);
    scoreEditing = ex;
    const secs = ex.score.sections;
    const lastExam = ALL_SESSIONS.filter((s) => s.exam_ === ex && s.exam[0] <= TODAY).map((s) => s.exam[0]).sort().pop() || TODAY;
    document.getElementById("passTitle").textContent = `${ex.name} のスコア`;
    document.getElementById("passBody").innerHTML = `
      <div class="score-form">
        <label>受験日<input type="date" class="mini-input" id="scDate" value="${lastExam}"></label>
        ${secs.map(([k, label, max]) => `<label>${esc(label)}<input type="number" class="mini-input" data-sec="${k}" min="0" max="${max}" step="5" inputmode="numeric" placeholder="0〜${max}"></label>`).join("")}
        <div class="score-total">合計 <b id="scTotal">0</b></div>
      </div>
      <div class="plan-actions"><button class="btn" id="scoreAdd">このスコアを追加</button></div>
      <label class="target-row">目標スコア<input type="number" class="mini-input" id="scTarget" min="0" max="${secs.reduce((a, s) => a + s[2], 0)}" step="5" value="${esc((store.targets || {})[ex.id] || "")}" placeholder="例：800"></label>
      ${scoresOf(ex).length ? `<h3 class="dlg-sub">記録済み</h3>${scoresOf(ex).map((sc, i) => `<div class="score-line"><span>${fmt(sc.date, true)}</span><span>${secs.map(([k]) => `${k} ${sc.sections[k] ?? "-"}`).join(" / ")}</span><b>${totalOf(sc)}</b><button class="btn ghost small" data-delscore="${sc.date}|${i}">削除</button></div>`).join("")}` : ""}
      <p class="hint">${esc(ex.score.validText)}</p>`;
    document.getElementById("passDlg").showModal();
  }
  function addScore() {
    const ex = scoreEditing; if (!ex) return;
    const date = document.getElementById("scDate").value;
    const sections = {};
    let ok = !!date;
    document.querySelectorAll("#passBody input[data-sec]").forEach((i) => { if (i.value === "") ok = false; sections[i.dataset.sec] = Number(i.value); });
    if (!ok) { toast("受験日とスコアをすべて入れてください"); return; }
    store.scores[ex.id] = [...(store.scores[ex.id] || []).filter((sc) => sc.date !== date), { date, sections }];
    save(); renderAll(); openScoreDialog(ex.id);
    toast(`${totalOf({ sections })}点を記録しました`);
  }

  function renderHave() {
    const list = EXAMS.filter(hasRecord);
    const latest = (ex) => store.passed[ex.id] || Object.values(passedPartsOf(ex)).sort().pop() || "";
    list.sort((a, b) => latest(b).localeCompare(latest(a)));
    document.getElementById("haveCount").textContent = list.length || "";
    if (!list.length) {
      document.getElementById("view-have").innerHTML = `<div class="empty">合格した資格がここに並びます。<br>各カードの「✓ 合格済みにする」「✓ 合格を記録」から登録してください。</div>`;
      return;
    }
    const credits = creditItems(), renews = renewItems();
    let h = "";
    const deadlines = [
      ...credits.map((c) => ({ until: c.until, n: c.n, title: `${c.ex.name}：${partName(c.ex, c.pid)}`, text: c.text, approx: true })),
      ...renews.map((r) => ({ until: r.until, n: r.n, title: `${r.ex.name}：更新・講習`, text: (r.ex.renewal && r.ex.renewal.text) || "設定した更新期限" })),
      ...EXAMS.filter((ex) => ex.score && bestValid(ex)).map((ex) => { const b = bestValid(ex), u = scoreUntil(ex, b); return { until: u, n: diff(TODAY, u), title: `${ex.name}：${totalOf(b)}点（${fmt(b.date, true)}）の有効期限`, text: "有効な最高スコアの期限（2年）。それまでに受け直すと安心" }; }),
    ].sort((a, b) => a.until.localeCompare(b.until));
    if (deadlines.length) {
      h += `<h2 class="section-title">期限</h2><div class="card deadline-list">${deadlines.map((d) => `
        <div class="dl-row ${d.n < 0 ? "expired" : d.n <= 90 ? "soon" : ""}">
          <div class="dl-main"><b>${esc(d.title)}</b><span>${esc(d.text)}</span></div>
          <div class="dl-date">${d.approx ? "目安 " : ""}${fmt(d.until, true)}<small>${d.n < 0 ? "期限切れ" : `あと${d.n}日`}</small></div>
        </div>`).join("")}</div>`;
    }
    h += `<h2 class="section-title">合格・取得の記録</h2>`;
    h += list.map((ex) => {
      if (ex.score) return scoreCard(ex);
      const lic = licOf(ex.id);
      const parts = ex.parts ? ex.parts.filter(([pid]) => passedPartsOf(ex)[pid]) : [];
      const firstDate = latest(ex);
      const suggest = ex.renewal && firstDate ? addYMD(firstDate, ex.renewal.years) : "";
      return `<article class="card have-card" ${catStyle(ex)}>
        <div class="card-head"><div class="card-title"><h3>${esc(ex.name)}</h3>${subLine(ex)}</div>
          ${ex.parts ? `<button class="btn ghost small" data-passparts="${ex.id}">区分を編集</button>` : `<button class="btn ghost small" data-unpass="${ex.id}">記録を消す</button>`}</div>
        <dl class="rows">
          ${ex.parts
            ? parts.map(([pid, label]) => `<dt>${esc(label)}</dt><dd>${fmt(passedPartsOf(ex)[pid], true)} 合格</dd>`).join("") + (isPassed(ex) ? "" : `<dt>残り</dt><dd class="muted">${ex.parts.filter(([pid]) => !passedPartsOf(ex)[pid]).map(([, l]) => esc(l)).join("・")}</dd>`)
            : `<dt>合格日</dt><dd><input type="date" class="mini-input" data-passdate="${ex.id}" value="${esc(store.passed[ex.id])}"></dd>`}
          <dt>免状・登録番号</dt><dd><input class="mini-input wide" data-lic="${ex.id}" data-field="number" value="${esc(lic.number || "")}" placeholder="例：第12345号"></dd>
          <dt>更新期限</dt><dd><input type="date" class="mini-input" data-lic="${ex.id}" data-field="renew" value="${esc(lic.renew || "")}">
            ${suggest && !lic.renew ? `<button class="btn ghost small" data-setrenew="${ex.id}" data-date="${suggest}">目安 ${fmt(suggest, true)} を設定</button>` : ""}</dd>
        </dl>
        ${ex.renewal ? `<div class="detail">更新の目安：${esc(ex.renewal.text)}</div>` : ""}
        <textarea class="memo" data-licmemo="${ex.id}" placeholder="交付日、講習の受講記録など">${esc(lic.memo || "")}</textarea>
      </article>`;
    }).join("");
    document.getElementById("view-have").innerHTML = h;
  }

  // 区分ごとの合格を記録するダイアログ
  let passEditing = null;
  function openPassDialog(id) {
    const ex = EXAMS.find((e) => e.id === id);
    passEditing = ex;
    const done = passedPartsOf(ex);
    document.getElementById("passTitle").textContent = `${ex.name} の合格を記録`;
    document.getElementById("passBody").innerHTML = `
      <p class="hint">合格した区分にチェックして、合格日を入れてください。その区分しかない回は表示から外れます。すべてにチェックすると資格ごと表示から外れます。${ex.partsNote ? `<br>${esc(ex.partsNote)}` : ""}</p>
      <div class="part-list">${ex.parts.map(([pid, label]) => `<div class="part-line"><label class="part-check"><input type="checkbox" value="${esc(pid)}" ${done[pid] ? "checked" : ""}><span>${esc(label)}</span></label>
        <input type="date" class="mini-input" data-pd="${esc(pid)}" value="${esc(done[pid] || TODAY)}" title="合格日"></div>`).join("")}</div>
      <div class="plan-actions" style="margin-top:14px"><button class="btn" id="passSave">保存</button><button class="btn ghost" id="passCancel">キャンセル</button></div>`;
    document.getElementById("passDlg").showModal();
  }
  function savePassDialog() {
    const ex = passEditing; if (!ex) return;
    const before = JSON.stringify(passedPartsOf(ex));
    const prev = passedPartsOf(ex);
    const next = {};
    document.querySelectorAll("#passBody input[type=checkbox]").forEach((c) => {
      if (!c.checked) return;
      const di = [...document.querySelectorAll("#passBody input[data-pd]")].find((x) => x.dataset.pd === c.value);
      next[c.value] = (di && di.value) || prev[c.value] || TODAY;
    });
    if (Object.keys(next).length) store.passedParts[ex.id] = next; else delete store.passedParts[ex.id];
    document.getElementById("passDlg").close();
    save(); rebuild(); renderAll();
    const n = Object.keys(next).length;
    toast(n ? `${ex.name}：${n}区分を合格済みにしました` : `${ex.name} の合格記録を消しました`, () => {
      const b = JSON.parse(before);
      if (Object.keys(b).length) store.passedParts[ex.id] = b; else delete store.passedParts[ex.id];
      save(); rebuild(); renderAll();
    });
  }

  // 下部に出す「元に戻す」通知
  let toastTimer;
  let toastUndo = null;
  function toast(msg, undo) {
    toastUndo = typeof undo === "function" ? undo : undo ? () => { delete store.passed[undo]; save(); rebuild(); renderAll(); } : null;
    let el = document.getElementById("toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; document.body.appendChild(el); }
    el.innerHTML = `<span>${esc(msg)}</span>${toastUndo ? `<button id="toastUndo">元に戻す</button>` : ""}`;
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-on"), 5000);
  }

  function downloadIcs() {
    const ss = ALL_SESSIONS.filter((s) => isStar(s.key) && !sessionDone(s) && statusOf(s).code !== "past");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//shikaku-schedule//JA", "CALSCALE:GREGORIAN"];
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const ev = (uid, date, endEx, summary, desc) => {
      lines.push("BEGIN:VEVENT", `UID:${uid}@shikaku-schedule`, `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDays(endEx, 1).replace(/-/g, "")}`,
        `SUMMARY:${summary}`, `DESCRIPTION:${desc.replace(/\n/g, "\\n").replace(/[,;]/g, (c) => "\\" + c)}`, "END:VEVENT");
    };
    for (const s of ss) {
      const name = s.exam_.name, d = `${s.label}\n${s.detail || ""}\n${s.exam_.url}`, id = s.key.replace("#", "-");
      if (s.apply && s.apply[0] >= TODAY) ev(`${id}-start`, s.apply[0], s.apply[0], `【申込開始】${name}`, d);
      if (s.apply && s.apply[1] >= TODAY) ev(`${id}-end`, s.apply[1], s.apply[1], `【申込締切】${name}`, d);
      ev(`${id}-exam`, s.exam[0], s.exam[1], `【試験】${name}`, d);
      if (s.announce && s.announce >= TODAY) ev(`${id}-result`, s.announce, s.announce, `【${announceLabel(s)}】${name}`, d);
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "shikaku-schedule.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }


  // ---------- 端末間の同期（GitHub のシークレット Gist） ----------
  const SYNC_KEY = "shikaku-schedule:sync";
  const GIST_DESC = "shikaku-schedule state";
  const GIST_FILE = "state.json";
  const SYNCED = ["stars", "memo", "passed", "passedParts", "feeChoice", "progress", "licenses", "scores", "targets", "pref", "updatedAt"];
  let sync = {};
  try { sync = JSON.parse(localStorage.getItem(SYNC_KEY) || "{}"); } catch (e) { /* 無視 */ }
  const saveSync = () => { try { localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); } catch (e) { /* 無視 */ } };
  let syncStatus = sync.gistId ? "接続済み" : "未設定";

  async function gh(path, opts = {}) {
    const res = await fetch(`https://api.github.com${path}`, {
      ...opts,
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${sync.token}`,
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    return res.status === 204 ? null : res.json();
  }

  const payload = () => JSON.stringify(Object.fromEntries(SYNCED.map((k) => [k, store[k]])), null, 1);

  function applyRemote(remote) {
    SYNCED.forEach((k) => { if (remote[k] !== undefined) store[k] = remote[k]; });
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 無視 */ }
    rebuild(); renderPref(); renderAll();
  }

  async function pull() {
    if (!sync.token || !sync.gistId) return;
    try {
      const g = await gh(`/gists/${sync.gistId}`);
      const f = g.files && g.files[GIST_FILE];
      if (!f) throw new Error("state.json がありません");
      const text = f.truncated ? await (await fetch(f.raw_url, { cache: "no-store" })).text() : f.content;
      const remote = JSON.parse(text || "{}");
      if ((remote.updatedAt || 0) > (store.updatedAt || 0)) applyRemote(remote);
      else if ((remote.updatedAt || 0) < (store.updatedAt || 0)) await push();
      setSyncStatus(`同期済み（${new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}）`);
    } catch (e) {
      setSyncStatus(`同期エラー：${e.message}`);
    }
  }

  async function push() {
    if (!sync.token || !sync.gistId) return;
    try {
      await gh(`/gists/${sync.gistId}`, { method: "PATCH", body: JSON.stringify({ files: { [GIST_FILE]: { content: payload() } } }) });
      setSyncStatus(`同期済み（${new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}）`);
    } catch (e) {
      setSyncStatus(`同期エラー：${e.message}`);
    }
  }

  let pushTimer;
  window.__schedulePush = () => {
    if (!sync.gistId) return;
    clearTimeout(pushTimer);
    setSyncStatus("保存中…");
    pushTimer = setTimeout(push, 1500);
  };

  async function connect(token) {
    sync = { token: token.trim() };
    setSyncStatus("接続中…");
    try {
      await gh("/user");
      let found = null;
      for (let page = 1; page <= 5 && !found; page++) {
        const list = await gh(`/gists?per_page=100&page=${page}`);
        found = list.find((g) => g.description === GIST_DESC && g.files[GIST_FILE]);
        if (list.length < 100) break;
      }
      if (found) {
        sync.gistId = found.id; saveSync();
        await pull();
      } else {
        const g = await gh("/gists", { method: "POST", body: JSON.stringify({ description: GIST_DESC, public: false, files: { [GIST_FILE]: { content: payload() } } }) });
        sync.gistId = g.id; saveSync();
        setSyncStatus("接続済み（新しく保存先を作成）");
      }
    } catch (e) {
      sync = {}; saveSync();
      setSyncStatus(`接続できませんでした：${e.message}（トークンと gist の権限を確認）`);
    }
    renderSettings();
  }

  function disconnect() { sync = {}; saveSync(); setSyncStatus("未設定"); renderSettings(); }

  function setSyncStatus(t) {
    syncStatus = t;
    const el = document.getElementById("syncStatus");
    if (el) el.textContent = t;
    const dot = document.getElementById("syncDot");
    if (dot) dot.dataset.state = /エラー|できません/.test(t) ? "err" : sync.gistId ? "ok" : "off";
  }

  function renderSettings() {
    const box = document.getElementById("settingsBody");
    if (!box) return;
    const connected = !!sync.gistId;
    box.innerHTML = `
      <h3>端末間の同期</h3>
      <p class="hint">☆・メモ・合格の記録・受験料の選択・受験地を、スマホとPCで共有します。保存先はあなたの GitHub アカウントの<b>シークレット Gist</b>（URLを知っている人だけが見られる非公開メモ）です。</p>
      <p class="sync-state"><span id="syncDot" class="sync-dot"></span><span id="syncStatus">${esc(syncStatus)}</span></p>
      ${connected ? `
        <dl class="rows"><dt>Gist ID</dt><dd><code id="gistId">${esc(sync.gistId)}</code> <button class="btn ghost small" data-copy="gistId">コピー</button></dd></dl>
        <div class="plan-actions"><button class="btn ghost small" id="syncNow">今すぐ同期</button><button class="btn ghost small" id="syncOff">この端末の同期を解除</button></div>
        <h3>締切の通知</h3>
        <p class="hint">毎朝7時ごろ、☆を付けた試験の「申込開始・締切7日前/3日前/前日/当日・試験の7日前/前日・合格発表日」を GitHub の通知（メール・GitHubアプリ）でお知らせします。<br>
        有効にするには、リポジトリの <b>Settings → Secrets and variables → Actions → Variables</b> に <code>STATE_GIST_ID</code> という名前で上の Gist ID を登録してください。</p>
      ` : `
        <ol class="hint steps">
          <li><a href="https://github.com/settings/tokens/new?scopes=gist&description=shikaku-schedule" target="_blank" rel="noopener">GitHub のトークン作成ページ</a>を開き、<b>gist</b> だけにチェックが入った状態で作成（有効期限は「No expiration」が楽です）</li>
          <li>表示された <code>ghp_</code> で始まる文字列を下に貼り付けて「接続」</li>
          <li>ほかの端末でも同じトークンで接続すると、同じデータを共有します</li>
        </ol>
        <div class="token-row"><input id="tokenInput" type="password" placeholder="ghp_…" autocomplete="off"><button class="btn small" id="syncConnect">接続</button></div>
      `}`;
    setSyncStatus(syncStatus);
  }

  // ---------- ルート：年間ロードマップと系統図 ----------
  function nodeInfo(ref) {
    const [id, pid] = ref.split(":");
    const ex = EXAMS.find((e) => e.id === id);
    let short = ex.name.replace(/（.*?）/g, "").replace(/試験$/, "");
    if (pid) short = short.replace(/\s*[0-9０-９]級(・[0-9０-９]級)*$/, "");
    const label = pid ? `${short} ${pid}` : short;
    const passed = pid ? !!passedPartsOf(ex)[pid] : isPassed(ex);
    const starred = ALL_SESSIONS.some((s) => s.exam_ === ex && isStar(s.key) && !sessionDone(s) && statusOf(s).code !== "past" && (!pid || sessionParts(s).includes(pid))) || isStar(`${ex.id}#any`);
    return { ex, label, passed, starred };
  }
  function renderRoute() {
    // 年間ロードマップ
    const start = `${TODAY.slice(0, 7)}-01`;
    const end = addYMD(start, 1, 0);
    const span = diff(start, end);
    const pos = (d) => Math.max(0, Math.min(100, (diff(start, d) / span) * 100));
    const rows = ALL_SESSIONS.filter((s) => isStar(s.key) && !sessionDone(s) && s.exam[1] >= TODAY && s.exam[0] < end)
      .sort((a, b) => a.exam[0].localeCompare(b.exam[0]));
    const warn = new Map();
    for (let i = 1; i < rows.length; i++) {
      const gap = diff(rows[i - 1].exam[1], rows[i].exam[0]);
      if (gap <= 14) {
        const msg = gap <= 0 ? "試験期間が重なっています" : `前の試験と${gap}日しか空いていません`;
        warn.set(rows[i].key, msg);
        if (!warn.has(rows[i - 1].key)) warn.set(rows[i - 1].key, "次の試験と近い");
      }
    }
    const months = [];
    for (let i = 0; i < 12; i++) months.push(addYMD(start, 0, i));
    let h = `<h2 class="section-title">年間ロードマップ（☆を付けた回）</h2>`;
    if (!rows.length) h += `<div class="empty">☆を付けた試験がここに1年分並びます</div>`;
    else {
      h += `<div class="card roadmap"><div class="rm-scroll"><div class="rm-inner">
        <div class="rm-months">${months.map((m) => `<span style="left:${pos(m)}%">${Number(m.slice(5, 7))}月</span>`).join("")}</div>
        <div class="rm-today" style="left:${pos(TODAY)}%"></div>
        ${rows.map((s) => {
          const c = CATS[s.exam_.cat].color, w = warn.get(s.key);
          const ap = s.apply && s.apply[1] >= start ? `<i class="rm-apply" style="left:${pos(s.apply[0])}%;width:${Math.max(0.6, pos(s.apply[1]) - pos(s.apply[0]))}%;--c:${c}" title="申込 ${fmtRange(s.apply)}"></i>` : "";
          const exb = `<i class="rm-exam" style="left:${pos(s.exam[0])}%;width:${Math.max(1.2, pos(s.exam[1]) - pos(s.exam[0]))}%;--c:${c}" title="試験 ${fmtRange(s.exam)}"></i>`;
          return `<div class="rm-row ${w ? "warn" : ""}"><div class="rm-label">${esc(s.exam_.name.replace(/（.*?）/g, ""))}<small>${esc(s.label)} ・ 試験 ${fmtRange(s.exam)}${w ? ` ・ ⚠ ${esc(w)}` : ""}</small></div><div class="rm-track">${ap}${exb}</div></div>`;
        }).join("")}
      </div></div>
      <div class="legend rm-legend"><span><i class="rm-key apply"></i>申込期間</span><span><i class="rm-key exam"></i>試験</span><span><i class="rm-key today"></i>今日</span></div></div>`;
      const ws = rows.filter((s) => warn.get(s.key) && warn.get(s.key) !== "次の試験と近い");
      if (ws.length) h += `<div class="warn-box">⚠ 試験の間隔が2週間以内のところがあります：${ws.map((s) => esc(s.exam_.name.replace(/（.*?）/g, ""))).join("、")}</div>`;
    }
    // 系統図
    h += `<h2 class="section-title">資格のつながり</h2><p class="hint">✓ 合格済み　★ 受験予定　名前を押すと一覧のその資格に移動します。</p>`;
    h += (window.ROUTES || []).map((r) => `<article class="card route-card"><h3>${esc(r.title)}</h3>
      ${r.edges.map(([a, b, note]) => {
        const A = nodeInfo(a), B = nodeInfo(b);
        const node = (n) => `<button class="node ${n.passed ? "passed" : ""} ${n.starred ? "starred" : ""}" data-goto="${n.ex.id}" style="--c:${CATS[n.ex.cat].color}">${n.passed ? "✓ " : n.starred ? "★ " : ""}${esc(n.label)}</button>`;
        return `<div class="edge">${node(A)}<span class="arrow">→</span>${node(B)}${note ? `<div class="edge-note">${esc(note)}</div>` : ""}</div>`;
      }).join("")}</article>`).join("");
    document.getElementById("view-route").innerHTML = h;
  }

  const VIEWS = ["deadline", "list", "calendar", "route", "plan", "have"];
  // ---------- 全体 ----------
  function renderAll() {
    renderFilters(); renderDeadline(); renderList(); renderCalendar(); renderPlan(); renderRoute(); renderHave();
  }

  function setView(v) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.view === v));
    document.querySelectorAll(".view").forEach((s) => s.classList.toggle("is-active", s.id === `view-${v}`));
    const browse = ["deadline", "list", "calendar"].includes(v);
    document.getElementById("filters").style.display = browse ? "" : "none";
    document.getElementById("searchbar").style.display = browse ? "" : "none";
    if (location.hash.slice(1) !== v) history.replaceState(null, "", `#${v}`);
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    if (t.dataset.view) return setView(t.dataset.view);
    if (t.dataset.star) {
      const k = t.dataset.star;
      if (store.stars[k]) delete store.stars[k]; else store.stars[k] = true;
      save(); renderAll(); return;
    }
    if (t.dataset.cat !== undefined) {
      const c = t.dataset.cat;
      if (!c) store.cats = [];
      else store.cats = store.cats.includes(c) ? store.cats.filter((x) => x !== c) : [...store.cats, c];
      if (store.cats.length === Object.keys(CATS).length) store.cats = [];
      save(false); renderAll(); return;
    }
    if (t.dataset.pass) {
      const ex = EXAMS.find((e) => e.id === t.dataset.pass);
      store.passed = store.passed || {};
      store.passed[ex.id] = TODAY;
      save(); rebuild(); renderAll();
      toast(`${ex.name} を合格済みにしました`, ex.id);
      return;
    }
    if (t.dataset.passparts) { openPassDialog(t.dataset.passparts); return; }
    if (t.dataset.score) { openScoreDialog(t.dataset.score); return; }
    if (t.id === "scoreAdd") { addScore(); return; }
    if (t.dataset.delscore) {
      const ex = scoreEditing, [date] = t.dataset.delscore.split("|");
      store.scores[ex.id] = (store.scores[ex.id] || []).filter((sc) => sc.date !== date);
      if (!store.scores[ex.id].length) delete store.scores[ex.id];
      save(); renderAll(); openScoreDialog(ex.id); return;
    }
    if (t.dataset.step) {
      const k = t.dataset.key, st = t.dataset.step;
      store.progress[k] = { ...progOf(k) };
      if (store.progress[k][st]) delete store.progress[k][st];
      else {
        // 前の段階もまとめてチェック
        for (const [sk] of STEPS) { if (!store.progress[k][sk]) store.progress[k][sk] = TODAY; if (sk === st) break; }
      }
      if (!Object.keys(store.progress[k]).length) delete store.progress[k];
      save(); renderPlan(); return;
    }
    if (t.dataset.goto) {
      const id = t.dataset.goto;
      query = ""; const qi = document.getElementById("q"); if (qi) qi.value = "";
      if (store.cats.length && !store.cats.includes(EXAMS.find((e) => e.id === id).cat)) { store.cats = []; save(false); }
      renderAll(); setView("list");
      const el = document.getElementById(`ex-${id}`) || document.querySelector(`[data-exam="${id}"]`);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1600); }
      else toast("この資格は合格済みのため一覧に表示されていません");
      return;
    }
    if (t.dataset.setrenew) {
      const id = t.dataset.setrenew;
      store.licenses[id] = { ...licOf(id), renew: t.dataset.date };
      save(); renderHave(); return;
    }
    if (t.id === "passSave") { savePassDialog(); return; }
    if (t.id === "passCancel") { document.getElementById("passDlg").close(); return; }
    if (t.id === "toastUndo") {
      if (toastUndo) toastUndo();
      toastUndo = null;
      document.getElementById("toast").classList.remove("is-on");
      return;
    }
    if (t.dataset.unpass) {
      delete store.passed[t.dataset.unpass];
      save(); rebuild(); renderAll();
      const el = document.getElementById("toast"); if (el) el.classList.remove("is-on");
      return;
    }
    if (t.dataset.far) { showFar = true; renderDeadline(); return; }
    if (t.dataset.past) {
      const id = t.dataset.past;
      showPast.has(id) ? showPast.delete(id) : showPast.add(id);
      renderList(); return;
    }
    if (t.dataset.cal) {
      const [y, m] = calMonth.split("-").map(Number);
      const d = new Date(Date.UTC(y, m - 1 + Number(t.dataset.cal), 1));
      calMonth = toS(d).slice(0, 7);
      calSel = calMonth === TODAY.slice(0, 7) ? TODAY : `${calMonth}-01`;
      renderCalendar(); return;
    }
    if (t.dataset.day) { calSel = t.dataset.day; if (calSel.slice(0, 7) !== calMonth) calMonth = calSel.slice(0, 7); renderCalendar(); return; }
    if (t.id === "icsBtn") return downloadIcs();
    if (t.id === "settingsBtn") { renderSettings(); document.getElementById("settings").showModal(); return; }
    if (t.id === "settingsClose") { document.getElementById("settings").close(); return; }
    if (t.id === "syncConnect") { const v = document.getElementById("tokenInput").value; if (v.trim()) connect(v); return; }
    if (t.id === "syncNow") { pull(); return; }
    if (t.id === "syncOff") { if (confirm("この端末の同期を解除します（Gist のデータは消えません）")) disconnect(); return; }
    if (t.dataset.copy) {
      const text = document.getElementById(t.dataset.copy).textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast("コピーしました"), () => toast(text));
      return;
    }
  });

  window.addEventListener("hashchange", () => {
    const v = location.hash.slice(1);
    if (VIEWS.includes(v)) setView(v);
  });

  document.addEventListener("change", (e) => {
    if (e.target.id === "pref") { store.pref = e.target.value; save(); rebuild(); renderAll(); return; }
    if (e.target.dataset && e.target.dataset.fee) { store.feeChoice[e.target.dataset.fee] = Number(e.target.value); save(); renderPlan(); return; }
    if (e.target.id === "scTarget") {
      const v = Number(e.target.value);
      if (v > 0) store.targets[scoreEditing.id] = v; else delete store.targets[scoreEditing.id];
      save(); renderHave(); return;
    }
    if (e.target.dataset && e.target.dataset.lic) {
      const id = e.target.dataset.lic, f = e.target.dataset.field;
      store.licenses[id] = { ...licOf(id), [f]: e.target.value };
      if (!store.licenses[id][f]) delete store.licenses[id][f];
      save(); if (f === "renew") renderHave(); return;
    }
    if (e.target.dataset && e.target.dataset.passdate) {
      if (e.target.value) { store.passed[e.target.dataset.passdate] = e.target.value; save(); renderHave(); }
      return;
    }
    if (e.target.id === "calStar") { calStarOnly = e.target.checked; renderCalendar(); }
  });
  document.addEventListener("input", (e) => {
    const id = e.target.dataset && e.target.dataset.memo;
    if (id) { store.memo[id] = e.target.value; save(); return; }
    const lm = e.target.dataset && e.target.dataset.licmemo;
    if (lm) { store.licenses[lm] = { ...licOf(lm), memo: e.target.value }; save(); return; }
    if (e.target.dataset && e.target.dataset.sec !== undefined) {
      let t = 0; document.querySelectorAll("#passBody input[data-sec]").forEach((i) => { t += Number(i.value) || 0; });
      document.getElementById("scTotal").textContent = t; return;
    }
    if (e.target.id === "q") {
      query = e.target.value.trim();
      renderDeadline(); renderList(); renderCalendar();
    }
  });

  document.getElementById("today").textContent = `今日 ${fmt(TODAY, true)}`;
  document.getElementById("checked").textContent = fmt(window.DATA_CHECKED, true);
  if (AUTO.updated) document.getElementById("autoInfo").textContent = `危険物取扱者・消防設備士（全都道府県）とTOEICの日程は公式サイトから毎日自動で取り込んでいます（最終更新 ${fmt(AUTO.updated, true)}）。`;
  renderPref();
  renderAll();
  setSyncStatus(syncStatus);
  if (sync.gistId) pull();
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") pull(); });
  const initial = location.hash.slice(1);
  setView(VIEWS.includes(initial) ? initial : "deadline");
})();
