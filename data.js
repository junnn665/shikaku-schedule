// 資格試験データ
// 日付は "YYYY-MM-DD"。期間は [開始, 終了]。null は未発表・不明。
// 情報確認日: 2026-10-10。申込前に必ず公式サイトで最新情報を確認してください。
window.DATA_CHECKED = "2026-10-10";

window.CATEGORIES = {
  it: { label: "IT", color: "#2563eb" },
  money: { label: "簿記・会計・金融", color: "#059669" },
  lang: { label: "語学", color: "#db2777" },
  tech: { label: "技術・設備", color: "#d97706" },
  biz: { label: "ビジネス・AI", color: "#7c3aed" },
};

window.EXAMS = [
  // ───────── IT ─────────
  {
    id: "ap", name: "応用情報技術者試験（AP）", cat: "it", org: "IPA",
    url: "https://www.ipa.go.jp/shiken/2026/ap_koudo_sc_kikan.html",
    note: "令和8年度からCBT方式に全面移行。前期・後期とも申込は1回のみ。科目A群とB群を同時に予約。",
    sessions: [
      { label: "令和8年度 前期", apply: ["2026-10-06", "2026-11-07"], exam: ["2026-10-28", "2026-12-06"],
        detail: "科目A群 10/28〜11/10 ／ 科目B群 11/24〜12/6（申込締切 11/7 17時）" },
      { label: "令和8年度 後期", apply: ["2027-01-27", "2027-02-16"], exam: ["2027-02-06", "2027-03-15"],
        detail: "科目A群 2/6〜2/19 ／ 科目B群 3/3〜3/15" },
    ],
  },
  {
    id: "sc", name: "情報処理安全確保支援士試験（SC）", cat: "it", org: "IPA",
    url: "https://www.ipa.go.jp/shiken/2026/ap_koudo_sc_kikan.html",
    note: "CBT方式。前期・後期の年2回。",
    sessions: [
      { label: "令和8年度 前期", apply: ["2026-10-06", "2026-10-24"], exam: ["2026-10-17", "2026-11-23"],
        detail: "科目A群 10/17〜10/27 ／ 科目B 11/11〜11/23（申込締切 10/24 17時）" },
      { label: "令和8年度 後期", apply: ["2027-01-27", "2027-02-27"], exam: ["2027-02-20", "2027-03-28"],
        detail: "科目A群 2/20〜3/2 ／ 科目B 3/16〜3/28" },
    ],
  },
  {
    id: "koudo-zenki", name: "高度試験 前期（ST・SA・NW・SM）", cat: "it", org: "IPA",
    url: "https://www.ipa.go.jp/shiken/2026/ap_koudo_sc_kikan.html",
    note: "ITストラテジスト／システムアーキテクト／ネットワークスペシャリスト／ITサービスマネージャ。CBT方式。",
    sessions: [
      { label: "令和8年度 前期", apply: ["2026-10-06", "2026-10-24"], exam: ["2026-10-17", "2026-11-23"],
        detail: "科目A群 10/17〜10/27 ／ 科目B群 11/11〜11/23（申込締切 10/24 17時）" },
    ],
  },
  {
    id: "koudo-kouki", name: "高度試験 後期（PM・DB・ES・AU）", cat: "it", org: "IPA",
    url: "https://www.ipa.go.jp/shiken/2026/ap_koudo_sc_kikan.html",
    note: "プロジェクトマネージャ／データベーススペシャリスト／エンベデッド／システム監査。CBT方式。",
    sessions: [
      { label: "令和8年度 後期", apply: ["2027-01-27", "2027-02-27"], exam: ["2027-02-20", "2027-03-28"],
        detail: "科目A群 2/20〜3/2 ／ 科目B群 3/16〜3/28" },
    ],
  },
  {
    id: "fe", name: "基本情報技術者試験（FE）", cat: "it", org: "IPA", anytime: true,
    url: "https://www.ipa.go.jp/shiken/kubun/fe.html",
    note: "CBT方式の通年試験。テストセンターの空きがあれば随時申込・受験可能。", sessions: [],
  },
  {
    id: "ip", name: "ITパスポート試験", cat: "it", org: "IPA", anytime: true,
    url: "https://www3.jitec.ipa.go.jp/JitesCbt/",
    note: "CBT方式の通年試験。随時申込・受験可能。", sessions: [],
  },
  {
    id: "sg", name: "情報セキュリティマネジメント試験（SG）", cat: "it", org: "IPA", anytime: true,
    url: "https://www.ipa.go.jp/shiken/kubun/sg.html",
    note: "CBT方式の通年試験。随時申込・受験可能。", sessions: [],
  },
  {
    id: "aws", name: "AWS認定", cat: "it", org: "Amazon Web Services", anytime: true,
    url: "https://aws.amazon.com/jp/certification/",
    note: "ピアソンVUEのテストセンター／オンラインで通年受験可能。", sessions: [],
  },

  // ───────── 簿記・会計・金融 ─────────
  {
    id: "boki1", name: "日商簿記検定 1級", cat: "money", org: "日本商工会議所",
    url: "https://www.kentei.ne.jp/bookkeeping",
    note: "1級は紙の統一試験のみ（年2回：6月・11月）。申込期間は受験地の商工会議所ごとに異なります。",
    sessions: [
      { label: "第174回", apply: ["2026-09-28", "2026-10-13"], exam: ["2026-11-15", "2026-11-15"],
        detail: "申込期間は京都商工会議所の例（名古屋は 10/2〜10/9）。受験地の商工会議所で確認を。" },
    ],
  },
  {
    id: "boki23", name: "日商簿記検定 2級・3級", cat: "money", org: "日本商工会議所",
    url: "https://www.kentei.ne.jp/bookkeeping",
    note: "2026年度から2・3級はネット試験（CBT・随時）が中心。紙の統一試験は第175回（2027/2/28）が移行措置として実施されますが、施行しない商工会議所もあります。",
    sessions: [
      { label: "第175回（紙・統一試験）", apply: null, exam: ["2027-02-28", "2027-02-28"],
        detail: "申込期間は商工会議所ごと（未確認）。ネット試験は随時受験可能。" },
    ],
  },
  {
    id: "fp1", name: "FP技能検定 1級 学科", cat: "money", org: "金融財政事情研究会（きんざい）",
    url: "https://www.kinzai.or.jp/fp",
    note: "1級学科は紙の試験。実技（きんざい）は2027年2月予定、申込は11月中旬〜12月中旬見込み。",
    sessions: [
      { label: "2027年1月試験", apply: ["2026-10-28", "2026-12-01"], exam: ["2027-01-24", "2027-01-24"],
        detail: "合格発表 2027/3/5" },
    ],
  },
  {
    id: "fp23", name: "FP技能検定 2級・3級", cat: "money", org: "きんざい／日本FP協会", anytime: true,
    url: "https://www.jafp.or.jp/exam/",
    note: "CBT方式で通年実施（休止期間あり。年度末の3月下旬〜、年末年始など）。", sessions: [],
  },
  {
    id: "takken", name: "宅地建物取引士（宅建）", cat: "money", org: "不動産適正取引推進機構",
    url: "https://www.retio.or.jp/exam/",
    note: "年1回・10月第3日曜が通例。申込は例年7月（ネット7/1〜7/31、郵送7/1〜7/15）。",
    sessions: [
      { label: "令和8年度", apply: ["2026-07-01", "2026-07-31"], exam: ["2026-10-18", "2026-10-18"],
        detail: "合格発表 2026/11/25。次回（令和9年度）は2027年7月申込の見込み。" },
    ],
  },

  // ───────── 語学 ─────────
  {
    id: "toeic", name: "TOEIC L&R 公開テスト", cat: "lang", org: "IIBC",
    url: "https://www.iibc-global.org/toeic/test/lr/guide01/schedule.html",
    note: "午前・午後の1日2回実施。申込はインターネット（締切は15:00）。",
    sessions: [
      ["2026-10-25", "2026-07-29", "2026-09-10"],
      ["2026-11-15", "2026-08-17", "2026-10-05"],
      ["2026-12-06", "2026-09-11", "2026-10-26"],
      ["2026-12-19", "2026-10-06", "2026-11-11"],
      ["2027-01-10", "2026-10-27", "2026-11-26"],
      ["2027-01-24", "2026-11-11", "2026-12-09"],
      ["2027-02-14", "2026-11-27", "2027-01-07"],
      ["2027-03-06", "2026-12-10", "2027-01-27"],
      ["2027-03-14", "2027-01-06", "2027-02-03"],
    ].map(([d, a1, a2]) => ({ label: d.slice(0, 4) + "/" + Number(d.slice(5, 7)) + "/" + Number(d.slice(8)) + " 実施回", apply: [a1, a2], exam: [d, d], detail: "締切は最終日 15:00" })),
  },
  {
    id: "eiken", name: "実用英語技能検定（英検）", cat: "lang", org: "日本英語検定協会",
    url: "https://www.eiken.or.jp/eiken/schedule/",
    note: "従来型・本会場の日程。準会場・英検S-CBTは別日程。",
    sessions: [
      { label: "2026年度 第3回", apply: ["2026-10-30", "2026-12-14"], exam: ["2027-01-24", "2027-01-24"],
        detail: "コンビニ払いは12/11締切。二次（1〜3級）A日程 2/28・B日程 3/7（年齢で指定）" },
    ],
  },

  // ───────── 技術・設備 ─────────
  {
    id: "denken3", name: "第三種電気主任技術者（電験三種）", cat: "tech", org: "電気技術者試験センター",
    url: "https://www.shiken.or.jp/",
    note: "上期・下期の年2回。CBT方式か筆記方式を選択。",
    sessions: [
      { label: "令和8年度 下期", apply: ["2026-11-09", "2026-11-26"], exam: ["2027-02-04", "2027-03-21"],
        detail: "CBT 2/4〜2/28 ／ 筆記 3/21。CBT会場予約は 12/7〜1/7（予約しないと受験不可）" },
    ],
  },
  {
    id: "kikenbutsu", name: "危険物取扱者（甲・乙・丙）", cat: "tech", org: "消防試験研究センター", regional: true,
    url: "https://shinsei.shoubo-shiken.or.jp/shoubou_ia/iajs9001.do?menjo_kbn=1",
    note: "都道府県ごとに年数回〜毎月実施（東京などは頻繁）。日程と申込期間は受験地の一覧で確認。", sessions: [],
  },
  {
    id: "shoubou", name: "消防設備士（甲・乙）", cat: "tech", org: "消防試験研究センター", regional: true,
    url: "https://shinsei.shoubo-shiken.or.jp/shoubou_ia/iajs9001.do?menjo_kbn=2",
    note: "都道府県ごとに実施。日程と申込期間は受験地の一覧で確認。", sessions: [],
  },
  {
    id: "kenchiku", name: "建築施工管理技士", cat: "tech", org: "建設業振興基金",
    url: "https://www.fcip-shiken.jp/",
    note: "令和8年度の申込は受付終了。来年度の申込は例年1級が1〜2月、2級（前期）が2〜3月頃。",
    sessions: [
      { label: "1級 第二次検定", apply: null, exam: ["2026-10-18", "2026-10-18"], detail: "合格発表 2027/1/8" },
      { label: "2級 第一次（後期）・第二次", apply: null, exam: ["2026-11-08", "2026-11-08"], detail: "一次発表 12/21 ／ 二次発表 2027/2/5" },
    ],
  },
  {
    id: "doboku", name: "土木施工管理技士", cat: "tech", org: "全国建設研修センター",
    url: "https://www.jctc.jp/",
    note: "令和8年度の申込は受付終了。",
    sessions: [
      { label: "1級 第二次検定", apply: null, exam: ["2026-10-04", "2026-10-04"], detail: "合格発表 2027/1/8" },
      { label: "2級 第一次（後期）・第二次", apply: null, exam: ["2026-10-25", "2026-10-25"], detail: "一次発表 12/2 ／ 二次発表 2027/2/3" },
    ],
  },
  {
    id: "kankouji", name: "管工事施工管理技士", cat: "tech", org: "全国建設研修センター",
    url: "https://www.jctc.jp/",
    note: "令和8年度の申込は受付終了。",
    sessions: [
      { label: "2級 第一次（後期）・第二次", apply: null, exam: ["2026-11-15", "2026-11-15"], detail: "一次発表 2027/1/5 ／ 二次発表 3/3" },
      { label: "1級 第二次検定", apply: null, exam: ["2026-12-06", "2026-12-06"], detail: "合格発表 2027/3/3" },
    ],
  },
  {
    id: "zouen", name: "造園施工管理技士", cat: "tech", org: "全国建設研修センター",
    url: "https://www.jctc.jp/",
    note: "令和8年度の申込は受付終了。",
    sessions: [
      { label: "2級 第一次（後期）・第二次", apply: null, exam: ["2026-11-15", "2026-11-15"], detail: "一次発表 2027/1/5 ／ 二次発表 3/3" },
      { label: "1級 第二次検定", apply: null, exam: ["2026-12-06", "2026-12-06"], detail: "合格発表 2027/3/3" },
    ],
  },

  // ───────── ビジネス・AI ─────────
  {
    id: "bijihou", name: "ビジネス実務法務検定", cat: "biz", org: "東京商工会議所",
    url: "https://kentei.tokyo-cci.or.jp/houmu/",
    note: "2・3級はIBT/CBT方式で年2シーズン。1級は年1回。",
    sessions: [
      { label: "2・3級 第2シーズン", apply: ["2026-09-16", "2026-09-29"], exam: ["2026-10-22", "2026-11-09"], detail: "期間内に受験日時を選択" },
      { label: "1級", apply: ["2026-11-04", "2026-11-11"], exam: ["2026-12-06", "2026-12-06"], detail: "申込締切 11/11 18:00" },
    ],
  },
  {
    id: "gkentei", name: "G検定（ジェネラリスト検定）", cat: "biz", org: "日本ディープラーニング協会",
    url: "https://www.jdla.org/certificate/general/",
    note: "オンライン（自宅）試験が中心。2027年は第1・3・5回に会場試験あり。",
    sessions: [
      { label: "2026 第6回（オンライン）", apply: ["2026-09-11", "2026-10-29"], exam: ["2026-11-06", "2026-11-07"], detail: "11/6(金)16時 または 11/7(土)13時" },
      { label: "2027 第1回（会場）", apply: ["2026-11-13", "2027-01-12"], exam: ["2027-01-15", "2027-01-17"], detail: "申込は受験日の3日前まで" },
      { label: "2027 第1回（オンライン）", apply: ["2026-11-13", "2027-01-08"], exam: ["2027-01-16", "2027-01-16"], detail: "合否発表 2月上旬" },
      { label: "2027 第2回（オンライン）", apply: ["2027-01-22", "2027-02-25"], exam: ["2027-03-05", "2027-03-06"], detail: "" },
      { label: "2027 第3回（オンライン）", apply: ["2027-03-12", "2027-04-27"], exam: ["2027-05-08", "2027-05-08"], detail: "会場試験は 5/7〜5/9" },
      { label: "2027 第4回（オンライン）", apply: ["2027-05-14", "2027-06-24"], exam: ["2027-07-02", "2027-07-03"], detail: "" },
      { label: "2027 第5回（オンライン）", apply: ["2027-07-09", "2027-08-27"], exam: ["2027-09-04", "2027-09-04"], detail: "会場試験は 9/3〜9/5" },
      { label: "2027 第6回（オンライン）", apply: ["2027-09-10", "2027-10-28"], exam: ["2027-11-05", "2027-11-06"], detail: "" },
    ],
  },
];
