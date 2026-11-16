// 시안 미리보기용 작은 서버 (영상 탐색을 위해 Range 요청 지원)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mp4": "video/mp4", ".jpg": "image/jpeg", ".woff2": "font/woff2" };
http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split("?")[0]).replace(/^\/$/, "/index.html"));
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end("not found"); }
  const size = fs.statSync(f).size, type = types[path.extname(f)] || "application/octet-stream", r = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
  if (r) { const s = +r[1] || 0, e = r[2] ? +r[2] : size - 1;
    res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${s}-${e}/${size}`, "Accept-Ranges": "bytes", "Content-Length": e - s + 1 });
    return fs.createReadStream(f, { start: s, end: e }).pipe(res); }
  res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes" }); fs.createReadStream(f).pipe(res);
}).listen(4173, () => console.log("http://localhost:4173"));
