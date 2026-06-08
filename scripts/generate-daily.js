/**
 * 📖 每日摘录生成脚本
 * 
 * 工作方式：
 * - 周一轮到勇气与成长（courage-growth）
 * - 周二轮到爱与孤独（love-loneliness）
 * - 周三轮到生活与智慧（life-wisdom）
 * - 周四轮到梦想与坚持（dreams-perseverance）
 * - 周五轮到人物传记（biographies）
 * 
 * 每次从对应主题的语录库中随机选取 4-5 条，
 * 生成一篇适配公众号排版的 HTML 文件（约 500 字）。
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ----- 配置 -----
const QUOTES_DIR = path.join(__dirname, '..', 'quotes');
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'daily-template.html');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// 主题轮换表（周一到周五）
const THEME_SCHEDULE = {
  1: { key: 'courage-growth',       name: '勇气与成长',     color: '#e74c3c', emoji: '💪' },
  2: { key: 'love-loneliness',      name: '爱与孤独',       color: '#e91e63', emoji: '💕' },
  3: { key: 'life-wisdom',          name: '生活与智慧',     color: '#4caf50', emoji: '🌿' },
  4: { key: 'dreams-perseverance',  name: '梦想与坚持',     color: '#ff9800', emoji: '⭐' },
  5: { key: 'biographies',          name: '人物传记',       color: '#2196f3', emoji: '📜' },
};

// 主题 CSS class 映射
const THEME_CLASS_MAP = {
  'courage-growth':     'theme-courage-growth',
  'love-loneliness':    'theme-love-loneliness',
  'life-wisdom':        'theme-life-wisdom',
  'dreams-perseverance':'theme-dreams-perseverance',
  'biographies':        'theme-biographies',
};

// 引言库（每日随机选一条）
const EPIGRAPHS = [
  '文字是时间的酿酒，越陈越香。',
  '有些句子，初见是惊艳，再见是人生。',
  '好的文字，能让人在疲惫时看见光。',
  '阅读就是在别人的故事里，遇见自己的影子。',
  '经典从不因岁月褪色，反而在时光中愈发璀璨。',
  '每一段文字都是一扇窗，推开它，便是另一个世界。',
  '我们读书，而后知道自己并不孤单。',
];

// ----- 工具函数 -----

function getWeekday() {
  const now = new Date();
  // 获取中国时区的星期几（1=周一 ... 5=周五）
  const day = now.getDay(); // 0=Sun, 1=Mon...
  return day === 0 ? 5 : day === 6 ? 5 : day; // 周末统一用周五主题
}

function loadQuotes(themeKey) {
  const filePath = path.join(QUOTES_DIR, `${themeKey}.json`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function pickRandom(arr, count) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(crypto.randomBytes(1)[0] / 256 * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
  return `${y}年${m}月${d}日 星期${weekNames[date.getDay()]}`;
}

function generateSummary(quotes, theme) {
  const authors = [...new Set(quotes.map(q => q.author))];
  return `${theme.emoji} 今日与你分享 ${quotes.length} 段关于「${theme.name}」的文字，来自 ${authors.join('、')} 等作家。愿这些句子在你需要的时刻，给你一点力量、一点慰藉。`;
}

// ----- 主逻辑 -----

function generate() {
  const now = new Date();
  const weekday = getWeekday();
  const theme = THEME_SCHEDULE[weekday];

  if (!theme) {
    console.log('今日非工作日，跳过生成。');
    process.exit(0);
  }

  // 加载语录
  const allQuotes = loadQuotes(theme.key);
  const selected = pickRandom(allQuotes, 5);
  const epigraph = pickRandom(EPIGRAPHS, 1)[0];
  const summary = generateSummary(selected, theme);

  // 渲染语录 HTML
  const themeBorderClass = THEME_CLASS_MAP[theme.key] + '-border';
  const quotesHtml = selected.map(q => {
    const tagsHtml = q.tags && q.tags.length > 0
      ? ` · ${q.tags.join(' · ')}`
      : '';
    return `
  <div class="quote-card ${themeBorderClass}">
    <div class="quote-text">${q.text}</div>
    <div class="quote-source">—— <span class="author">${q.author}</span>《${q.source.replace(/[《》]/g, '')}》${tagsHtml}</div>
  </div>`;
  }).join('\n');

  // 读取模板
  let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  // 替换变量
  template = template
    .replace(/{{title}}/g, `${theme.emoji} 每日一摘 · ${theme.name}`)
    .replace(/{{date}}/g, formatDate(now))
    .replace(/{{theme_class}}/g, THEME_CLASS_MAP[theme.key] || 'theme-default')
    .replace(/{{theme_name}}/g, theme.name)
    .replace(/{{epigraph}}/g, epigraph)
    .replace(/{{quotes_list}}/g, quotesHtml)
    .replace(/{{summary}}/g, summary);

  // 写入输出
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const outputPath = path.join(OUTPUT_DIR, `${dateStr}.html`);

  fs.writeFileSync(outputPath, template, 'utf-8');
  
  // 同时输出为 latest.html（方便预览）
  const latestPath = path.join(OUTPUT_DIR, 'latest.html');
  fs.writeFileSync(latestPath, template, 'utf-8');

  // 统计字数
  const textOnly = template.replace(/<[^>]*>/g, '').replace(/\s+/g, '');
  const charCount = textOnly.length;

  console.log(`✅ 每日摘录生成完成！`);
  console.log(`   主题：${theme.name}`);
  console.log(`   日期：${dateStr}`);
  console.log(`   语录：${selected.length} 条`);
  console.log(`   字数：约 ${charCount} 字`);
  console.log(`   输出：${outputPath}`);
}

generate();
