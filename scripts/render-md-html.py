#!/usr/bin/env python3
"""
将 Markdown 内容渲染为可复制、带样式切换的 HTML 页面
支持 4 种风格：暖阳、水墨、薰衣草、极简
"""

import os
import sys
import markdown
import datetime
import html as html_module

OUTPUT_DIR = '/workspace/daily-quotes-bot/output'

# ===== 基础 CSS（按钮、toast、raw-box 等功能组件） =====
BASE_CSS = """
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    line-height: 1.8;
    padding: 20px;
    transition: background 0.4s, color 0.4s;
  }
  .container {
    max-width: 720px;
    margin: 0 auto;
    border-radius: 12px;
    padding: 40px 30px;
    transition: background 0.4s, box-shadow 0.4s;
  }

  /* 操作按钮区 */
  .action-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
    flex-wrap: wrap;
    align-items: center;
  }
  .action-btn {
    padding: 8px 18px;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    text-decoration: none;
  }
  .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
  .action-btn:active { opacity: 0.75; }
  .action-btn.green { background: #4caf50; }
  .action-btn.orange { background: #ff9800; }
  .action-btn.purple { background: #9c27b0; }

  /* 风格切换区 */
  .style-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    align-items: center;
    flex-wrap: wrap;
  }
  .style-bar .style-label {
    font-size: 12px;
    color: #999;
    letter-spacing: 1px;
  }
  .style-btn {
    padding: 6px 14px;
    border: 2px solid transparent;
    border-radius: 20px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.25s;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .style-btn:hover { transform: translateY(-1px); }
  .style-btn.active { border-width: 2px; font-weight: 600; }

  /* 信息栏 */
  .info-bar {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid;
    transition: border-color 0.4s;
  }
  .info-bar .label {
    font-size: 13px;
    letter-spacing: 1px;
    transition: color 0.4s;
  }

  /* 内容区 */
  .md-content { transition: color 0.4s; }
  .md-content h1 {
    font-size: 22px;
    text-align: center;
    margin-bottom: 6px;
    transition: color 0.4s;
  }
  .md-content blockquote {
    text-align: center;
    font-size: 14px;
    margin-bottom: 16px;
    border: none;
    padding: 0;
    background: none;
    transition: color 0.4s;
  }
  .md-content em { font-style: italic; }
  .md-content hr {
    border: none;
    height: 1px;
    margin: 24px 0;
    transition: background 0.4s;
  }
  .md-content h3 {
    font-size: 15px;
    margin: 28px 0 10px;
    padding-left: 12px;
    border-left: 3px solid;
    transition: color 0.4s, border-color 0.4s;
  }
  .md-content p { margin-bottom: 10px; }
  .md-content p > blockquote {
    font-size: 17px;
    line-height: 2;
    padding: 16px 24px;
    border-radius: 8px;
    margin: 8px 0;
    border-left: 4px solid;
    transition: background 0.4s, border-color 0.4s, color 0.4s;
  }
  .md-content strong { font-weight: 600; transition: color 0.4s; }
  .md-content code {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    transition: background 0.4s, color 0.4s;
  }
  .md-content ul { list-style: none; padding: 0; }

  /* 原文区 */
  .raw-section {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid;
    transition: border-color 0.4s;
  }
  .raw-section .label {
    font-size: 13px;
    letter-spacing: 1px;
    transition: color 0.4s;
  }
  .raw-box {
    border: 1px solid;
    border-radius: 8px;
    padding: 20px;
    font-family: "Menlo", "Monaco", "Consolas", monospace;
    font-size: 14px;
    line-height: 1.8;
    white-space: pre-wrap;
    word-wrap: break-word;
    max-height: 400px;
    overflow-y: auto;
    transition: background 0.4s, border-color 0.4s, color 0.4s;
  }
  .footer {
    margin-top: 32px;
    text-align: center;
    font-size: 12px;
    transition: color 0.4s;
  }
  .toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #fff;
    padding: 10px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9999;
    display: none;
    animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
"""

