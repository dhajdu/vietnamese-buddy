#!/usr/bin/env python3
"""Render a plan Markdown file to its HTML twin on the ĀRCA design tokens.

Usage: python3 scripts/plan-to-html.py docs/plans/<name>.md
Writes <name>.html beside it. See docs/brand/DESIGN.md for the token values.
"""
import re, sys, pathlib
import markdown

CSS = """
  :root{
    --red:#AF0D0E;--red-deep:#8F0A0B;--red-bright:#C8191A;
    --ink:#111111;--ink-warm:#1C1A17;--body:#3D3A37;
    --cream:#FEF9EF;--cream-warm:#FFF5EA;--white:#FFFFFF;
    --sand:#EEE6DC;--sand-deep:#E3D7C6;--stone:#9E9A93;--paper:#F4F3F3;
    --ok-ink:#157A5A;--amber-bg:#FAEEDA;--amber-ink:#854F0B;--err-ink:#B0332F;
    --elev:0 6px 24px rgba(28,26,23,.10);
    --vn:"Be Vietnam Pro",system-ui,sans-serif;
    --serif:"Playfair Display",Georgia,serif;
    --ui:"Inter","Helvetica Neue",Arial,sans-serif;
    --mono:"JetBrains Mono",ui-monospace,Menlo,monospace;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
  body{margin:0;background:var(--cream);color:var(--body);font-family:var(--ui);font-size:16px;line-height:1.62}
  a{color:var(--red)}
  a:focus-visible{outline:2px solid var(--red);outline-offset:3px}
  .wrap{max-width:1160px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:230px minmax(0,1fr);gap:56px}
  @media (max-width:940px){.wrap{grid-template-columns:minmax(0,1fr);gap:0}}
  header.mast{grid-column:1/-1;padding:64px 0 32px;border-bottom:1px solid var(--sand);margin-bottom:44px}
  .eyebrow{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--red);font-weight:600;margin:0 0 14px}
  nav.toc{position:sticky;top:24px;align-self:start;font-size:13.5px}
  @media (max-width:940px){nav.toc{position:static;margin-bottom:34px;padding-bottom:24px;border-bottom:1px solid var(--sand)}}
  nav.toc ol{list-style:none;margin:0;padding:0;display:grid;gap:5px}
  nav.toc a{color:var(--body);text-decoration:none;display:block;padding:4px 0 4px 13px;border-left:2px solid var(--sand)}
  nav.toc a:hover{color:var(--ink);border-left-color:var(--red)}
  main{min-width:0;max-width:74ch}
  h1{font-family:var(--serif);font-weight:400;font-size:clamp(36px,5vw,56px);line-height:1.06;letter-spacing:-.01em;margin:0 0 16px;color:var(--ink);text-wrap:balance}
  main h2{font-family:var(--serif);font-weight:400;font-size:31px;line-height:1.16;margin:64px 0 12px;color:var(--ink);padding-top:8px;text-wrap:balance}
  main h2:first-child{margin-top:0}
  main h3{font-family:var(--ui);font-weight:600;font-size:18px;margin:36px 0 8px;color:var(--ink)}
  main h4{font-family:var(--ui);font-weight:600;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--stone);margin:26px 0 8px}
  p{margin:0 0 15px}
  main > p:first-of-type{font-family:var(--serif);font-size:20px;color:var(--body)}
  ul,ol{padding-left:21px;margin:0 0 15px}
  li{margin:0 0 7px}
  li::marker{color:var(--stone)}
  strong{color:var(--ink);font-weight:600}
  em{font-style:italic}
  code{font-family:var(--mono);font-size:.84em;background:var(--paper);padding:1px 6px;border-radius:5px;color:var(--ink)}
  pre{font-family:var(--mono);font-size:13px;line-height:1.55;background:var(--white);border:1px solid var(--sand);border-radius:12px;padding:16px 18px;overflow-x:auto;margin:0 0 20px}
  pre code{background:none;padding:0}
  table{border-collapse:collapse;width:100%;font-size:14.5px;background:var(--white);border:1px solid var(--sand);border-radius:12px;overflow:hidden;margin:0 0 20px}
  th,td{text-align:left;vertical-align:top;padding:11px 15px;border-bottom:1px solid var(--sand)}
  th{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--stone);font-weight:600;background:var(--cream-warm)}
  tr:last-child td{border-bottom:0}
  .tbl{overflow-x:auto}
  blockquote{border-left:4px solid var(--red);background:var(--white);border-radius:0 12px 12px 0;padding:14px 20px;margin:0 0 20px;box-shadow:var(--elev)}
  blockquote p:last-child{margin-bottom:0}
  hr{border:0;border-top:1px solid var(--sand);margin:44px 0}
  footer{grid-column:1/-1;border-top:1px solid var(--sand);padding:24px 0 64px;font-size:13px;color:var(--stone)}
"""

def slug(t):
    # Prefixed so the id never starts with a digit, which would be a valid HTML id
    # but an invalid bare CSS selector.
    return 's-' + re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')

def main():
    src = pathlib.Path(sys.argv[1])
    text = src.read_text()

    lines = text.split('\n')
    title = lines[0].lstrip('# ').strip()
    # the bullet list of metadata right after the lede becomes the masthead facts
    body_md = '\n'.join(lines[1:])

    html = markdown.markdown(body_md, extensions=['tables', 'fenced_code', 'sane_lists'])
    # anchor every h2 and collect the contents list
    toc = []
    def anchor(m):
        inner = m.group(1)
        plain = re.sub(r'<[^>]+>', '', inner)
        s = slug(plain)
        toc.append((plain, s))
        return f'<h2 id="{s}">{inner}</h2>'
    html = re.sub(r'<h2>(.*?)</h2>', anchor, html, flags=re.S)
    html = re.sub(r'<table>', '<div class="tbl"><table>', html)
    html = re.sub(r'</table>', '</table></div>', html)

    toc_html = '\n'.join(f'    <li><a href="#{s}">{t}</a></li>' for t, s in toc)
    name = title.split('—')[-1].strip() if '—' in title else title

    out = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{name.title()}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@700;800&family=Playfair+Display:ital,wght@0,400;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap">
<style>{CSS}</style>
</head>
<body>
<div class="wrap">
<header class="mast">
  <p class="eyebrow">Build plan</p>
  <h1>{title.split('—')[-1].strip() if '—' in title else title}</h1>
</header>
<nav class="toc" aria-label="Contents">
  <ol>
{toc_html}
  </ol>
</nav>
<main>
{html}
</main>
<footer>{src.name} · generated from the Markdown twin by scripts/plan-to-html.py</footer>
</div>
</body>
</html>
"""
    dst = src.with_suffix('.html')
    dst.write_text(out)
    print(f"wrote {dst} ({len(out)} bytes, {len(toc)} sections)")

main()
