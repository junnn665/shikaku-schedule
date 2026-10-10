"""公式サイトから試験日程を取り込み、data_auto.js を更新する。

GitHub Actions（.github/workflows/update-data.yml）から定期実行される。
取り込み対象:
  - 危険物取扱者・消防設備士（消防試験研究センターの全国日程PDF、全都道府県）
  - TOEIC L&R 公開テスト（IIBC の日程ページ）

取り込みに失敗した項目は前回の値をそのまま残す（サイトが空になるのを防ぐ）。
"""
from __future__ import annotations

import datetime as dt
import html
import io
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data_auto.js"
JST = dt.timezone(dt.timedelta(hours=9))
TODAY = dt.datetime.now(JST).date()
UA = {"User-Agent": "Mozilla/5.0 (shikaku-schedule updater; +https://github.com/junnn665/shikaku-schedule)"}

SHOUBO_URL = "https://shinsei.shoubo-shiken.or.jp/shoubou_ia/iajs9001.do?download=1&menjo_kbn={kbn}&ki_kbn={ki}&nendo={nendo}"
TOEIC_URL = "https://www.iibc-global.org/toeic/test/lr/guide01/schedule.html"


def log(*a):
    print(*a, file=sys.stderr)


def nfkc(s: str) -> str:
    return unicodedata.normalize("NFKC", s)


# ───────────────────────── 消防試験研究センター ─────────────────────────
PREF_RE = r"(北海道|東京都|京都府|大阪府|\S{2,3}県)"
ROW_RE = re.compile(
    rf"^(?:{PREF_RE}\s+)?"
    r"R(\d{1,2})\.(\d{1,2})\.(\d{1,2})\s*\(.\)\s+"            # 試験日 R08.11.22(日)
    r"(\d{1,2})/(\d{1,2})\s*~\s*(\d{1,2})/(\d{1,2})"            # 電子申請
    r"(?:\s+(?:(\d{1,2})/(\d{1,2})\s*~\s*(\d{1,2})/(\d{1,2})|[-ー－―]+))?"  # 書面申請
    r"\s*(.*)$"
)
ANNOUNCE_RE = re.compile(r"R(\d{1,2})\.(\d{1,2})\.(\d{1,2})\s*\(.\)")


def apply_date(exam: dt.date, m: int, d: int) -> dt.date:
    """月/日 だけの申込日に年を補う（試験日より後なら前年）。"""
    cand = dt.date(exam.year, m, d)
    if cand > exam:
        cand = dt.date(exam.year - 1, m, d)
    return cand


def parse_shoubo_text(text: str) -> list[dict]:
    rows, pref = [], None
    for raw in text.splitlines():
        line = nfkc(raw).strip()
        m = ROW_RE.match(line)
        if not m:
            continue
        g = m.groups()
        pref = g[0] or pref
        if not pref:
            continue
        exam = dt.date(2018 + int(g[1]), int(g[2]), int(g[3]))
        e1 = apply_date(exam, int(g[4]), int(g[5]))
        e2 = apply_date(exam, int(g[6]), int(g[7]))
        rest = g[12] or ""
        paper = None
        if g[8]:
            paper = (apply_date(exam, int(g[8]), int(g[9])), apply_date(exam, int(g[10]), int(g[11])))
        am = ANNOUNCE_RE.search(rest)
        types, note, announce = rest, "", None
        if am:
            types = rest[: am.start()].strip()
            note = rest[am.end():].strip()
            announce = dt.date(2018 + int(am.group(1)), int(am.group(2)), int(am.group(3)))
        types = " ".join(types.split())
        rows.append({"pref": pref, "exam": exam, "apply": (e1, e2), "paper": paper,
                     "types": types, "announce": announce, "note": note})
    return rows


def fetch_shoubo(kbn: int) -> list[dict]:
    import pdfplumber
    import requests

    fy = TODAY.year if TODAY.month >= 4 else TODAY.year - 1
    rows: list[dict] = []
    for nendo in (fy, fy + 1):
        for ki in (1, 2):
            url = SHOUBO_URL.format(kbn=kbn, ki=ki, nendo=nendo)
            try:
                r = requests.get(url, headers=UA, timeout=60)
                r.raise_for_status()
            except Exception as e:  # 未公開の年度・期はエラーになることがある
                log(f"  skip {url}: {e}")
                continue
            if not r.content.startswith(b"%PDF"):
                log(f"  not a PDF: {url}")
                continue
            with pdfplumber.open(io.BytesIO(r.content)) as pdf:
                text = "\n".join((p.extract_text() or "") for p in pdf.pages)
            got = parse_shoubo_text(text)
            log(f"  {nendo} ki={ki}: {len(got)} rows")
            rows += got
    return rows


