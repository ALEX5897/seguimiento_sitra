const http = require('http');

const tests = [
  {
    name: 'GET /api/reasignados',
    method: 'GET',
    path: '/api/reasignados',
    expected: [200, 401, 404]
  },
  {
    name: 'GET /api/reasignados/1/comentarios',
    method: 'GET',
    path: '/api/reasignados/1/comentarios',
    expected: [200, 401, 404]
  },
  {
    name: 'GET /api/notificaciones',
    method: 'GET',
    path: '/api/notificaciones',
    expected: [200, 401, 404]
  },
  {
    name: 'GET /api/notificaciones/sin-leer/contador',
    method: 'GET',
    path: '/api/notificaciones/sin-leer/contador',
    expected: [200, 401, 404]
  }
];

async function runTests() {
  console.log('🧪 PRUEBAS DE ENDPOINTS API\n');
  console.log('════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: 3000,
          path: test.path,
          method: test.method,
          headers: {
            'User-Agent': 'Test Script'
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
        });

        req.on('error', reject);
        req.end();
      });

      const isExpected = test.expected.includes(response.status);
      const icon = isExpected ? '✅' : '❌';
      
      console.log(`${icon} ${test.name}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Route: ${test.path}\n`);

      if (isExpected) {
        passed++;
      } else {
        failed++;
      }
    } catch (err) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${err.message}\n`);
      failed++;
    }
  }

  console.log('════════════════════════════════════════════════\n');
  console.log(`📊 RESULTADOS:`);
  console.log(`   ✅ Pasaron: ${passed}`);
  console.log(`   ❌ Fallaron: ${failed}`);
  console.log(`   📈 Total: ${tests.length}\n`);

  if (failed === 0) {
    console.log('🎉 ¡TODOS LOS TESTS PASARON!');
  } else {
    console.log('⚠️  Algunos tests fallaron. Revisar logs.');
  }
}

runTests();
