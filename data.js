// 資格試験データ
// 日付は "YYYY-MM-DD"。pref を付けた回はその受験地を選んだときだけ表示。fallback は該当受験地の回がないときに表示。
//期間は [開始, 終了]。null は未発表・不明。
// parts: 合格を区分ごとに記録する単位 [[id, 表示名]]。回の parts はその回で受けられる区分（省略時は全区分）。
// fees: 受験料 [{label, yen}]。announce: 合格発表日（確定日）、announceText: 時期だけ分かっている場合。
// 情報確認日: 2026-10-10。申込前に必ず公式サイトで最新情報を確認してください。
window.DATA_CHECKED = "2026-10-10";

window.CATEGORIES = {
  it: { label: "IT", color: "#2563eb" },
  money: { label: "簿記・会計・金融", color: "#059669" },
  lang: { label: "語学", color: "#db2777" },
  tech: { label: "技術・設備", color: "#d97706" },
  law: { label: "法律・不動産・経営", color: "#0891b2" },
  biz: { label: "ビジネス・AI", color: "#7c3aed" },
};

window.EXAMS = [
  // ───────── IT ─────────
  {
    id: "ap", name: "応用情報技術者試験（AP）", cat: "it", org: "IPA",
    url: "https://www.ipa.go.jp/shiken/2026/ap_koudo_sc_kikan.html",
    fees: [{ label: "", yen: 7500 }],
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
    fees: [{ label: "", yen: 7500 }],
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
    parts: [["ST","ITストラテジスト"],["SA","システムアーキテクト"],["NW","ネットワークスペシャリスト"],["SM","ITサービスマネージャ"]],
    fees: [{ label: "", yen: 7500 }],
    note: "ITストラテジスト／システムアーキテクト／ネットワークスペシャリスト／ITサービスマネージャ。CBT方式。",
    sessions: [
      { label: "令和8年度 前期", apply: ["2026-10-06", "2026-10-24"], exam: ["2026-10-17", "2026-11-23"],
        detail: "科目A群 10/17〜10/27 ／ 科目B群 11/11〜11/23（申込締切 10/24 17時）" },
    ],
  },
  {
    id: "koudo-kouki", name: "高度試験 後期（PM・DB・ES・AU）", cat: "it", org: "IPA",
    url: "https://www.ipa.go.jp/shiken/2026/ap_koudo_sc_kikan.html",
    parts: [["PM","プロジェクトマネージャ"],["DB","データベーススペシャリスト"],["ES","エンベデッドシステムスペシャリスト"],["AU","システム監査技術者"]],
    fees: [{ label: "", yen: 7500 }],
    note: "プロジェクトマネージャ／データベーススペシャリスト／エンベデッド／システム監査。CBT方式。",
    sessions: [
      { label: "令和8年度 後期", apply: ["2027-01-27", "2027-02-27"], exam: ["2027-02-20", "2027-03-28"],
        detail: "科目A群 2/20〜3/2 ／ 科目B群 3/16〜3/28" },
    ],
  },
  {
    id: "fe", name: "基本情報技術者試験（FE）", cat: "it", org: "IPA", anytime: true,
    url: "https://www.ipa.go.jp/shiken/kubun/fe.html",
    fees: [{ label: "", yen: 7500 }],
    note: "CBT方式の通年試験。テストセンターの空きがあれば随時申込・受験可能。", sessions: [],
  },
  {
    id: "ip", name: "ITパスポート試験", cat: "it", org: "IPA", anytime: true,
    url: "https://www3.jitec.ipa.go.jp/JitesCbt/",
    fees: [{ label: "", yen: 7500 }],
    note: "CBT方式の通年試験。随時申込・受験可能。", sessions: [],
  },
  {
    id: "sg", name: "情報セキュリティマネジメント試験（SG）", cat: "it", org: "IPA", anytime: true,
    url: "https://www.ipa.go.jp/shiken/kubun/sg.html",
    fees: [{ label: "", yen: 7500 }],
    note: "CBT方式の通年試験。随時申込・受験可能。", sessions: [],
  },
  {
    id: "aws", name: "AWS認定", cat: "it", org: "Amazon Web Services", anytime: true,
    url: "https://aws.amazon.com/jp/certification/",
    note: "ピアソンVUEのテストセンター／オンラインで通年受験可能。", sessions: [],
  },

  {
    id: "mos", name: "MOS（Microsoft Office Specialist）", cat: "it", org: "オデッセイコミュニケーションズ", anytime: true,
    url: "https://mos.odyssey-com.co.jp/",
    note: "全国一斉試験（毎月）と随時試験（各試験会場）がある。Word・Excel・PowerPoint など科目ごと。",
    parts: [["Word", "Word"], ["Excel", "Excel"], ["PowerPoint", "PowerPoint"], ["Excelエキスパート", "Excel エキスパート"], ["Wordエキスパート", "Word エキスパート"]],
    sessions: [],
  },

  // ───────── 簿記・会計・金融 ─────────
  {
    id: "boki1", name: "日商簿記検定 1級", cat: "money", org: "日本商工会議所",
    url: "https://www.kentei.ne.jp/bookkeeping",
    fees: [{ label: "", yen: 8800 }], feeNote: "別途、事務手数料がかかる場合あり",
    note: "1級は紙の統一試験のみ（年2回：6月・11月）。申込期間は受験地の商工会議所ごとに異なります。",
    sessions: [
      { label: "第174回（名古屋商工会議所）", pref: "愛知県", apply: ["2026-10-02", "2026-10-09"], exam: ["2026-11-15", "2026-11-15"], announce: "2027-01-04",
        detail: "個人申込。会場は名古屋商工会議所のみ" },
      { label: "第174回（京都商工会議所）", pref: "京都府", apply: ["2026-09-28", "2026-10-13"], exam: ["2026-11-15", "2026-11-15"],
        detail: "" },
      { label: "第174回", fallback: true, apply: null, exam: ["2026-11-15", "2026-11-15"],
        detail: "申込期間は受験地の商工会議所ごとに異なります（例年9月下旬〜10月中旬）。" },
    ],
  },
  {
    id: "boki23", name: "日商簿記検定 2級・3級", cat: "money", org: "日本商工会議所",
    url: "https://www.kentei.ne.jp/bookkeeping",
    parts: [["2級","2級"],["3級","3級"]],
    fees: [{ label: "2級", yen: 5500 }, { label: "3級", yen: 3300 }], feeNote: "ネット試験は別途事務手数料あり（商工会議所・テストセンターにより異なる）",
    prefNote: { "愛知県": "名古屋商工会議所は2・3級の紙の試験を実施しません（ネット試験を案内）。第175回を紙で受けるなら県内の他の商工会議所で要確認。" },
    note: "2026年度から2・3級はネット試験（CBT・随時）が中心。紙の統一試験は第175回（2027/2/28）が移行措置として実施されますが、施行しない商工会議所もあります。",
    sessions: [
      { label: "第175回（紙・統一試験）", apply: null, exam: ["2027-02-28", "2027-02-28"],
        detail: "申込期間は商工会議所ごと（未確認）。ネット試験は随時受験可能。" },
    ],
  },
  {
    id: "fp1", name: "FP技能検定 1級", cat: "money", org: "金融財政事情研究会（きんざい）",
    url: "https://www.kinzai.or.jp/fp",
    parts: [["学科","1級 学科"],["実技","1級 実技"]],
    fees: [{ label: "学科", yen: 8900 }, { label: "実技（資産相談業務）", yen: 28000 }],
    note: "1級学科は紙の試験。実技（きんざい）は2027年2月予定、申込は11月中旬〜12月中旬見込み。",
    sessions: [
      { label: "2027年1月試験", parts: ["学科"], apply: ["2026-10-28", "2026-12-01"], exam: ["2027-01-24", "2027-01-24"], announce: "2027-03-05",
        detail: "" },
    ],
  },
  {
    id: "fp23", name: "FP技能検定 2級・3級", cat: "money", org: "きんざい／日本FP協会", anytime: true,
    url: "https://www.jafp.or.jp/exam/",
    parts: [["2級学科","2級 学科"],["2級実技","2級 実技"],["3級学科","3級 学科"],["3級実技","3級 実技"]],
    fees: [{ label: "2級 学科＋実技", yen: 11700 }, { label: "3級 学科＋実技", yen: 8000 }, { label: "2級 学科のみ", yen: 5700 }, { label: "3級 学科のみ", yen: 4000 }],
    note: "CBT方式で通年実施（休止期間あり。年度末の3月下旬〜、年末年始など）。", sessions: [],
  },
  {
    id: "takken", name: "宅地建物取引士（宅建）", cat: "law", org: "不動産適正取引推進機構",
    url: "https://www.retio.or.jp/exam/",
    fees: [{ label: "", yen: 8200 }],
    note: "年1回・10月第3日曜が通例。申込は例年7月（ネット7/1〜7/31、郵送7/1〜7/15）。",
    sessions: [
      { label: "令和8年度", apply: ["2026-07-01", "2026-07-31"], exam: ["2026-10-18", "2026-10-18"], announce: "2026-11-25",
        detail: "次回（令和9年度）は2027年7月申込の見込み。" },
    ],
  },

  // ───────── 語学 ─────────
  {
    id: "toeic", name: "TOEIC L&R 公開テスト", cat: "lang", org: "IIBC",
    url: "https://www.iibc-global.org/toeic/test/lr/guide01/schedule.html",
    fees: [{ label: "紙の認定証あり", yen: 7810 }, { label: "紙の認定証なし", yen: 7700 }], feeNote: "リピート受験割引あり",
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
    parts: [["1級","1級"],["準1級","準1級"],["2級","2級"],["準2級プラス","準2級プラス"],["準2級","準2級"],["3級","3級"],["4級","4級"],["5級","5級"]],
    fees: [{ label: "2級", yen: 9000 }, { label: "準1級", yen: 10400 }, { label: "1級", yen: 12400 }, { label: "準2級", yen: 8400 }, { label: "3級", yen: 6800 }], feeNote: "本会場の目安（2024年改定時点）。最新は公式で確認",
    note: "従来型・本会場の日程。準会場・英検S-CBTは別日程。",
    sessions: [
      { label: "2026年度 第3回", apply: ["2026-10-30", "2026-12-14"], exam: ["2027-01-24", "2027-01-24"],
        detail: "コンビニ払いは12/11締切。二次（1〜3級）A日程 2/28・B日程 3/7（年齢で指定）", extra: [{ date: "2027-02-28", text: "英検 二次A日程" }, { date: "2027-03-07", text: "英検 二次B日程" }] },
    ],
  },

  // ───────── 技術・設備 ─────────
  {
    id: "denken3", name: "第三種電気主任技術者（電験三種）", cat: "tech", org: "電気技術者試験センター",
    url: "https://www.shiken.or.jp/",
    parts: [["理論","理論"],["電力","電力"],["機械","機械"],["法規","法規"]], partsNote: "科目合格は3年間有効",
    fees: [{ label: "", yen: 7700 }],
    note: "上期・下期の年2回。CBT方式か筆記方式を選択。",
    sessions: [
      { label: "令和8年度 下期", apply: ["2026-11-09", "2026-11-26"], exam: ["2027-02-04", "2027-03-21"], announceText: "2027年4月上旬頃（Web公表）",
        detail: "CBT 2/4〜2/28 ／ 筆記 3/21。CBT会場予約は 12/7〜1/7（予約しないと受験不可）" },
    ],
  },
  {
    id: "kikenbutsu", name: "危険物取扱者（甲・乙・丙）", cat: "tech", org: "消防試験研究センター", regional: true,
    url: "https://shinsei.shoubo-shiken.or.jp/shoubou_ia/iajs9001.do?menjo_kbn=1",
    parts: [["甲","甲種"],["乙1","乙種1類"],["乙2","乙種2類"],["乙3","乙種3類"],["乙4","乙種4類"],["乙5","乙種5類"],["乙6","乙種6類"],["丙","丙種"]],
    fees: [{ label: "乙種", yen: 5300 }, { label: "甲種", yen: 7200 }, { label: "丙種", yen: 4200 }], feeNote: "2024年5月改定後の標準額。都道府県の条例で決まるため受験地で確認",
    note: "都道府県ごとに年数回〜毎月実施。選んだ受験地の日程を表示します（公式の全国日程から毎日自動取り込み）。",
        sessions: [
      ...[
        ["2026-11-22", "2026-10-09", "2026-10-19", "甲・乙1〜6・丙"],
        ["2026-11-29", "2026-10-09", "2026-10-19", "甲・乙1〜6・丙"],
        ["2026-12-20", "2026-11-06", "2026-11-16", "甲・乙1〜6・丙"],
        ["2027-01-17", "2026-12-04", "2026-12-14", "甲・乙1〜6・丙"],
        ["2027-01-24", "2026-12-04", "2026-12-14", "甲・乙1〜6・丙"],
        ["2027-03-07", "2027-01-29", "2027-02-08", "乙4・丙のみ。電子申請のみ"],
      ].map(([d, a1, a2, t]) => ({ label: `愛知 ${Number(d.slice(5, 7))}/${Number(d.slice(8))}`, pref: "愛知県", apply: [a1, a2], exam: [d, d], detail: t })),
    ],
  },
  {
    id: "shoubou", name: "消防設備士（甲・乙）", cat: "tech", org: "消防試験研究センター", regional: true,
    url: "https://shinsei.shoubo-shiken.or.jp/shoubou_ia/iajs9001.do?menjo_kbn=2",
    parts: [["甲特","甲種特類"],["甲1","甲種1類"],["甲2","甲種2類"],["甲3","甲種3類"],["甲4","甲種4類"],["甲5","甲種5類"],["乙1","乙種1類"],["乙2","乙種2類"],["乙3","乙種3類"],["乙4","乙種4類"],["乙5","乙種5類"],["乙6","乙種6類"],["乙7","乙種7類"]],
    fees: [{ label: "乙種", yen: 4400 }, { label: "甲種", yen: 6600 }], feeNote: "2024年5月改定後の標準額。受験地で確認",
    note: "都道府県ごとに実施。選んだ受験地の日程を表示します（公式の全国日程から毎日自動取り込み）。",
        sessions: [
      { label: "愛知 2/14", pref: "愛知県", apply: ["2027-01-04", "2027-01-12"], exam: ["2027-02-14", "2027-02-14"],
        detail: "甲種（特類・1〜5類）・乙種（1〜7類）。電子・書面とも同じ受付期間" },
    ],
  },
  {
    id: "kenchiku", name: "建築施工管理技士", cat: "tech", org: "建設業振興基金",
    url: "https://www.fcip-shiken.jp/",
    parts: [["1級一次","1級 第一次検定"],["1級二次","1級 第二次検定"],["2級一次","2級 第一次検定"],["2級二次","2級 第二次検定"]],
    note: "令和8年度の申込は受付終了。来年度の申込は例年1級が1〜2月、2級（前期）が2〜3月頃。",
    sessions: [
      { label: "1級 第二次検定", parts: ["1級二次"], apply: null, exam: ["2026-10-18", "2026-10-18"], announce: "2027-01-08", detail: "" },
      { label: "2級 第一次（後期）・第二次", parts: ["2級一次", "2級二次"], apply: null, exam: ["2026-11-08", "2026-11-08"], announce: "2026-12-21", detail: "二次の発表は 2027/2/5" },
    ],
  },
  {
    id: "doboku", name: "土木施工管理技士", cat: "tech", org: "全国建設研修センター",
    url: "https://www.jctc.jp/",
    parts: [["1級一次","1級 第一次検定"],["1級二次","1級 第二次検定"],["2級一次","2級 第一次検定"],["2級二次","2級 第二次検定"]],
    note: "令和8年度の申込は受付終了。",
    sessions: [
      { label: "1級 第二次検定", parts: ["1級二次"], apply: null, exam: ["2026-10-04", "2026-10-04"], announce: "2027-01-08", detail: "" },
      { label: "2級 第一次（後期）・第二次", parts: ["2級一次", "2級二次"], apply: null, exam: ["2026-10-25", "2026-10-25"], announce: "2026-12-02", detail: "二次の発表は 2027/2/3" },
    ],
  },
  {
    id: "kankouji", name: "管工事施工管理技士", cat: "tech", org: "全国建設研修センター",
    url: "https://www.jctc.jp/",
    parts: [["1級一次","1級 第一次検定"],["1級二次","1級 第二次検定"],["2級一次","2級 第一次検定"],["2級二次","2級 第二次検定"]],
    note: "令和8年度の申込は受付終了。",
    sessions: [
      { label: "2級 第一次（後期）・第二次", parts: ["2級一次", "2級二次"], apply: null, exam: ["2026-11-15", "2026-11-15"], announce: "2027-01-05", detail: "二次の発表は 2027/3/3" },
      { label: "1級 第二次検定", parts: ["1級二次"], apply: null, exam: ["2026-12-06", "2026-12-06"], announce: "2027-03-03", detail: "" },
    ],
  },
  {
    id: "zouen", name: "造園施工管理技士", cat: "tech", org: "全国建設研修センター",
    url: "https://www.jctc.jp/",
    parts: [["1級一次","1級 第一次検定"],["1級二次","1級 第二次検定"],["2級一次","2級 第一次検定"],["2級二次","2級 第二次検定"]],
    note: "令和8年度の申込は受付終了。",
    sessions: [
      { label: "2級 第一次（後期）・第二次", parts: ["2級一次", "2級二次"], apply: null, exam: ["2026-11-15", "2026-11-15"], announce: "2027-01-05", detail: "二次の発表は 2027/3/3" },
      { label: "1級 第二次検定", parts: ["1級二次"], apply: null, exam: ["2026-12-06", "2026-12-06"], announce: "2027-03-03", detail: "" },
    ],
  },

  {
    id: "denkikouji2", name: "第二種電気工事士", cat: "tech", org: "電気技術者試験センター",
    url: "https://www.shiken.or.jp/construction/second/",
    parts: [["学科", "学科試験"], ["技能", "技能試験"]],
    fees: [{ label: "", yen: 11100 }], feeNote: "別途、事務手数料あり",
    note: "上期・下期の年2回。学科はCBTか筆記を選択。学科に合格した回の翌回は学科免除で技能だけ受けられる。上期の申込は例年3月。",
    sessions: [
      { label: "令和8年度 下期 学科", parts: ["学科"], apply: ["2026-08-17", "2026-09-03"], exam: ["2026-09-24", "2026-11-08"],
        detail: "CBT 9/24〜11/8 ／ 筆記 10/25" },
      { label: "令和8年度 下期 技能", parts: ["技能"], apply: ["2026-08-17", "2026-09-03"], exam: ["2026-12-12", "2026-12-13"],
        detail: "学科合格者・学科免除者が対象" },
    ],
  },
  {
    id: "denkikouji1", name: "第一種電気工事士", cat: "tech", org: "電気技術者試験センター",
    url: "https://www.shiken.or.jp/construction/first/",
    parts: [["学科", "学科試験"], ["技能", "技能試験"]],
    fees: [{ label: "", yen: 13000 }],
    note: "上期・下期の年2回。上期の申込は例年2月、下期は7〜8月。",
    sessions: [
      { label: "令和8年度 下期 学科", parts: ["学科"], apply: ["2026-07-27", "2026-08-13"], exam: ["2026-09-11", "2026-10-18"], announce: "2026-11-02",
        detail: "CBT 9/11〜10/18 ／ 筆記 10/4" },
      { label: "令和8年度 下期 技能", parts: ["技能"], apply: ["2026-07-27", "2026-08-13"], exam: ["2026-11-21", "2026-11-21"], announce: "2026-12-11",
        detail: "学科合格者・学科免除者が対象" },
    ],
  },
  {
    id: "denken2", name: "第二種電気主任技術者（電験二種）", cat: "tech", org: "電気技術者試験センター",
    url: "https://www.shiken.or.jp/",
    parts: [["一次", "一次試験"], ["二次", "二次試験"]], partsNote: "一次試験は科目合格制（理論・電力・機械・法規、3年間有効）",
    fees: [{ label: "インターネット申込", yen: 13800 }], feeNote: "令和7年度の金額",
    note: "年1回。申込は例年5〜6月、一次は8月下旬（電験三種上期の筆記と同日）、二次は11月。",
    sessions: [
      { label: "令和8年度 二次試験", parts: ["二次"], apply: ["2026-05-18", "2026-06-04"], exam: ["2026-11-15", "2026-11-15"], announceText: "2027年1月下旬（例年）",
        detail: "一次試験（8/30）の合格者・一次免除者が対象" },
    ],
  },
  {
    id: "denkisekou", name: "電気工事施工管理技士", cat: "tech", org: "建設業振興基金",
    url: "https://www.fcip-shiken.jp/",
    parts: [["1級一次", "1級 第一次検定"], ["1級二次", "1級 第二次検定"], ["2級一次", "2級 第一次検定"], ["2級二次", "2級 第二次検定"]],
    note: "令和8年度の申込は受付終了。1級の申込は例年2月（一次のみは4月上旬まで）。2級の日程は公式で確認。",
    sessions: [
      { label: "1級 第二次検定", parts: ["1級二次"], apply: null, exam: ["2026-10-18", "2026-10-18"], announce: "2027-01-08", detail: "" },
    ],
  },
  {
    id: "eisei", name: "衛生管理者（第一種・第二種）", cat: "tech", org: "安全衛生技術試験協会", anytime: true,
    url: "https://www.exam.or.jp/",
    prefUrl: { "愛知県": "https://www.exam.or.jp/center_chubu" },
    parts: [["第一種", "第一種衛生管理者"], ["第二種", "第二種衛生管理者"]],
    fees: [{ label: "", yen: 8800 }], feeNote: "令和5年6月時点",
    note: "各地の安全衛生技術センターで毎月複数回。日程と空き状況はセンターのページで確認。",
    prefNote: { "愛知県": "愛知県は中部安全衛生技術センター（東海市）で毎月複数回実施。日程と空き状況はセンターのページで確認。" },
    sessions: [],
  },
  {
    id: "boiler", name: "ボイラー技士", cat: "tech", org: "安全衛生技術試験協会", anytime: true,
    url: "https://www.exam.or.jp/",
    prefUrl: { "愛知県": "https://www.exam.or.jp/center_chubu" },
    parts: [["二級", "二級ボイラー技士"], ["一級", "一級ボイラー技士"], ["特級", "特級ボイラー技士"]],
    fees: [{ label: "", yen: 8800 }], feeNote: "令和5年6月時点",
    note: "各地の安全衛生技術センターで実施（二級は毎月）。日程はセンターのページで確認。",
    sessions: [],
  },
  {
    id: "gijutsushi", name: "技術士", cat: "tech", org: "日本技術士会",
    url: "https://www.engineer.or.jp/c_topics/011/011780.html",
    parts: [["一次", "第一次試験"], ["二次", "第二次試験"]],
    fees: [{ label: "第一次試験", yen: 13000 }, { label: "第二次試験（1部門）", yen: 20500 }],
    note: "第一次（11月）に合格すると第二次（翌年7月筆記・冬に口頭）へ。第一次は年1回、申込は6月。",
    sessions: [
      { label: "令和8年度 第二次試験", parts: ["二次"], apply: ["2026-04-01", "2026-04-15"], exam: ["2026-07-19", "2026-07-20"],
        announce: "2026-11-04", announceLabel: "筆記試験の合格発表", detail: "口頭試験は2026年12月〜2027年1月。最終合格発表 2027/3/12 予定" },
      { label: "令和8年度 第一次試験", parts: ["一次"], apply: ["2026-06-10", "2026-06-24"], exam: ["2026-11-22", "2026-11-22"],
        announceText: "2027年2月下旬", detail: "申込はWEB 6/10〜6/23、郵送 6/10〜6/24（消印有効）" },
    ],
  },

  // ───────── ビジネス・AI ─────────
  {
    id: "gyosei", name: "行政書士", cat: "law", org: "行政書士試験研究センター",
    url: "https://gyosei-shiken.or.jp/",
    fees: [{ label: "", yen: 10400 }],
    note: "年1回・11月第2日曜。申込は例年7月下旬〜8月下旬。",
    sessions: [
      { label: "令和8年度", apply: ["2026-07-21", "2026-08-24"], exam: ["2026-11-08", "2026-11-08"], announce: "2027-01-27",
        detail: "郵送申込は 8/17 まで" },
    ],
  },
  {
    id: "sharoushi", name: "社会保険労務士", cat: "law", org: "全国社会保険労務士会連合会 試験センター",
    url: "https://www.sharosi-siken.or.jp/",
    note: "年1回・8月下旬。次回（令和9年度）の日程は例年4月ごろ発表、申込は4月中旬〜5月末。",
    sessions: [
      { label: "令和8年度（第58回）", apply: ["2026-04-13", "2026-05-31"], exam: ["2026-08-23", "2026-08-23"], announce: "2026-10-01", detail: "" },
    ],
  },
  {
    id: "shindanshi", name: "中小企業診断士", cat: "law", org: "中小企業診断協会",
    url: "https://www.j-smeca.jp/",
    parts: [["一次", "第1次試験"], ["二次", "第2次試験（筆記）"]], partsNote: "第1次は科目合格制。2026年度から第2次の口述試験は廃止",
    fees: [{ label: "第1次試験", yen: 17200 }, { label: "第2次試験", yen: 15100 }],
    note: "第1次は8月上旬、第2次（筆記）は10月下旬。申込はインターネットのみ。",
    sessions: [
      { label: "2026年度 第1次試験", parts: ["一次"], apply: ["2026-04-23", "2026-05-27"], exam: ["2026-08-01", "2026-08-02"], announce: "2026-09-01", detail: "" },
      { label: "2026年度 第2次試験（筆記）", parts: ["二次"], apply: ["2026-09-01", "2026-09-18"], exam: ["2026-10-25", "2026-10-25"], announce: "2027-01-13",
        detail: "第1次試験の合格者が対象" },
    ],
  },
  {
    id: "chintai", name: "賃貸不動産経営管理士", cat: "law", org: "賃貸不動産経営管理士協議会",
    url: "https://www.chintaikanrishi.jp/",
    fees: [{ label: "", yen: 12000 }], feeNote: "インターネット申込は事務手数料込み12,400円",
    note: "年1回・11月。申込は例年8月〜9月。",
    sessions: [
      { label: "令和8年度", apply: ["2026-08-03", "2026-09-30"], exam: ["2026-11-15", "2026-11-15"], announce: "2026-12-24", detail: "" },
    ],
  },
  {
    id: "kangyou", name: "管理業務主任者", cat: "law", org: "マンション管理業協会",
    url: "https://www.kanrikyo.or.jp/",
    fees: [{ label: "", yen: 8900 }], feeNote: "Web申込は別途事務手数料297円",
    note: "年1回・12月第1日曜。申込は例年8月〜9月。",
    sessions: [
      { label: "令和8年度", apply: ["2026-08-03", "2026-09-30"], exam: ["2026-12-06", "2026-12-06"], announce: "2027-01-15",
        detail: "郵送申込は 8/24 まで" },
    ],
  },
  {
    id: "bijihou", name: "ビジネス実務法務検定", cat: "law", org: "東京商工会議所",
    url: "https://kentei.tokyo-cci.or.jp/houmu/",
    parts: [["1級","1級"],["2級","2級"],["3級","3級"]],
    fees: [{ label: "2級（IBT）", yen: 7700 }, { label: "3級（IBT）", yen: 5500 }, { label: "1級（CBT利用料込み）", yen: 12100 }, { label: "2級（CBT利用料込み）", yen: 9900 }, { label: "3級（CBT利用料込み）", yen: 7700 }], feeNote: "2025年度の金額",
    note: "2・3級はIBT/CBT方式で年2シーズン。1級は年1回。",
    sessions: [
      { label: "2・3級 第2シーズン", parts: ["2級", "3級"], apply: ["2026-09-16", "2026-09-29"], exam: ["2026-10-22", "2026-11-09"], announceText: "試験直後に画面で判定", detail: "期間内に受験日時を選択" },
      { label: "1級", parts: ["1級"], apply: ["2026-11-04", "2026-11-11"], exam: ["2026-12-06", "2026-12-06"], announceText: "2027年3月", detail: "申込締切 11/11 18:00" },
    ],
  },
  {
    id: "gkentei", name: "G検定（ジェネラリスト検定）", cat: "biz", org: "日本ディープラーニング協会",
    url: "https://www.jdla.org/certificate/general/",
    fees: [{ label: "一般", yen: 13200 }, { label: "学生", yen: 5500 }, { label: "再受験（一般）", yen: 6600 }],
    note: "オンライン（自宅）試験が中心。2027年は第1・3・5回に会場試験あり。",
    sessions: [
      { label: "2026 第6回（オンライン）", apply: ["2026-09-11", "2026-10-29"], exam: ["2026-11-06", "2026-11-07"], detail: "11/6(金)16時 または 11/7(土)13時" },
      { label: "2027 第1回（会場）", apply: ["2026-11-13", "2027-01-12"], exam: ["2027-01-15", "2027-01-17"], detail: "申込は受験日の3日前まで" },
      { label: "2027 第1回（オンライン）", apply: ["2026-11-13", "2027-01-08"], exam: ["2027-01-16", "2027-01-16"], announceText: "2月上旬", detail: "" },
      { label: "2027 第2回（オンライン）", apply: ["2027-01-22", "2027-02-25"], exam: ["2027-03-05", "2027-03-06"], detail: "" },
      { label: "2027 第3回（オンライン）", apply: ["2027-03-12", "2027-04-27"], exam: ["2027-05-08", "2027-05-08"], detail: "会場試験は 5/7〜5/9" },
      { label: "2027 第4回（オンライン）", apply: ["2027-05-14", "2027-06-24"], exam: ["2027-07-02", "2027-07-03"], detail: "" },
      { label: "2027 第5回（オンライン）", apply: ["2027-07-09", "2027-08-27"], exam: ["2027-09-04", "2027-09-04"], detail: "会場試験は 9/3〜9/5" },
      { label: "2027 第6回（オンライン）", apply: ["2027-09-10", "2027-10-28"], exam: ["2027-11-05", "2027-11-06"], detail: "" },
    ],
  },

  {
    id: "eshikaku", name: "E資格（エンジニア資格）", cat: "biz", org: "日本ディープラーニング協会",
    url: "https://www.jdla.org/certificate/engineer/",
    fees: [{ label: "一般", yen: 33000 }, { label: "学生", yen: 22000 }, { label: "会員", yen: 27500 }],
    note: "受験には、試験日の過去2年以内に JDLA 認定プログラムを修了している必要あり。年2回（2月・8月）。",
    sessions: [
      { label: "2027 第1回", apply: ["2026-12-01", "2027-02-18"], exam: ["2027-02-19", "2027-02-21"], detail: "申込は受験日前日 23:59 まで" },
      { label: "2027 第2回", apply: ["2027-06-01", "2027-08-26"], exam: ["2027-08-27", "2027-08-29"], detail: "申込は受験日前日 23:59 まで" },
    ],
  },
  {
    id: "dskentei", name: "データサイエンティスト検定（DS検定）", cat: "biz", org: "データサイエンティスト協会",
    url: "https://www.datascientist.or.jp/dskentei/",
    fees: [{ label: "一般", yen: 11000 }, { label: "学生", yen: 5500 }], feeNote: "税込（税抜 10,000円／5,000円）",
    note: "リテラシーレベル。CBT方式で年3回（3月・6月・11月ごろ）。",
    sessions: [
      { label: "第14回", apply: ["2026-09-21", "2026-10-23"], exam: ["2026-11-07", "2026-11-22"], detail: "団体申込は 10/16 まで" },
    ],
  },
  {
    id: "genai", name: "生成AIパスポート", cat: "biz", org: "生成AI活用普及協会（GUGA）",
    url: "https://guga.or.jp/",
    note: "自宅で受けるオンライン試験（IBT）。年数回実施。",
    sessions: [
      { label: "第5回", apply: ["2026-08-01", "2026-09-30"], exam: ["2026-10-01", "2026-10-31"], detail: "期間内に自宅で受験" },
    ],
  },
  {
    id: "toukei", name: "統計検定", cat: "biz", org: "統計質保証推進協会", anytime: true,
    url: "https://www.toukei-kentei.jp/",
    parts: [["準1級", "準1級"], ["2級", "2級"], ["3級", "3級"], ["4級", "4級"]],
    note: "準1級〜4級などは CBT 方式で随時受験できる。",
    sessions: [],
  },
];