# ===== 4 种风格主题 =====
THEMES = {
  'warm': {
    'name': '暖阳',
    'emoji': '☀️',
    'btn_bg': '#f5e6d3',
    'btn_text': '#8b6914',
    'btn_border': '#c49a6c',
    'vars': """
      body { background: #faf5ef; color: #4a3728; }
      .container { background: #fff9f2; box-shadow: 0 2px 16px rgba(139,105,20,0.06); }
      .info-bar { border-color: #e8d5b8; }
      .info-bar .label { color: #a08050; }
      .md-content h1 { color: #6b4c1e; }
      .md-content blockquote { color: #a08050; }
      .md-content em { color: #a08050; }
      .md-content hr { background: #e8d5b8; }
      .md-content h3 { color: #8b6914; border-color: #c49a6c; }
      .md-content p > blockquote { background: #fdf4e8; border-color: #d4a574; color: #4a3728; }
      .md-content strong { color: #6b4c1e; }
      .md-content code { background: #f5e6d3; color: #8b6914; }
      .raw-section { border-color: #e8d5b8; }
      .raw-section .label { color: #a08050; }
      .raw-box { background: #fdf4e8; border-color: #e8d5b8; color: #4a3728; }
      .footer { color: #c49a6c; }
    """,
  },
  'ink': {
    'name': '水墨',
    'emoji': '水墨',
    'btn_bg': '#f0f0f0',
    'btn_text': '#333',
    'btn_border': '#888',
    'vars': """
      body { background: #f8f8f8; color: #2c2c2c; }
      .container { background: #fefefe; box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
      .info-bar { border-color: #ddd; }
      .info-bar .label { color: #999; }
      .md-content h1 { color: #1a1a1a; }
      .md-content blockquote { color: #888; }
      .md-content em { color: #888; }
      .md-content hr { background: #ddd; }
      .md-content h3 { color: #333; border-color: #888; }
      .md-content p > blockquote { background: #f5f5f5; border-color: #aaa; color: #2c2c2c; }
      .md-content strong { color: #1a1a1a; }
      .md-content code { background: #f0f0f0; color: #555; }
      .raw-section { border-color: #ddd; }
      .raw-section .label { color: #999; }
      .raw-box { background: #f5f5f5; border-color: #ddd; color: #2c2c2c; }
      .footer { color: #bbb; }
    """,
  },
  'lavender': {
    'name': '薰衣草',
    'emoji': '💜',
    'btn_bg': '#e8dff5',
    'btn_text': '#5b3e8a',
    'btn_border': '#9b72cf',
    'vars': """
      body { background: #f3eff9; color: #3d2b5a; }
      .container { background: #faf8fd; box-shadow: 0 2px 16px rgba(91,62,138,0.06); }
      .info-bar { border-color: #d4c8e8; }
      .info-bar .label { color: #8a6dba; }
      .md-content h1 { color: #4a2d6e; }
      .md-content blockquote { color: #8a6dba; }
      .md-content em { color: #8a6dba; }
      .md-content hr { background: #d4c8e8; }
      .md-content h3 { color: #5b3e8a; border-color: #9b72cf; }
      .md-content p > blockquote { background: #f3eff9; border-color: #b89de0; color: #3d2b5a; }
      .md-content strong { color: #4a2d6e; }
      .md-content code { background: #e8dff5; color: #5b3e8a; }
      .raw-section { border-color: #d4c8e8; }
      .raw-section .label { color: #8a6dba; }
      .raw-box { background: #f3eff9; border-color: #d4c8e8; color: #3d2b5a; }
      .footer { color: #9b72cf; }
    """,
  },
  'mint': {
    'name': '薄荷',
    'emoji': '🌿',
    'btn_bg': '#e0f2f1',
    'btn_text': '#2e7d32',
    'btn_border': '#66bb6a',
    'vars': """
      body { background: #f1f8f6; color: #2d4a3e; }
      .container { background: #f9fcfb; box-shadow: 0 2px 16px rgba(46,125,50,0.05); }
      .info-bar { border-color: #c8e6c9; }
      .info-bar .label { color: #66bb6a; }
      .md-content h1 { color: #1b5e20; }
      .md-content blockquote { color: #66bb6a; }
      .md-content em { color: #66bb6a; }
      .md-content hr { background: #c8e6c9; }
      .md-content h3 { color: #2e7d32; border-color: #66bb6a; }
      .md-content p > blockquote { background: #f1f8f6; border-color: #81c784; color: #2d4a3e; }
      .md-content strong { color: #1b5e20; }
      .md-content code { background: #e0f2f1; color: #2e7d32; }
      .raw-section { border-color: #c8e6c9; }
      .raw-section .label { color: #66bb6a; }
      .raw-box { background: #f1f8f6; border-color: #c8e6c9; color: #2d4a3e; }
      .footer { color: #81c784; }
    """,
  },
}

