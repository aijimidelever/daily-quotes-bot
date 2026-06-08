# 📖 每日一摘 — 文学语录每日推送系统

用文字温暖每一个需要力量的时刻。

## ✨ 功能

| 功能 | 说明 |
|------|------|
| 📅 **每日摘录** | 工作日推送 ~500 字经典语录摘录（含来源+作者） |
| 📝 **周末深度** | 周六推送 1000-1500 字主题拓展文章 |
| 🎯 **5 大主题** | 勇气与成长 · 爱与孤独 · 生活与智慧 · 梦想与坚持 · 人物传记 |
| 🌐 **在线预览** | GitHub Pages 每日更新，点击链接即可查看 |
| 🤖 **自动运行** | GitHub Actions 定时触发，无需手动操作 |

## 🗂 项目结构

```
daily-quotes-bot/
├── .github/workflows/
│   ├── daily-quote.yml      # 工作日自动生成摘录
│   ├── weekly-essay.yml     # 周末自动生成深度文章
│   └── deploy-pages.yml     # 部署到 GitHub Pages
├── quotes/                   # 语录数据库（5个主题，共 ~200 条）
│   ├── courage-growth.json   # 💪 勇气与成长
│   ├── love-loneliness.json  # 💕 爱与孤独
│   ├── life-wisdom.json      # 🌿 生活与智慧
│   ├── dreams-perseverance.json # ⭐ 梦想与坚持
│   └── biographies.json      # 📜 人物传记
├── templates/                # 公众号排版模板
│   ├── daily-template.html   # 每日摘录模板
│   └── weekly-template.html  # 周末深度模板
├── scripts/                  # 生成脚本
│   ├── generate-daily.js     # 每日摘录生成
│   └── generate-weekly.js    # 周末文章生成
├── output/                   # 生成的每日内容（可 GitHub Pages 预览）
└── package.json
```

## 🚀 快速开始

### 1. 创建 GitHub 仓库

在 [github.com](https://github.com) 新建一个仓库，命名为 `daily-quotes-bot`（或你喜欢的名字）。

### 2. 上传代码

将本项目的所有文件上传到你的仓库 main 分支。

### 3. 启用 GitHub Pages

1. 进入仓库 **Settings → Pages**
2. **Source** 选择 **GitHub Actions**
3. 无需额外配置，`.github/workflows/deploy-pages.yml` 会自动部署

### 4. 查看效果

- 每日摘录自动生成后，访问：`https://<你的用户名>.github.io/daily-quotes-bot/2026-06-08.html`
- 最新内容始终在：`https://<你的用户名>.github.io/daily-quotes-bot/latest.html`
- 你也可以手动触发 Actions → 选择 **daily-quote.yml** → 点 **Run workflow** 立即生成

### 5. 发布到微信公众号

1. 登录公众号后台 → 新建图文消息
2. 打开 GitHub Pages 生成的 HTML 页面
3. 将内容复制到公众号编辑器
4. 调整格式后发布

> 💡 **小技巧**：推荐复制纯文本内容到公众号编辑器，然后利用公众号的排版工具调整样式。模板中的 CSS 样式可作为公众号编辑器中的配色参考。

## 📊 语录数据格式

每条语录包含以下字段：

```json
{
  "id": 1,
  "text": "语录正文",
  "source": "《书名》或演讲名",
  "author": "作者名",
  "theme": "courage-growth",
  "tags": ["勇气", "成长"]
}
```

## 🔧 自定义

- **修改推送时间**：编辑 `.github/workflows/daily-quote.yml` 中的 cron 表达式
- **增加新语录**：直接编辑 `quotes/` 下的 JSON 文件
- **更换主题顺序**：修改 `scripts/generate-daily.js` 中的 `THEME_SCHEDULE`
- **更换模板样式**：编辑 `templates/` 下的 HTML 文件

## 📅 主题轮换表

| 星期 | 主题 |
|------|------|
| 周一 | 💪 勇气与成长 |
| 周二 | 💕 爱与孤独 |
| 周三 | 🌿 生活与智慧 |
| 周四 | ⭐ 梦想与坚持 |
| 周五 | 📜 人物传记 |
| 周末 | 📝 深度拓展文章 |

## 🌱 扩展方向

- [ ] 接入 AI API 自动生成更多语录和深度解读
- [ ] 增加用户投稿机制
- [ ] 邮件订阅推送
- [ ] 微信公众平台 API 自动发布
- [ ] 按标签/作者检索历史摘录

---

> **每日一摘** — 用文字温暖你。