def shoubo_sessions(rows: list[dict]) -> list[dict]:
    seen, out = set(), []
    for r in sorted(rows, key=lambda r: (r["exam"], r["pref"])):
        if r["exam"] < TODAY - dt.timedelta(days=7):
            continue
        key = (r["pref"], r["exam"].isoformat(), r["types"])
        if key in seen:
            continue
        seen.add(key)
        short = r["pref"] if r["pref"] == "北海道" else r["pref"][:-1]
        detail = [r["types"]] if r["types"] else []
        if r["paper"] and r["paper"] != r["apply"]:
            detail.append(f"書面申請 {r['paper'][0]:%-m/%-d}〜{r['paper'][1]:%-m/%-d}")
        elif not r["paper"]:
            detail.append("電子申請のみ")
        if r["announce"]:
            detail.append(f"合格発表 {r['announce']:%-m/%-d}")
        if r["note"]:
            detail.append(r["note"])
        out.append({
            "id": f"{r['pref']}-{r['exam'].isoformat()}-{len([o for o in out if o['pref'] == r['pref'] and o['exam'][0] == r['exam'].isoformat()])}",
            "label": f"{short} {r['exam'].month}/{r['exam'].day}",
            "pref": r["pref"],
            "apply": [r["apply"][0].isoformat(), r["apply"][1].isoformat()],
            "exam": [r["exam"].isoformat()] * 2,
            "detail": " ／ ".join(detail),
        })
    return out


# ───────────────────────── TOEIC ─────────────────────────
TOEIC_EXAM_RE = re.compile(r"(\d{4})年(\d{1,2})月(\d{1,2})日\s*\(.\)\s*実施")
TOEIC_APPLY_RE = re.compile(
    r"(\d{4})年(\d{1,2})月(\d{1,2})日\s*\(.\)\s*\d{1,2}:\d{2}\s*~\s*(\d{4})年(\d{1,2})月(\d{1,2})日\s*\(.\)\s*(\d{1,2}:\d{2})"
)


def parse_toeic_html(src: str) -> list[dict]:
    text = re.sub(r"<(script|style)[\s\S]*?</\1>", " ", src, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = nfkc(html.unescape(text))
    text = re.sub(r"\s+", " ", text)

    events = [(m.start(), "exam", m) for m in TOEIC_EXAM_RE.finditer(text)]
    events += [(m.start(), "apply", m) for m in TOEIC_APPLY_RE.finditer(text)]
    events.sort(key=lambda e: e[0])

    result: dict[str, dict] = {}
    current = None
    for _, kind, m in events:
        if kind == "exam":
            current = dt.date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            continue
        if current is None or current.isoformat() in result:
            continue
        a1 = dt.date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        a2 = dt.date(int(m.group(4)), int(m.group(5)), int(m.group(6)))
        if not (a1 <= a2 < current and (current - a1).days < 200):
            continue
        result[current.isoformat()] = {
            "id": current.isoformat(),
            "label": f"{current.year}/{current.month}/{current.day} 実施回",
            "apply": [a1.isoformat(), a2.isoformat()],
            "exam": [current.isoformat()] * 2,
            "detail": f"午前・午後の1日2回 ／ 締切は最終日 {m.group(7)}",
        }
    return [result[k] for k in sorted(result)]


def fetch_toeic() -> list[dict]:
    import requests

    r = requests.get(TOEIC_URL, headers=UA, timeout=60)
    r.raise_for_status()
    r.encoding = r.apparent_encoding or "utf-8"
    return parse_toeic_html(r.text)


# ───────────────────────── 書き出し ─────────────────────────
def load_previous() -> dict:
    if not OUT.exists():
        return {}
    m = re.search(r"window\.AUTO\s*=\s*(\{[\s\S]*\})\s*;?\s*$", OUT.read_text(encoding="utf-8"))
    return json.loads(m.group(1)) if m else {}


def main() -> int:
    prev = load_previous()
    data = {k: v for k, v in prev.items()}
    data.setdefault("sources", {})
    ok_any = False

    jobs = [
        ("kikenbutsu", lambda: shoubo_sessions(fetch_shoubo(1)), 20),
        ("shoubou", lambda: shoubo_sessions(fetch_shoubo(2)), 5),
        ("toeic", fetch_toeic, 3),
    ]
    for key, fn, minimum in jobs:
        log(f"[{key}]")
        try:
            sessions = fn()
        except Exception as e:
            log(f"  FAILED: {e}")
            continue
        if len(sessions) < minimum:
            log(f"  too few ({len(sessions)} < {minimum}); keep previous")
            continue
        data[key] = sessions
        data["sources"][key] = TODAY.isoformat()
        ok_any = True
        log(f"  ok: {len(sessions)} sessions")

    if not ok_any and prev:
        log("nothing updated")
        return 0

    old_body = {k: v for k, v in prev.items() if k not in ("updated", "sources")}
    new_body = {k: v for k, v in data.items() if k not in ("updated", "sources")}
    if old_body == new_body and prev:
        log("no schedule changes")
        return 0

    data["updated"] = TODAY.isoformat()
    body = json.dumps(data, ensure_ascii=False, indent=1)
    OUT.write_text(
        "// 自動生成ファイル（scripts/update_auto.py）。手で編集しないでください。\n"
        f"window.AUTO = {body};\n",
        encoding="utf-8",
    )
    log(f"wrote {OUT.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
