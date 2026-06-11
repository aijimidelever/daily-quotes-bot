#!/usr/bin/env python3
"""
将 Markdown 内容渲染为可复制、带样式的 HTML 页面
页面顶部有「复制 Markdown 原文」按钮，一键复制
"""

import os
import sys
import markdown
import datetime
import html as html_module

OUTPUT_DIR = '/workspace/daily-quotes-bot/output'

CSS = """
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    background: #f5f3f1;
    color: #333;
    line-height: 1.8;
    padding: 20px;
  }
  .container {
    max-width: 720px;
    margin: 0 auto;
    background: #fff;
    border-radius: 12px;
    padding: 40px 30px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }
  /* 操作按钮区 */
  .action-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .action-btn {
    padding: 8px 20px;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .action-btn:hover { opacity: 0.9; }
  .action-btn:active { opacity: 0.8; }
  .action-btn.green { background: #4caf50; }
  .action-btn.green:hover { background: #3d8b40; }
  .action-btn.orange { background: #ff9800; }
  .action-btn.orange:hover { background: #f57c00; }
  .action-btn.purple { background: #9c27b0; }
  .action-btn.purple:hover { background: #7b1fa2; }
  /* 信息栏 */
  .info-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
  }
  .info-bar .label {
    font-size: 13px;
    color: #999;
    letter-spacing: 1px;
  }
  .md-content h1 {
    font-size: 22px;
    text-align: center;
    margin-bottom: 8px;
    color: #222;
  }
  .md-content blockquote {
    text-align: center;
    font-size: 14px;
    color: #888;
    margin-bottom: 16px;
    border: none;
    padding: 0;
    background: none;
  }
  .md-content em { font-style: italic; color: #888; }
  .md-content hr {
    border: none;
    height: 1px;
    background: #e0e0e0;
    margin: 20px 0;
  }
  .md-content h3 {
    font-size: 16px;
    color: #555;
    margin: 24px 0 8px;
    padding-left: 0;
    border: none;
  }
  .md-content p { margin-bottom: 8px; }
  .md-content strong { color: #222; font-weight: 600; }
  .md-content code {
    background: #f0f0f0;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #666;
  }
  .md-content ul { list-style: none; padding: 0; }
  .raw-section {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid #eee;
  }
  .raw-section .label {
    font-size: 13px;
    color: #999;
    margin-bottom: 12px;
    letter-spacing: 1px;
  }
  .raw-box {
    background: #f5f3f1;
    border: 1px solid #e8e6e4;
    border-radius: 8px;
    padding: 20px;
    font-family: "Menlo", "Monaco", "Consolas", monospace;
    font-size: 14px;
    line-height: 1.8;
    color: #444;
    white-space: pre-wrap;
    word-wrap: break-word;
    max-height: 500px;
    overflow-y: auto;
  }
  .footer {
    margin-top: 32px;
    text-align: center;
    font-size: 12px;
    color: #bbb;
  }
  /* 提示气泡 */
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

SCRIPT = """
function copyRaw() {
  const raw = document.getElementById('rawMd').textContent;
  navigator.clipboard.writeText(raw).then(() => {
    showToast('✅ 已复制到剪贴板！');
  }).catch(() => {
    // fallback for older browsers
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
"""

def render_md_to_html(md_content, date_label):
    md_html = markdown.markdown(md_content, extensions=['extra', 'nl2br'])
    raw_escaped = html_module.escape(md_content)

    page = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>每日一摘 · Markdown 版</title>
<style>
""" + CSS + """
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

  <!-- 日期信息 -->
  <div class="info-bar">
    <div class="label">📝 """ + date_label + """</div>
  </div>

  <div class="md-content">
""" + md_html + """
  </div>

  <div class="raw-section">
    <div class="label">📋 Markdown 原文（上方按钮一键复制）</div>
    <div class="raw-box" id="rawMd">""" + raw_escaped + """</div>
  </div>

  <div class="footer">— 每日一摘 · 用文字温暖你 —</div>
</div>

<script>
""" + SCRIPT + """
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