import { createReadStream, promises as fs } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';

const root = path.join(process.cwd(), 'public');
const port = Number(process.env.PREVIEW_PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf', '.mp4': 'video/mp4' };

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname === '/updates' || url.pathname === '/updates/') {
    response.writeHead(301, { Location: '/en/updates/' }); response.end(); return;
  }
  const slugMatch = url.pathname.match(/^\/updates\/([^/]+)\/?$/);
  if (slugMatch) { response.writeHead(301, { Location: `/en/updates/${slugMatch[1]}/` }); response.end(); return; }
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') { response.writeHead(301, { Location: '/en' }); response.end(); return; }
  if (/^\/(?:en|vi|de|es|fr|ja|ko|ru|th|zh)\/?$/.test(pathname)) pathname = '/index.html';
  else if (pathname.endsWith('/')) pathname += 'index.html';
  const full = path.resolve(root, `.${pathname}`);
  if (!full.startsWith(path.resolve(root))) { response.writeHead(403); response.end('Forbidden'); return; }
  try {
    const stat = await fs.stat(full);
    if (!stat.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': types[path.extname(full).toLowerCase()] || 'application/octet-stream', 'Cache-Control': pathname.endsWith('.html') ? 'no-cache' : 'public, max-age=60' });
    createReadStream(full).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    createReadStream(path.join(root, '404.html')).pipe(response);
  }
});

server.listen(port, '127.0.0.1', () => console.log(`Local preview: http://127.0.0.1:${port}`));
