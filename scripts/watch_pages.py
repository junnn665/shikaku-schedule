"""公式ページを見張って、日程らしき行が増えたら知らせる。

GitHub Actions（.github/workflows/update.yml）から毎日実行される。
- data.js の各資格の url（公式ページ）を取得し、「日付」と「試験・申込などの言葉」を含む行だけを取り出す
- 前回（watch_state.json）と比べて新しく出てきた行があれば changed.md に書き出す
- 自動取り込み対象（危険物・消防設備士・TOEIC）は update_auto.py が担当するので除外

使い方:
  python scripts/watch_pages.py exams.json        # exams.json は data.js から作った [{id, name, url}]
出力:
  watch_state.json（更新）、changed.md（変更があったときだけ）、GITHUB_OUTPUT に changed=true/false
"""
from __future__ import annotations

import datetime as dt
import html
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / "watch_state.json"
CHANGED = ROOT / "changed.md"
JST = dt.timezone(dt.timedelta(hours=9))
TODAY = dt.datetime.now(JST).date().isoformat()
UA = {"User-Agent": "Mozilla/5.0 (shikaku-schedule page watcher; +https://github.com/junnn665/shikaku-schedule)"}
SKIP = {"kikenbutsu", "shoubou", "toeic"}  # update_auto.py が取り込む

DATE_RE = re.compile(r"(20\d\d\s*年|令和\s*\d+\s*年|\d{1,2}\s*月\s*\d{1,2}\s*日|\b\d{1,2}/\d{1,2}\b|20\d\d[/.-]\d{1,2}[/.-]\d{1,2})")
WORD_RE = re.compile(r"(試験|検定|申込|申し込|受付|受験|実施|発表|期間|締切|日程)")
BLOCK_TAGS = re.compile(r"</?(p|div|li|tr|h\d|br|dl|section|article|table|ul|ol)\b[^>]*>", re.I)  # td/th/dt/dd は同じ行にまとめる


def page_lines(src: str) -> list[str]:
    """HTML から「日付」と「試験などの言葉」を両方含む行を取り出す。"""
    src = re.sub(r"<(script|style|noscript)[\s\S]*?</\1>", " ", src, flags=re.I)
    src = re.sub(r"<!--[\s\S]*?-->", " ", src)
    src = BLOCK_TAGS.sub("\n", src)
    src = re.sub(r"<[^>]+>", " ", src)
    text = unicodedata.normalize("NFKC", html.unescape(src))
    out = []
    for raw in text.splitlines():
        line = re.sub(r"\s+", " ", raw).strip()
        if 8 <= len(line) <= 300 and DATE_RE.search(line) and WORD_RE.search(line):
            out.append(line[:200])
    # 重複を除き、順番は保つ
    seen, uniq = set(), []
    for l in out:
        if l not in seen:
            seen.add(l)
            uniq.append(l)
    return uniq[:400]


def fetch(url: str) -> str | None:
    import requests

    try:
        r = requests.get(url, headers=UA, timeout=40)
        r.raise_for_status()
    except Exception as e:  # 取れなかったページは前回の記録を残す
        print(f"  skip {url}: {e}", file=sys.stderr)
        return None
    ctype = r.headers.get("content-type", "")
    if "html" not in ctype and "text" not in ctype:
        print(f"  not html {url}: {ctype}", file=sys.stderr)
        return None
    if not r.encoding or r.encoding.lower() in ("iso-8859-1", "ascii"):
        r.encoding = r.apparent_encoding
    return r.text


def main() -> int:
    exams = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    test = os.environ.get("WATCH_TEST") == "1"
    state = json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}
    pages: dict[str, dict] = state.get("pages", {})

    # 同じ URL を複数の資格が使っていることがある
    by_url: dict[str, list[dict]] = {}
    for ex in exams:
        if ex["id"] in SKIP or not ex.get("url"):
            continue
        by_url.setdefault(ex["url"], []).append(ex)

    changes = []
    for url, exs in by_url.items():
        names = "・".join(e["name"] for e in exs)
        print(f"[{names}] {url}", file=sys.stderr)
        src = fetch(url)
        if src is None:
            continue
        lines = page_lines(src)
        prev = pages.get(url)
        is_changed = False
        if prev is not None:
            old = set(prev.get("lines", []))
            added = [l for l in lines if l not in old]
            if added:
                is_changed = True
                changes.append({"names": names, "ids": [e["id"] for e in exs], "url": url, "added": added[:12]})
        elif test and lines:
            changes.append({"names": names, "ids": [e["id"] for e in exs], "url": url, "added": lines[:3], "test": True})
        pages[url] = {"names": names, "checked": TODAY, "lines": lines,
                      "changed": TODAY if is_changed else (prev or {}).get("changed")}

    first_run = not state
    STATE.write_text(json.dumps({"updated": TODAY, "pages": pages}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    if test and not changes:
        # テスト：最初に見つかったページの行を「新しく出てきた行」として扱う
        for url, p in pages.items():
            if p.get("lines"):
                changes.append({"names": p["names"], "ids": [], "url": url, "added": p["lines"][:3], "test": True})
                break

    if first_run and not test:
        print("初回のため記録だけ保存しました", file=sys.stderr)
        changes = []

    out = os.environ.get("GITHUB_OUTPUT")
    if changes:
        md = [f"# 公式ページの日程らしき記載の変化（{TODAY}）", ""]
        for c in changes:
            md.append(f"## {c['names']}" + ("（テスト）" if c.get("test") else ""))
            md.append(f"- ページ: {c['url']}")
            md.append(f"- 資格ID: {', '.join(c['ids'])}")
            md.append("- 新しく出てきた行:")
            md += [f"  - {l}" for l in c["added"]]
            md.append("")
        CHANGED.write_text("\n".join(md), encoding="utf-8")
        print(f"変化あり: {len(changes)}ページ", file=sys.stderr)
    elif CHANGED.exists():
        CHANGED.unlink()
    if out:
        with open(out, "a", encoding="utf-8") as f:
            f.write(f"changed={'true' if changes else 'false'}\n")
            f.write(f"count={len(changes)}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
