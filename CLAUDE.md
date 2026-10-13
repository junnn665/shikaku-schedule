# 資格スケジュール帳 — 更新ルール

静的サイト（GitHub Pages、`main` ブランチの root）。HTML/CSS/JS は基本的に触らない。

- `data.js`：手で管理するデータ
- `data_auto.js`：GitHub Actions（`.github/workflows/update-data.yml` → `scripts/update_auto.py`）が毎日自動生成。**手で編集しない**。
  危険物取扱者・消防設備士（全都道府県）と TOEIC はここから表示される（`data.js` 側の同じ資格の回は自動データがないときの予備）。
  自動取り込みが壊れている（`data_auto.js` の `sources` の日付が古い、Actions が失敗している）場合は `scripts/update_auto.py` を直す。

- `watch_state.json`：`.github/workflows/update.yml` の監視記録（自動生成。手で編集しない）。
  GitHub Actions 上で Claude が動くときは、変化のあったページが `changed.md` に書かれている。

## 定期更新でやること

1. `data.js` の各資格について、公式サイト（なければ大手資格学校のページ）で次を確認する。
   - 新しく発表された回（申込期間・試験日）があれば `sessions` に追加
   - 既存の回の日付が変わっていれば修正
   - 申込期間が `null`（未発表）の回が発表されていれば埋める
2. 受験地ごとのデータ（`pref`）は **愛知県** を優先して保守する（日商簿記1級：名古屋商工会議所の案内）。
   危険物取扱者・消防設備士・TOEIC は自動取り込みに任せる。
3. 終わった回は消さずに残してよい（画面側で「終了」扱いになる）。ただし2年以上前の回は削除してよい。
4. `window.DATA_CHECKED` を確認した日付に更新する。
5. `node -e "global.window={};require('./data.js')"` で構文エラーがないことを確認する。
6. 変更があればコミットして `main` に push。コミットメッセージに何を追加・修正したかを書く。

## 注意

- 新しい回を足すとき、資格に `parts`（合格の区分）があれば、その回で受けられる区分を回の `parts` に書く（例：施工管理の「1級 第二次検定」なら `["1級二次"]`）。

- 推測で日付を入れない。確認できないものは `apply: null` のままにして `detail` に「未発表」と書く。
- 出典と食い違う情報を見つけたら公式を優先する。
