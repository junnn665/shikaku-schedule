// 資格のつながり（系統図）。[から, へ, 説明]。"資格ID" または "資格ID:区分ID"。
window.ROUTES = [
  { title: "IT（情報処理技術者試験）", edges: [
    ["ip", "fe", "ITの基礎から技術者向けの試験へ"],
    ["ip", "sg", "セキュリティ寄りの入門"],
    ["fe", "ap", "次のレベル。出題範囲が広がる"],
    ["ap", "sc", "応用情報の合格から2年間、高度試験・支援士の科目A-1（旧午前I）が免除"],
    ["ap", "koudo-zenki", "同じく科目A-1が免除"],
    ["ap", "koudo-kouki", "同じく科目A-1が免除"],
  ] },
  { title: "電気", edges: [
    ["denkikouji2", "denkikouji1", "学科の範囲が重なる。第一種の免状交付には実務経験が必要"],
    ["denkikouji2", "denken3", "電気理論の基礎が共通。電験三種は受験資格なし"],
    ["denken3", "denken2", "上位資格。受験資格なし"],
    ["denkikouji1", "denkisekou", "電気工事の知識がそのまま活きる"],
    ["denkikouji2", "shoubou:甲4", "電気工事士の免状は、消防設備士 甲種の受験資格の一つ"],
  ] },
  { title: "危険物・消防", edges: [
    ["kikenbutsu:乙4", "kikenbutsu:乙6", "乙種を1つ持っていると、ほかの乙種は法令・物理化学が免除"],
    ["kikenbutsu:乙4", "kikenbutsu:甲", "乙種を4種類（決められた組み合わせ）取ると甲種の受験資格"],
    ["shoubou:乙6", "shoubou:甲1", "甲種は受験資格が必要（乙種免状＋実務経験、電気工事士免状など）"],
  ] },
  { title: "施工管理・技術士", edges: [
    ["kenchiku:2級一次", "kenchiku:2級二次", "第一次に合格すると技士補。土木・管工事・造園・電気工事も同じ流れ"],
    ["kenchiku:2級二次", "kenchiku:1級一次", "2級から1級へ"],
    ["kenchiku:1級一次", "kenchiku:1級二次", "第二次は実務経験が必要"],
    ["gijutsushi:一次", "gijutsushi:二次", "第一次の合格後、実務経験などを経て第二次へ"],
  ] },
  { title: "衛生・ボイラー", edges: [
    ["eisei:第二種", "eisei:第一種", "第一種は有害業務を含む全業種に対応"],
    ["boiler:二級", "boiler:一級", "一級は二級免許と実務経験などが必要"],
    ["boiler:一級", "boiler:特級", "同様に上位へ"],
  ] },
  { title: "簿記・FP・経営", edges: [
    ["boki23:3級", "boki23:2級", ""],
    ["boki23:2級", "boki1", "1級は税理士試験の受験資格になる"],
    ["fp23:3級学科", "fp23:2級学科", "3級の合格は2級の受検資格の一つ"],
    ["fp23:2級学科", "fp1:学科", "2級の合格と1年以上の実務経験などで1級学科を受検できる"],
    ["boki23:2級", "shindanshi:一次", "財務・会計の科目で役立つ"],
  ] },
  { title: "不動産", edges: [
    ["takken", "chintai", "民法や宅建業法の範囲が重なる"],
    ["takken", "kangyou", "民法・区分所有法などが重なる"],
  ] },
  { title: "法律", edges: [
    ["bijihou:2級", "gyosei", "民法・会社法の基礎が重なる"],
    ["gyosei", "sharoushi", "行政書士試験の合格は、社労士の受験資格の一つ"],
  ] },
  { title: "AI・データ", edges: [
    ["genai", "gkentei", "生成AIの入門から、AI全般の体系的な知識へ"],
    ["gkentei", "eshikaku", "E資格は JDLA 認定プログラムの修了が受験資格"],
    ["toukei:3級", "toukei:2級", ""],
    ["toukei:2級", "dskentei", "統計の基礎がデータサイエンスに直結"],
  ] },
  { title: "語学", edges: [
    ["eiken", "toeic", "英検で4技能の基礎、TOEICでビジネス英語のスコア"],
  ] },
];
