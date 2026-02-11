import http from 'http';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

const PORT = process.env.PORT || 3000;
const DIGEST_DIR = process.env.DIGEST_DIR || './digests';

const styles = `
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: #0d1117;
    color: #c9d1d9;
    line-height: 1.6;
  }
  h1, h2, h3 { color: #58a6ff; }
  h1 { border-bottom: 1px solid #30363d; padding-bottom: 10px; }
  a { color: #58a6ff; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .post-list { list-style: none; padding: 0; }
  .post-list li { 
    padding: 15px; 
    margin: 10px 0; 
    background: #161b22; 
    border-radius: 8px;
    border: 1px solid #30363d;
  }
  .post-list li:hover { border-color: #58a6ff; }
  .date { color: #8b949e; font-size: 0.9em; }
  .back { margin-bottom: 20px; display: inline-block; }
  code { background: #161b22; padding: 2px 6px; border-radius: 4px; }
  pre { background: #161b22; padding: 15px; border-radius: 8px; overflow-x: auto; }
  blockquote { border-left: 3px solid #58a6ff; margin: 0; padding-left: 15px; color: #8b949e; }
  .emoji { font-size: 1.2em; }
  .header { display: flex; align-items: center; gap: 10px; margin-bottom: 30px; }
  .logo { font-size: 2em; }
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
        <span class="emoji">🛠️</span> Dev Digest — ${d.date}
      </a>
      <div class="date">${d.date}</div>
    </li>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Raz's Dev Digest</title>
  <style>${styles}</style>
</head>
<body>
  <div class="header">
    <span class="logo">🦞</span>
    <h1>Raz's Dev Digest</h1>
  </div>
  <p>Daily software development news, curated by 99 Cooking.</p>
  <ul class="post-list">${list || '<li>No digests yet</li>'}</ul>
</body>
</html>`;
}

function renderPost(digest) {
  const content = fs.readFileSync(digest.path, 'utf-8');
  const html = marked(content);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dev Digest — ${digest.date}</title>
  <style>${styles}</style>
</head>
<body>
  <a href="/" class="back">← Back to all digests</a>
  <article>${html}</article>
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
  console.log(\`🦞 Dev Digest Blog running on port \${PORT}\`);
});
