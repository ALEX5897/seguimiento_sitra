const http = require('http');

function testAPI(path, name) {
  return new Promise((resolve) => {
    http.get('http://localhost:3000' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const count = Array.isArray(json) ? json.length : Object.keys(json).length;
          console.log(`✅ ${name}: ${count} registros`);
        } catch {
          console.log(`❌ ${name}: Error parsing`);
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`❌ ${name}: ${err.message}`);
      resolve();
    });
  });
}

(async () => {
  console.log('🔍 TEST DE APIs:\n');
  await testAPI('/api/usuarios/activos/lista', 'GET /usuarios/activos/lista');
  await testAPI('/api/reasignados', 'GET /reasignados');
  await testAPI('/api/tareas', 'GET /tareas');
  await testAPI('/api/enviados', 'GET /enviados');
  console.log('\n✅ Test completado');
  process.exit(0);
})();
