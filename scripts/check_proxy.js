const http = require('http');
const endpoints = ['/api/reasignados', '/api/tareas', '/api/enviados'];
const port = 5173;

function fetch(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port, path, agent: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', (err) => reject(err));
  });
}

(async () => {
  for (const p of endpoints) {
    try {
      const r = await fetch(p);
      console.log('-----', `http://localhost:${port}${p}`, 'status=', r.status);
      try { console.log(JSON.stringify(JSON.parse(r.body), null, 2)); } catch (e) { console.log(r.body); }
    } catch (err) {
      console.error('Error fetching', p, err.message);
    }
  }
})();
