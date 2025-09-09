const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3001;
const hostname = '0.0.0.0';

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/simple-pwa.html' : req.url;
  filePath = path.join(__dirname, filePath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      let contentType = 'text/html';
      if (filePath.endsWith('.css')) contentType = 'text/css';
      if (filePath.endsWith('.js')) contentType = 'text/javascript';
      if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';
      if (filePath.endsWith('.json')) contentType = 'application/json';

      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(content);
    }
  });
});

server.listen(port, hostname, () => {
  console.log(`PWA server running at http://${hostname}:${port}/`);
  console.log(`Access from iPhone: http://172.31.90.226:${port}/simple-pwa.html`);
});