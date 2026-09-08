"""Optimize freshly-generated flexdashboard reports by externalizing shared assets.

The reports that R/flexdashboard exports are self-contained: they inline
bootstrap CSS/JS, jQuery, FlexDashboard runtime, and the header logos as
base64. That makes each HTML file ~3 MB even though the shared parts are
byte-identical across all 11 disease reports.

This tool rewrites those inline blocks to reference the shared files under
`assets/css/` and `assets/js/`, cutting each report from ~3 MB to ~300 KB.

Usage:
    python tools/optimize_report.py 202608          # all diseases
    python tools/optimize_report.py 202608 PMK      # single disease
    python tools/optimize_report.py 202608 PMK LSD  # subset

The pointers below are the ones the current reports use; adjust if the
generator ever changes them.
"""
import hashlib
import os
import re
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

DISEASES = ["ASF", "Anthraks", "Brucellosis", "CSF", "HPAI", "Jembrana",
            "LSD", "PMK", "Rabies", "SE", "Surra"]

# Shared JS blocks: (filename under assets/js, matcher on script body)
# bootstrap.js already exists (used by the 202607-era reports) and is
# byte-compatible with the flexdashboard-inlined copy, so we reuse it.
SHARED_SCRIPTS = [
    ("bootstrap.js",
     lambda s: "Bootstrap v3.3.5" in s[:200]),
    ("html5shiv.js",
     lambda s: "HTML5 Shiv" in s[:200]),
    ("respond.js",
     lambda s: "Respond.js" in s[:200]),
    ("jquery.stickytableheaders.js",
     lambda s: s.lstrip().startswith('!function(a,b){"use strict";function c(c,g)')),
    ("flexdashboard.js",
     lambda s: "var FlexDashboard = (function ()" in s[:200]),
]

STYLING_CSS_LINK = (
    '<link rel="stylesheet" href="../assets/css/styling.css" type="text/css" />\n'
    '<link rel="stylesheet" href="../assets/css/img.css" type="text/css" />'
)

JQUERY_CDN = '<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>'


def read(path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def write(path, text):
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(text)


def md5(s):
    return hashlib.md5(s.encode("utf-8", errors="ignore")).hexdigest()


def load_logo_prefixes():
    """Return {logo_name: first-80-chars-of-base64} from assets/css/img.css."""
    img_css = read(os.path.join(REPO_ROOT, "assets", "css", "img.css"))
    logos = {}
    for m in re.finditer(
        r'\.(kementan|pkh|keswan|isikhnas)\s*\{[^}]*content:\s*'
        r'url\("data:image/png;base64,([A-Za-z0-9+/=]+)"\)',
        img_css, re.DOTALL):
        logos[m.group(1)] = m.group(2)[:80]
    return logos


def ensure_shared_js_files(reference_html):
    """Extract shared script blocks to assets/js/ (only if not already there).

    Returns md5 -> filename lookup so the rewriter can spot the same blocks in
    other reports.
    """
    scripts = re.findall(r'<script[^>]*>(.*?)</script>', reference_html, re.DOTALL)
    js_dir = os.path.join(REPO_ROOT, "assets", "js")
    mapping = {}
    for filename, matches in SHARED_SCRIPTS:
        body = next((s for s in scripts if matches(s)), None)
        target = os.path.join(js_dir, filename)
        if body is None:
            if not os.path.exists(target):
                print(f"  WARN: reference block for {filename} not found "
                      f"and no existing {filename} to fall back to")
            # else: reference already optimized, existing file will be reused
            continue
        if not os.path.exists(target):
            write(target, body)
            print(f"  wrote {os.path.relpath(target, REPO_ROOT)} "
                  f"({len(body)} bytes)")
        mapping[md5(body)] = filename
    return mapping


def replace_shared_style(html):
    """Replace the huge bootstrap style block with a link to styling.css."""
    def swap(match):
        body = match.group(1)
        if len(body) >= 400_000 and body.lstrip().startswith("@font-face"):
            return STYLING_CSS_LINK
        return match.group(0)

    parts = re.split(r'(<script[^>]*>.*?</script>)', html, flags=re.DOTALL)
    for i in range(0, len(parts), 2):
        parts[i] = re.sub(r'<style[^>]*>(.*?)</style>', swap, parts[i],
                          flags=re.DOTALL)
    return "".join(parts)


def replace_shared_scripts(html, script_map):
    """Replace inline shared script blocks with <script src=...> links."""
    def swap(match):
        body = match.group(1)
        if "jQuery v3.6.0" in body or "jQuery v3.7" in body:
            return JQUERY_CDN
        h = md5(body)
        if h in script_map:
            return f'<script src="../assets/js/{script_map[h]}"></script>'
        return match.group(0)

    return re.sub(r'<script[^>]*>(.*?)</script>', swap, html, flags=re.DOTALL)


def replace_logo_images(html, logos):
    """Rewrite inline <img src="data:..."> logos as <img class="{name}">."""
    for name, prefix in logos.items():
        pattern = re.compile(
            r'<img\s+((?:(?!src=)[^>])*?)'
            r'src="data:image/png;base64,' + re.escape(prefix) + r'[^"]*"'
            r'((?:(?!>)[^>])*?)/?\s*>',
            re.DOTALL)

        def swap(match, n=name):
            pre = re.sub(r'class="[^"]*"', "", match.group(1)).strip()
            post = re.sub(r'class="[^"]*"', "", match.group(2)).strip()
            extra = " ".join(part for part in (pre, post) if part)
            attrs = f'class="{n}"'
            if extra:
                attrs = f'{extra} {attrs}'
            return f'<img {attrs} />'

        html = pattern.sub(swap, html)
    return html


def optimize_one(path, script_map, logos):
    original = read(path)
    html = replace_shared_style(original)
    html = replace_shared_scripts(html, script_map)
    html = replace_logo_images(html, logos)
    write(path, html)
    return len(original), len(html)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    month = sys.argv[1]
    if not re.fullmatch(r'\d{6}', month):
        sys.exit(f"month must be YYYYMM, got {month!r}")

    targets = sys.argv[2:] or DISEASES
    unknown = [t for t in targets if t not in DISEASES]
    if unknown:
        sys.exit(f"unknown disease(s): {unknown}. valid: {DISEASES}")

    # Reference file: whichever target exists first, prefer PMK.
    reference = None
    for d in (["PMK"] + targets if "PMK" in targets else targets):
        candidate = os.path.join(REPO_ROOT, d, f"{month}.html")
        if os.path.exists(candidate):
            reference = candidate
            break
    if not reference:
        sys.exit(f"no {month}.html found under any of {targets}")

    print(f"Reference: {os.path.relpath(reference, REPO_ROOT)}")
    print("Extracting shared assets (if any are missing) ...")
    script_map = ensure_shared_js_files(read(reference))
    logos = load_logo_prefixes()

    print()
    total_before = total_after = 0
    for d in targets:
        path = os.path.join(REPO_ROOT, d, f"{month}.html")
        if not os.path.exists(path):
            print(f"{d}: SKIP (no {month}.html)")
            continue
        before, after = optimize_one(path, script_map, logos)
        total_before += before
        total_after += after
        pct = (1 - after / before) * 100 if before else 0
        print(f"{d:<12} {before:>9} -> {after:>7} bytes  ({pct:5.1f}% smaller)")

    if total_before:
        pct = (1 - total_after / total_before) * 100
        print()
        print(f"TOTAL        {total_before:>9} -> {total_after:>7} bytes  "
              f"({pct:.1f}% smaller)")


if __name__ == "__main__":
    main()
