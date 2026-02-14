import http from 'http';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

const PORT = process.env.PORT || 3000;
const DIGEST_DIR = process.env.DIGEST_DIR || './digests';
const NEWS_DIR = process.env.NEWS_DIR || './news';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: #0a0a0f;
    color: #e0e0e8;
    line-height: 1.7;
  }
  h1, h2, h3 { color: #ff6b35; font-weight: 600; }
  h1 { font-size: 1.8rem; border-bottom: 1px solid #1e1e2e; padding-bottom: 12px; margin-bottom: 1rem; }
  h2 { font-size: 1.3rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
  h3 { font-size: 1.1rem; margin-top: 1rem; }
  a { color: #ff6b35; text-decoration: none; }
  a:hover { text-decoration: underline; }
  p { margin-bottom: 0.8rem; }
  .post-list { list-style: none; padding: 0; }
  .post-list li { 
    padding: 1.2rem; 
    margin: 0.8rem 0; 
    background: #12121a; 
    border-radius: 12px;
    border: 1px solid #1e1e2e;
    transition: all 0.2s;
  }
  .post-list li:hover { border-color: rgba(255,107,53,0.4); transform: translateY(-1px); }
  .post-list a { display: block; }
  .date { color: #7a7a8a; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; margin-top: 0.3rem; }
  .back { 
    display: inline-block; 
    margin-bottom: 1.5rem; 
    font-family: 'JetBrains Mono', monospace; 
    font-size: 0.85rem;
    color: #7a7a8a;
    padding: 0.3rem 0.8rem;
    border: 1px solid #1e1e2e;
    border-radius: 6px;
    transition: all 0.2s;
  }
  .back:hover { color: #ff6b35; border-color: #ff6b35; text-decoration: none; }
  code { 
    background: #12121a; 
    padding: 2px 6px; 
    border-radius: 4px; 
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9em;
  }
  pre { 
    background: #12121a; 
    padding: 1rem; 
    border-radius: 8px; 
    overflow-x: auto; 
    border: 1px solid #1e1e2e;
    margin: 1rem 0;
  }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 3px solid #ff6b35; margin: 1rem 0; padding-left: 1rem; color: #7a7a8a; }
  strong { color: #f0e0d0; }
  .header { 
    display: flex; 
    align-items: center; 
    gap: 1rem; 
    margin-bottom: 0.5rem;
  }
  .logo { font-size: 2.5rem; }
  .title-group h1 { border: none; padding: 0; margin: 0; }
  .subtitle { 
    color: #7a7a8a; 
    font-size: 0.95rem;
    margin-bottom: 2rem;
  }
  .company-link {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    color: #7a7a8a;
    margin-bottom: 2rem;
    display: block;
  }
  article img { max-width: 100%; border-radius: 8px; }
  article ul, article ol { margin: 0.5rem 0 0.5rem 1.5rem; }
  article li { margin-bottom: 0.3rem; }
`;

function getDigests() {
  try {
    const files = fs.readdirSync(DIGEST_DIR)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse();
    return files.map(f => ({
      filename: f,
      date: f.replace('.md', ''),
      path: path.join(DIGEST_DIR, f)
    }));
  } catch (e) {
    return [];
  }
}

function renderIndex(digests) {
  const list = digests.map(d => `
    <li>
      <a href="/post/${d.date}">
        The Daily Grind — ${d.date}
      </a>
      <div class="date">${d.date}</div>
    </li>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Daily Grind — by 99 Cooking</title>
  <link rel="icon" href="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f99e.png">
  <style>${styles}</style>
</head>
<body>
  <div class="header">
    <span class="logo">🦞</span>
    <div class="title-group">
      <h1>The Daily Grind</h1>
    </div>
  </div>
  <p class="subtitle">Developer news, trending repos, new tools, and emerging tech — curated daily by 99 Cooking.</p>
  <a class="company-link" href="https://99.cooking">99.cooking</a>
  <ul class="post-list">${list || '<li>No digests yet</li>'}</ul>
</body>
</html>`;
}

function renderPost(digest) {
  // Try to load news for the same date
  let newsHtml = '';
  const newsPath = path.join(NEWS_DIR, digest.filename);
  try {
    if (fs.existsSync(newsPath)) {
      const newsContent = fs.readFileSync(newsPath, 'utf-8');
      newsHtml = marked(newsContent);
    }
  } catch {}

  const content = fs.readFileSync(digest.path, 'utf-8');
  const devHtml = marked(content);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Daily Grind — ${digest.date}</title>
  <link rel="icon" href="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f99e.png">
  <style>${styles}
  .section-divider { border: none; border-top: 1px solid #1e1e2e; margin: 2rem 0; }
  .section-label { color: #7a7a8a; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <a href="/" class="back">\u2190 All digests</a>
  ${newsHtml ? `<article>${newsHtml}</article><hr class="section-divider"><p class="section-label">Developer Digest</p>` : ''}
  <article>${devHtml}</article>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const digests = getDigests();
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/' || url.pathname === '') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(renderIndex(digests));
  } else if (url.pathname.startsWith('/post/')) {
    const date = url.pathname.replace('/post/', '');
    const digest = digests.find(d => d.date === date);
    if (digest) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(renderPost(digest));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>Not found</h1>');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('🦞 The Daily Grind running on port ' + PORT);
});