# ===== JavaScript =====
SCRIPT_TEMPLATE = """
function copyRaw() {
  const raw = document.getElementById('rawMd').textContent;
  navigator.clipboard.writeText(raw).then(() => {
    showToast('✅ 已复制到剪贴板！');
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = raw;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('✅ 已复制到剪贴板！');
  });
}
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 2500);
}
function switchTheme(themeName) {
  // 移除所有主题样式
  const themeStyles = document.querySelectorAll('.theme-style');
  themeStyles.forEach(s => s.remove());
  // 添加新主题
  const styleEl = document.createElement('style');
  styleEl.className = 'theme-style';
  styleEl.textContent = THEME_VARS[themeName];
  document.head.appendChild(styleEl);
  // 更新按钮激活状态
  const btns = document.querySelectorAll('.style-btn');
  btns.forEach(b => {
    b.classList.remove('active');
    if (b.dataset.theme === themeName) b.classList.add('active');
  });
  // 保存偏好
  localStorage.setItem('daily-quotes-theme', themeName);
}
// 初始化：读取上次选择的主题
const savedTheme = localStorage.getItem('daily-quotes-theme') || 'warm';
switchTheme(savedTheme);
"""


def render_md_to_html(md_content, date_label):
    md_html = markdown.markdown(md_content, extensions=['extra', 'nl2br'])
    raw_escaped = html_module.escape(md_content)

    # 构建风格按钮 HTML
    style_btns_html = '<span class="style-label">🎨 风格：</span>\n'
    for key, t in THEMES.items():
        active_class = ' active' if key == 'warm' else ''
        style_btns_html += (
            f'<button class="style-btn{active_class}" '
            f'style="background:{t["btn_bg"]};color:{t["btn_text"]};border-color:{t["btn_border"]}" '
            f'data-theme="{key}" '
            f'onclick="switchTheme(\'{key}\')">{t["emoji"]} {t["name"]}</button>\n'
        )

    # 构建主题变量 JS 对象
    theme_vars_js = 'const THEME_VARS = {\n'
    for key, t in THEMES.items():
        # 提取 vars 中的 CSS 内容
        vars_css = t['vars'].strip()
        theme_vars_js += f'  "{key}": `{vars_css}`,\n'
    theme_vars_js += '};\n'

    page = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>每日一摘 · Markdown 版</title>
<style>
""" + BASE_CSS + """
</style>
<!-- 默认暖阳主题 -->
<style class="theme-style">
""" + THEMES['warm']['vars'] + """
</style>
</head>
<body>

<div class="toast" id="toast"></div>

<div class="container">

  <!-- 操作按钮区 -->
  <div class="action-bar">
    <button class="action-btn green" onclick="copyRaw()">📋 复制 Markdown</button>
    <a class="action-btn orange" href="https://github.com/aijimidelever/daily-quotes-bot/actions/workflows/daily-quote.yml" target="_blank">🔄 换一批</a>
    <a class="action-btn purple" href="https://github.com/aijimidelever/daily-quotes-bot/actions/workflows/daily-quote.yml" target="_blank">✨ 生成今日</a>
  </div>

  <!-- 风格切换 -->
  <div class="style-bar">
""" + style_btns_html + """
  </div>

  <!-- 日期信息 -->
  <div class="info-bar">
    <div class="label">📝 """ + date_label + """</div>
  </div>

  <!-- 渲染内容 -->
  <div class="md-content">
""" + md_html + """
  </div>

  <!-- Markdown 原文 -->
  <div class="raw-section">
    <div class="label">📋 Markdown 原文</div>
    <div class="raw-box" id="rawMd">""" + raw_escaped + """</div>
  </div>

  <div class="footer">— 每日一摘 · 用文字温暖你 —</div>
</div>

<script>
""" + theme_vars_js + """
""" + SCRIPT_TEMPLATE + """
</script>
</body>
</html>"""
    return page


def main():
    md_path = os.path.join(OUTPUT_DIR, 'latest.md')
    if not os.path.exists(md_path):
        print("❌ 未找到 latest.md")
        sys.exit(1)

    md_content = open(md_path, 'r', encoding='utf-8').read()
    today = datetime.date.today().strftime('%Y年%m月%d日')

    page = render_md_to_html(md_content, today)

    html_path = os.path.join(OUTPUT_DIR, 'latest-copy.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(page)

    date_str = datetime.date.today().strftime('%Y-%m-%d')
    dated_path = os.path.join(OUTPUT_DIR, date_str + '-copy.html')
    with open(dated_path, 'w', encoding='utf-8') as f:
        f.write(page)

    print(f"✅ Markdown 渲染页面生成完成！")
    print(f"   📋 复制用页面: {dated_path}")


if __name__ == '__main__':
    main()