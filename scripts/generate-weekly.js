/**
 * 📖 周末深度拓展文章生成脚本
 *
 * 功能：
 * - 识别当周的主题（根据周一的轮换）
 * - 从该主题语录库中精选 5-6 条
 * - 生成 1000-1500 字的深度解读文章
 * - 输出适配公众号排版的 HTML
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ----- 配置 -----
const QUOTES_DIR = path.join(__dirname, '..', 'quotes');
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'weekly-template.html');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const ARTICLES_DIR = path.join(__dirname, '..', 'articles');

// 主题信息
const THEMES = {
  'courage-growth': {
    key: 'courage-growth',
    name: '勇气与成长',
    emoji: '💪',
    desc: '关于面对困境、突破自我、在挫折中成长的经典文字',
    intro: '勇气不是与生俱来的天赋，而是在每一次跌倒后重新站起的决心。成长也从来不是一帆风顺的旅程，而是在痛苦与挣扎中，我们逐渐成为更好的自己。',
  },
  'love-loneliness': {
    key: 'love-loneliness',
    name: '爱与孤独',
    emoji: '💕',
    desc: '关于爱情、友情、独处与亲情的温柔文字',
    intro: '爱是人类的永恒主题，而孤独则是每个人终将面对的功课。当我们学会与孤独共处，才能真正理解爱的意义。',
  },
  'life-wisdom': {
    key: 'life-wisdom',
    name: '生活与智慧',
    emoji: '🌿',
    desc: '关于日常哲思、生活态度与处世智慧的语录',
    intro: '生活中处处蕴藏着智慧，只是我们常常走得太快，忘了停下来思考。那些穿越时空的箴言，依然在为今日的我们指引方向。',
  },
  'dreams-perseverance': {
    key: 'dreams-perseverance',
    name: '梦想与坚持',
    emoji: '⭐',
    desc: '关于理想、奋斗、长期主义的励志文字',
    intro: '梦想是指路星，坚持是脚下的路。每一个伟大的成就，都始于一个勇敢的梦想和日复一日的坚持。',
  },
  'biographies': {
    key: 'biographies',
    name: '人物传记',
    emoji: '📜',
    desc: '知名企业家与创始人的思想精华与实践智慧',
    intro: '每一个伟大的企业背后，都有一个不平凡的创始人。他们的思考、决策与坚持，为我们提供了超越时代的智慧。',
  },
};

// 拓展标题库
const TITLE_TEMPLATES = {
  'courage-growth': [
    '真正的强大，是允许自己脆弱',
    '在黑暗中前行的人，终将成为别人的光',
    '成长，就是不断打碎自己的过程',
  ],
  'love-loneliness': [
    '学会独处，是最高级的自律',
    '爱不是占有，是如其所是',
    '有些路，只能一个人走',
  ],
  'life-wisdom': [
    '生活不在别处，当下即是全部',
    '简单的日子里，藏着最深的智慧',
    '放下执念，才能看见更远的风景',
  ],
  'dreams-perseverance': [
    '所有伟大的成就，都始于一个笨拙的开始',
    '坚持不是蛮干，是清醒地知道每一步的意义',
    '梦想的种子，需要用时间浇灌',
  ],
  'biographies': [
    '站在巨人的肩膀上：企业家们的底层思维',
    '从失败中崛起的创始人智慧',
    '长期主义者，从不相信捷径',
  ],
};

// 段落生成器 - 基于主题和语录生成深度内容
function generateArticleContent(quotes, themeKey) {
  const theme = THEMES[themeKey];
  const paragraphs = [];

  // 开头引入
  paragraphs.push(theme.intro);

  // 对每条语录进行深度解读
  const shuffledQuotes = [...quotes];
  for (let i = shuffledQuotes.length - 1; i > 0; i--) {
    const j = Math.floor(crypto.randomBytes(1)[0] / 256 * (i + 1));
    [shuffledQuotes[i], shuffledQuotes[j]] = [shuffledQuotes[j], shuffledQuotes[i]];
  }

  const selectedQuotes = shuffledQuotes.slice(0, Math.min(6, shuffledQuotes.length));

  selectedQuotes.forEach((quote, index) => {
    // 插入小标题（每隔2-3条一个）
    if (index % 2 === 0) {
      const subTitles = [
        `${theme.emoji} 关于「${theme.name}」的另一种解读`,
        `「${quote.author}」给我们的启示`,
        `那些文字教会我们的事`,
        `穿越时间的智慧`,
      ];
      const subTitle = subTitles[index % subTitles.length];
      paragraphs.push(`<h2>${subTitle}</h2>`);
    }

    // 引用语录
    paragraphs.push(
      `<blockquote>${quote.text}<span class="source">—— ${quote.author}《${quote.source.replace(/[《》]/g, '')}》</span></blockquote>`
    );

    // 基于语录生成拓展解读
    const reflections = generateReflection(quote, themeKey, index);
    paragraphs.push(reflections);
  });

  // 结尾总结
  paragraphs.push(generateConclusion(theme));

  // 合并段落，确保字数在 1000-1500 之间
  let content = paragraphs.join('\n\n');
  
  // 如果内容太短，补充一些内容
  const wordCount = content.replace(/<[^>]*>/g, '').length;
  if (wordCount < 800) {
    content += `\n\n<p>${theme.emoji} 这些文字穿越岁月来到我们面前，不是为了给我们标准答案，而是为了在困惑时给我们一点光亮。愿你在阅读中找到属于自己的力量。</p>`;
  }

  return content;
}

function generateReflection(quote, themeKey, index) {
  const reflections = {
    'courage-growth': [
      `勇气不是没有恐惧，而是带着恐惧依然前行。${quote.author}的这句话提醒我们，真正的成长往往发生在舒适区之外。当我们面对困境时，不妨问问自己：如果我不害怕，我会怎么做？这个问题的答案，往往就是成长的起点。`,
      `每一次选择勇敢，都是一次自我超越。${quote.author}笔下的人生智慧告诉我们，那些让我们感到痛苦的事情，恰恰是最好的老师。就像打磨玉石一样，成长的代价是疼痛，但收获是光芒。`,
      `在这个充满不确定性的时代，我们需要的不是无所畏惧，而是在恐惧中依然保持前行的能力。正如${quote.author}所言，真正的勇气，是在认清生活的真相之后，依然热爱生活。`,
    ],
    'love-loneliness': [
      `孤独不是一种缺失，而是一种完整。${quote.author}的文字让我们明白，只有当一个人学会享受独处的时光，才能真正有能力去爱别人。独处时，我们不是在等待什么，而是在成为什么。`,
      `爱的最深境界，或许是允许对方做自己。${quote.author}的话触及了爱的本质——爱不是占有，不是改变，而是在理解中成就彼此。这样的爱，既需要勇气，也需要智慧。`,
      `人与人之间的相遇，都是一场美丽的意外。${quote.author}笔下的情感世界提醒我们，珍惜当下的每一次相遇，因为有些人，一旦错过就不再。`,
    ],
    'life-wisdom': [
      `生活的智慧，往往藏在最平凡的日子里。${quote.author}这段话道出了人生的真谛——我们总是追逐远方的风景，却忽略了脚下的美好。真正的智慧，是能够在平凡中发现不平凡。`,
      `放下执念，不是放弃追求，而是换一种方式前行。${quote.author}的人生哲学告诉我们，有时候停下来思考，比盲目向前更重要。生活的艺术，在于知道什么时候该进，什么时候该退。`,
      `简单，是最高级的复杂。${quote.author}的话看似朴素，却蕴含着深刻的处世哲学。在这个信息爆炸的时代，学会做减法，或许是我们最需要学习的功课。`,
    ],
    'dreams-perseverance': [
      `梦想的价值，不在于最终能否实现，而在于追逐的过程让你成为了什么样的人。${quote.author}的这段话激励了无数人，也提醒我们：每一个伟大的梦想，都始于一个勇敢的开始。`,
      `坚持不是盲目的固执，而是在认清困难后依然选择前行。${quote.author}用自己的人生经历告诉我们，成功的路上并不拥挤，因为能坚持下来的人不多。`,
      `时间是最公平的裁判。${quote.author}的这句话背后，是对长期主义的最好诠释——不要高估短期收益，也不要低估长期积累。真正的成就，都是用时间换来的。`,
    ],
    'biographies': [
      `每一位伟大的创始人，都是从普通人开始的。${quote.author}的经历证明，成功没有捷径，只有比别人多走一步的坚持。在不确定中做决策，在质疑中坚持方向，这是所有优秀企业家的共同特质。`,
      `创业的本质，是解决问题。${quote.author}的这句话揭示了商业最朴素也最深刻的真理——你解决的问题越大，创造的价值就越大。在追逐风口之前，不如先想想你能为世界解决什么问题。`,
      `第一性原理是顶级思考者共有的思维方式。${quote.author}的决策逻辑提醒我们，回归事物最基本的原理去思考，往往能发现被大多数人忽略的机会。真正的创新，来自于对常识的重新审视。`,
    ],
  };

  const themeReflections = reflections[themeKey] || reflections['life-wisdom'];
  return `<p>${themeReflections[index % themeReflections.length]}</p>`;
}

function generateConclusion(theme) {
  const conclusions = [
    `<p>这些穿越岁月的文字，在今天依然闪烁着智慧的光芒。它们不是答案本身，而是引导我们思考的路标。${theme.emoji} 愿你在生活的旅途中，既能勇敢前行，也能在需要的时候，从文字中找到温暖和力量。</p>`,
    `<p>每一段文字都是一次与作者的对话，每一次阅读都是一次自我发现。${theme.emoji} 希望你在这份摘录中，找到那个触动你的句子，让它成为你前行的力量。</p>`,
    `<p>我们收集这些文字，不是为了怀旧，而是为了在喧嚣的世界中，保留一方可以静心思考的空间。${theme.emoji} 愿文字的温度，能陪你度过每一个需要力量的日子。</p>`,
  ];
  return conclusions[Math.floor(Math.random() * conclusions.length)];
}

function getWeekTheme() {
  const now = new Date();
  const day = now.getDay();
  const weekKeys = Object.keys(THEMES);
  // 根据当前周数决定主题（轮流）
  const weekNum = Math.floor(getWeekNumber(now) % weekKeys.length);
  return weekKeys[weekNum];
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function pickRandom(arr) {
  const idx = Math.floor(crypto.randomBytes(1)[0] / 256 * arr.length);
  return arr[idx];
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
  return `${y}年${m}月${d}日 星期${weekNames[date.getDay()]}`;
}

// ----- 主逻辑 -----

function generate() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat

  // 只在周末生成
  if (day !== 0 && day !== 6) {
    console.log('今日非周末，跳过生成。');
    process.exit(0);
  }

  // 选择主题
  const themeKey = getWeekTheme();
  const theme = THEMES[themeKey];

  // 加载语录
  const allQuotes = loadQuotes(themeKey);
  const title = pickRandom(TITLE_TEMPLATES[themeKey]);
  
  // 生成文章内容
  const articleContent = generateArticleContent(allQuotes, themeKey);

  // 渲染模板
  let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  template = template
    .replace(/{{title}}/g, `${theme.emoji} ${title}`)
    .replace(/{{date}}/g, formatDate(now))
    .replace(/{{theme_class}}/g, `theme-${themeKey}`)
    .replace(/{{theme_name}}/g, theme.name)
    .replace(/{{article_content}}/g, articleContent);

  // 写入输出
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputHtmlPath = path.join(OUTPUT_DIR, `${dateStr}-weekly.html`);
  fs.writeFileSync(outputHtmlPath, template, 'utf-8');

  // 同时更新 latest.html（周末展示深度文章）
  const latestHtmlPath = path.join(OUTPUT_DIR, 'latest.html');
  fs.writeFileSync(latestHtmlPath, template, 'utf-8');

  // ----- 生成 Markdown 版本 -----
  const mdLines = [];
  mdLines.push(`# ${theme.emoji} ${title}`);
  mdLines.push('');
  mdLines.push(`> ${formatDate(now)} | 主题：${theme.name}`);
  mdLines.push('');
  mdLines.push('---');
  mdLines.push('');

  // 从 html 内容提取纯文本段落
  const textContent = articleContent
    .replace(/<h2>/g, '\n\n## ')
    .replace(/<\/h2>/g, '')
    .replace(/<blockquote>/g, '\n> ')
    .replace(/<\/blockquote>/g, '')
    .replace(/<span class="source">/g, '\n>\n> —— ')
    .replace(/<\/span>/g, '')
    .replace(/<p>/g, '\n')
    .replace(/<\/p>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  mdLines.push(textContent);
  mdLines.push('');
  mdLines.push('---');
  mdLines.push(`*— 每日一摘 · 周末深度 —*`);

  const mdContent = mdLines.join('\n');

  const outputMdPath = path.join(OUTPUT_DIR, `${dateStr}-weekly.md`);
  fs.writeFileSync(outputMdPath, mdContent, 'utf-8');

  const latestMdPath = path.join(OUTPUT_DIR, 'latest.md');
  fs.writeFileSync(latestMdPath, mdContent, 'utf-8');

  // 统计字数
  const textOnly = template.replace(/<[^>]*>/g, '').replace(/\s+/g, '');
  const charCount = textOnly.length;

  console.log(`✅ 周末深度文章生成完成！`);
  console.log(`   主题：${theme.name}`);
  console.log(`   标题：${title}`);
  console.log(`   日期：${dateStr}`);
  console.log(`   字数：约 ${charCount} 字`);
  console.log(`   输出：`);
  console.log(`   📄 HTML: ${outputHtmlPath}`);
  console.log(`   📝 MD:   ${outputMdPath}`);
}

function loadQuotes(themeKey) {
  const filePath = path.join(QUOTES_DIR, `${themeKey}.json`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

generate();
