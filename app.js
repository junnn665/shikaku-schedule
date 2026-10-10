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
    let s = { stars: {}, memo: {}, cats: [] };
    try { s = { ...s, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) { /* 使えない環境 */ }
    return s;
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 無視 */ } };

  // ---------- データ整形 ----------
  const CATS = window.CATEGORIES;
  const EXAMS = window.EXAMS;
  const SESSIONS = [];
  EXAMS.forEach((ex) => {
    ex.sessions.forEach((s, i) => SESSIONS.push({ ...s, key: `${ex.id}#${i}`, exam_: ex }));
  });

  function statusOf(s) {
    if (s.exam && s.exam[1] < TODAY) return { code: "past", label: "終了", cls: "st-closed" };
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
  const isStar = (key) => !!store.stars[key];

  // ---------- 部品 ----------
  const starBtn = (key) => `<button class="star ${isStar(key) ? "is-on" : ""}" data-star="${key}" aria-label="受験予定に追加" title="受験予定に追加">${isStar(key) ? "★" : "☆"}</button>`;
  const catStyle = (ex) => `style="--cat:${CATS[ex.cat].color}"`;
  const subLine = (ex) => `<div class="sub">${esc(CATS[ex.cat].label)} ・ ${esc(ex.org)}</div>`;
  const officialLink = (ex) => `<div class="links"><a href="${esc(ex.url)}" target="_blank" rel="noopener">公式・出典ページ ↗</a></div>`;

  function sessionCard(s) {
    const ex = s.exam_, st = statusOf(s);
    const cd = st.n != null && st.code !== "past"
      ? `<div class="countdown ${st.code === "open" && st.n <= 7 ? "urgent" : ""}"><div class="n">${st.n === 0 && st.code === "open" ? "!" : st.n}</div><div class="u">${st.unit}</div></div>` : "";
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
        </dl>
        ${s.detail ? `<div class="detail">${esc(s.detail)}</div>` : ""}
        ${officialLink(ex)}
      </article>`;
  }

  function simpleExamCard(ex, extra = "") {
    const key = `${ex.id}#any`;
    return `
      <article class="card" ${catStyle(ex)}>
        <div class="card-head">
          ${starBtn(key)}
          <div class="card-title"><h3>${esc(ex.name)}</h3>${subLine(ex)}</div>
        </div>
        <p class="note">${esc(ex.note)}</p>
        ${officialLink(ex)}
        ${extra}
      </article>`;
  }

  // ---------- フィルター ----------
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
    const list = SESSIONS.filter((s) => catOn(s.exam_.cat));
    const open = list.filter((s) => statusOf(s).code === "open").sort((a, b) => a.apply[1].localeCompare(b.apply[1]));
    const before = list.filter((s) => statusOf(s).code === "before").sort((a, b) => a.apply[0].localeCompare(b.apply[0]));
    const anytime = EXAMS.filter((e) => (e.anytime || e.regional) && catOn(e.cat));

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
      const exams = EXAMS.filter((e) => e.cat === k);
      if (!exams.length) continue;
      h += `<h2 class="section-title">${esc(c.label)}</h2>`;
      for (const ex of exams) {
        if (!ex.sessions.length) { h += simpleExamCard(ex); continue; }
        const ss = SESSIONS.filter((s) => s.exam_ === ex);
        const past = ss.filter((s) => statusOf(s).code === "past");
        const visible = showPast.has(ex.id) ? ss : ss.filter((s) => statusOf(s).code !== "past");
        h += `
          <article class="card" ${catStyle(ex)}>
            <div class="card-head"><div class="card-title"><h3>${esc(ex.name)}</h3>${subLine(ex)}</div></div>
            <p class="note">${esc(ex.note)}</p>
            <div class="sessions">
              ${visible.length ? visible.map((s) => {
                const st = statusOf(s);
                return `<div class="session ${st.code === "past" ? "is-past" : ""}">
                  ${starBtn(s.key)}
                  <div class="session-body">
                    <div class="session-label">${esc(s.label)} <span class="status ${st.cls}">${st.label}</span></div>
                    <div class="session-dates">申込 <b>${s.apply ? fmtRange(s.apply) : "要確認"}</b></div>
                    <div class="session-dates">試験 <b>${fmtRange(s.exam)}</b></div>
                    ${s.detail ? `<div class="detail">${esc(s.detail)}</div>` : ""}
                  </div></div>`;
              }).join("") : `<div class="detail" style="padding:10px 0">今後の予定は未掲載です</div>`}
            </div>
            ${past.length ? `<button class="toggle-past" data-past="${ex.id}">${showPast.has(ex.id) ? "終了した回を隠す" : `終了した回を表示（${past.length}）`}</button>` : ""}
            ${officialLink(ex)}
          </article>`;
      }
    }
    document.getElementById("view-list").innerHTML = h || `<div class="empty">該当する資格がありません</div>`;
  }

  // ---------- カレンダー ----------
  let calMonth = TODAY.slice(0, 7);
  let calSel = TODAY;
  let calStarOnly = false;

  function calEvents() {
    const map = {};
    const add = (d, ev) => (map[d] ||= []).push(ev);
    for (const s of SESSIONS) {
      if (!catOn(s.exam_.cat)) continue;
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
    }
    const order = { end: 0, exam: 1, start: 2 };
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
      const labels = evs.slice(0, 3).map((e) => `<div class="ev k-${e.kind}" style="--c:${e.color}">${e.kind === "end" ? "締" : e.kind === "start" ? "申" : "試"} ${esc(shortName(e.s.exam_))}</div>`).join("")
        + (evs.length > 3 ? `<div class="ev more">+${evs.length - 3}</div>` : "");
      const dots = evs.slice(0, 8).map((e) => `<i class="mk-${e.kind}"></i>`).join("");
      grid += `<button class="${cls}" data-day="${d}"><span class="num">${Number(d.slice(8))}</span>${labels}<span class="dots">${dots}</span></button>`;
    }

    const sel = map[calSel] || [];
    const kindLabel = { start: "申込開始", end: "申込締切", exam: "試験" };
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
        <label style="margin-left:auto;cursor:pointer"><input type="checkbox" id="calStar" ${calStarOnly ? "checked" : ""}> ☆だけ表示</label>
      </div>
      <div class="cal">${grid}</div>
      ${dayList}`;
  }

  // ---------- 受験予定 ----------
  function renderPlan() {
    const starredSessions = SESSIONS.filter((s) => isStar(s.key));
    const starredAny = EXAMS.filter((e) => isStar(`${e.id}#any`));
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
    h += `<h2 class="section-title">これからの予定</h2>`;
    h += upcoming.length ? upcoming.map(sessionCard).join("") : `<div class="empty">今後の予定はありません</div>`;
    if (starredAny.length) {
      h += `<h2 class="section-title">随時・地域ごとの試験</h2>` + starredAny.map((e) => simpleExamCard(e)).join("");
    }
    h += `<h2 class="section-title">メモ</h2>`;
    for (const id of examIds) {
      const ex = EXAMS.find((e) => e.id === id);
      h += `<article class="card" ${catStyle(ex)}><div class="card-title"><h3>${esc(ex.name)}</h3></div>
        <textarea class="memo" data-memo="${id}" placeholder="教材、勉強の進み具合、受験料など">${esc(store.memo[id] || "")}</textarea></article>`;
    }
    if (past.length) h += `<h2 class="section-title">終了した回</h2>` + past.map(sessionCard).join("");
    document.getElementById("view-plan").innerHTML = h;
  }

  function downloadIcs() {
    const ss = SESSIONS.filter((s) => isStar(s.key) && statusOf(s).code !== "past");
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
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "shikaku-schedule.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- 全体 ----------
  function renderAll() {
    renderFilters(); renderDeadline(); renderList(); renderCalendar(); renderPlan();
  }

  function setView(v) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.view === v));
    document.querySelectorAll(".view").forEach((s) => s.classList.toggle("is-active", s.id === `view-${v}`));
    document.getElementById("filters").style.display = v === "plan" ? "none" : "";
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
      save(); renderAll(); return;
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
  });

  window.addEventListener("hashchange", () => {
    const v = location.hash.slice(1);
    if (["deadline", "list", "calendar", "plan"].includes(v)) setView(v);
  });

  document.addEventListener("change", (e) => {
    if (e.target.id === "calStar") { calStarOnly = e.target.checked; renderCalendar(); }
  });
  document.addEventListener("input", (e) => {
    const id = e.target.dataset && e.target.dataset.memo;
    if (id) { store.memo[id] = e.target.value; save(); }
  });

  document.getElementById("today").textContent = `今日 ${fmt(TODAY, true)}`;
  document.getElementById("checked").textContent = fmt(window.DATA_CHECKED, true);
  renderAll();
  const initial = location.hash.slice(1);
  setView(["deadline", "list", "calendar", "plan"].includes(initial) ? initial : "deadline");
})();
