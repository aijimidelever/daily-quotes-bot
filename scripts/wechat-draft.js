/**
 * 📲 推送到微信公众号草稿箱
 *
 * 功能：
 * 1. 读取最新生成的 HTML 内容（output/latest.html）
 * 2. 获取微信 access_token
 * 3. 创建草稿到公众号草稿箱
 *
 * 使用方法：
 *   WX_APPID=xxx WX_APPSECRET=xxx node scripts/wechat-draft.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const LATEST_FILE = path.join(OUTPUT_DIR, 'latest.html');

const APPID = process.env.WX_APPID;
const APPSECRET = process.env.WX_APPSECRET;

if (!APPID || !APPSECRET) {
  console.error('❌ 请设置环境变量 WX_APPID 和 WX_APPSECRET');
  process.exit(1);
}

// ----- 工具函数 -----

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('解析响应失败: ' + data)); }
      });
    }).on('error', reject);
  });
}

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(body);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('解析响应失败: ' + data)); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function extractTitle(html) {
  // 从 HTML 中提取标题
  const match = html.match(/<title>([^<]+)<\/title>/);
  return match ? match[1].trim() : '每日一摘';
}

function extractTextContent(html) {
  // 去除 HTML 标签，保留内容用于摘要
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFirstImage(html) {
  // WeChat 的 content 字段中直接使用图片链接就可以
  // 但目前我们的内容是纯文字，没有图片
  return '';
}

function getAccessToken() {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`;
  return httpsGet(url);
}

function addDraft(token, articles) {
  const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;
  return httpsPost(url, { articles });
}

// ----- 主逻辑 -----

async function main() {
  // 1. 读取最新内容
  if (!fs.existsSync(LATEST_FILE)) {
    console.error('❌ 未找到最新内容文件: output/latest.html');
    console.error('   请先生成每日摘录');
    process.exit(1);
  }

  const html = fs.readFileSync(LATEST_FILE, 'utf-8');
  const title = extractTitle(html);
  const textContent = extractTextContent(html);
  const digest = textContent.substring(0, 120) + '…';

  // 2. 提取语录部分作为正文（去除模板样式代码）
  let contentBody = html;

  // 3. 获取 access_token
  console.log('🔑 正在获取 access_token…');
  const tokenRes = await getAccessToken();

  if (tokenRes.errcode) {
    console.error(`❌ 获取 access_token 失败: ${tokenRes.errmsg}`);
    process.exit(1);
  }

  const accessToken = tokenRes.access_token;
  console.log('✅ access_token 获取成功');

  // 4. 创建草稿
  console.log('📝 正在创建草稿…');

  // 微信草稿箱 content 字段需要特殊格式
  // 提取 body 内的主要内容，不去除样式（微信会保留部分样式）
  const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
  const articleBody = bodyMatch ? bodyMatch[1].trim() : textContent;

  // 构建微信公众号文章内容
  // 微信支持基础的 HTML 标签：p, br, strong, em, blockquote, img 等
  // 不支持的 CSS 会被自动过滤
  const wechatContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${articleBody}
</body>
</html>`;

  const articles = [{
    title: title,
    author: '每日一摘',
    digest: digest,
    content: wechatContent,
    content_source_url: 'https://aijimidelever.github.io/daily-quotes-bot/latest.html',
    need_open_comment: 0,
    only_fans_can_comment: 0,
  }];

  const draftRes = await addDraft(accessToken, articles);

  if (draftRes.errcode && draftRes.errcode !== 0) {
    // 常见错误处理
    const errorMap = {
      '40001': 'access_token 无效或过期',
      '40007': '不合法的媒体文件 id',
      '41001': '缺少 access_token 参数',
      '42001': 'access_token 超时',
    };
    const errMsg = errorMap[draftRes.errcode] || draftRes.errmsg;
    console.error(`❌ 创建草稿失败 (${draftRes.errcode}): ${errMsg}`);
    process.exit(1);
  }

  const mediaId = draftRes.media_id;
  console.log(`\n✅ 草稿创建成功！`);
  console.log(`   标题：${title}`);
  console.log(`   摘要：${digest}`);
  console.log(`   media_id：${mediaId}`);
  console.log(`\n📲 请登录公众号后台 → 草稿箱 → 查看并发布`);
}

main().catch(err => {
  console.error('❌ 运行出错:', err.message);
  process.exit(1);
});
