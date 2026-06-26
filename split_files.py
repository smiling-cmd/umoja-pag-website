import re
from pathlib import Path

base = Path(r'c:\Users\vonel\OneDrive\Desktop\UMOJA PAG')


def extract(file_name, css_name, js_name):
    path = base / file_name
    html = path.read_text(encoding='utf-8')

    style_match = re.search(r'<style[^>]*>(.*?)</style>', html, re.S)
    if style_match:
        css = style_match.group(1).strip() + '\n'
        (base / css_name).write_text(css, encoding='utf-8')
        html = html[:style_match.start()] + f'<link rel="stylesheet" href="{css_name}">\n' + html[style_match.end():]

    script_match = re.search(r'<script\s*>(.*?)</script>', html, re.S)
    if script_match:
        js = script_match.group(1).strip() + '\n'
        (base / js_name).write_text(js, encoding='utf-8')
        html = html[:script_match.start()] + f'<script src="{js_name}"></script>\n' + html[script_match.end():]

    path.write_text(html, encoding='utf-8')


if __name__ == '__main__':
    extract('index.html', 'index.css', 'index.js')
    extract('admin.html', 'admin.css', 'admin.js')
