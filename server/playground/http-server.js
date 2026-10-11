// Learning only: a web server using nothing but Node's built-in `http` module.
// Not imported by the app. Run with: node playground/http-server.js
import http from 'node:http';

const server = http.createServer((req, res) => {
  // No router: we inspect the method and URL ourselves.
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello from a raw Node server');
    return;
  }

  if (req.method === 'GET' && req.url === '/time') {
    // No res.json() either: we set the header and stringify by hand.
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ now: new Date().toISOString() }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(4000, () => {
  console.log('Raw server on http://localhost:4000  (try / and /time)');
});
