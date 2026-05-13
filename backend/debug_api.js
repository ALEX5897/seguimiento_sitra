require('dotenv').config();
const http = require('http');

async function testEndpoint() {
  console.log('🔍 Probando endpoint: POST /api/admin/notificaciones/enviar-ahora\n');

  const postData = JSON.stringify({
    documentosExpirados: true,
    documentosProximos: true
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/notificaciones/enviar-ahora',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      console.log(`📊 Status Code: ${res.statusCode}`);
      console.log(`📋 Headers: ${JSON.stringify(res.headers, null, 2)}\n`);

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📝 Response Body:');
        console.log(data);
        console.log('\n');

        if (res.statusCode === 401 || res.statusCode === 403) {
          console.log('⚠️  PROBLEMA: Acceso no autorizado');
          console.log('   El endpoint requiere autenticación de admin');
          console.log('\n🔧 SOLUCIONES:');
          console.log('   1. Asegurate que estés logueado como admin en http://localhost:5175');
          console.log('   2. Abre DevTools (F12) → Network tab');
          console.log('   3. Haz clic en "Enviar Notificaciones Ahora"');
          console.log('   4. Revisa la solicitud POST a /api/admin/notificaciones/enviar-ahora');
          console.log('   5. Mira la respuesta en la pestaña Response\n');
        } else if (res.statusCode === 200) {
          console.log('✅ Éxito: El endpoint respondió correctamente');
          try {
            const json = JSON.parse(data);
            if (json.success) {
              console.log('✅ Notificaciones enviadas exitosamente');
            }
          } catch(e) {
            // parse error
          }
        } else {
          console.log('⚠️  Error: Status code no esperado');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error en la solicitud:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error('\n⚠️  El servidor backend no está corriendo');
        console.error('   Inicia el servidor con: npm run dev');
      }
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

testEndpoint().catch(console.error);
