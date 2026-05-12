const http = require('http');

function hacerPeticion(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const opciones = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': ''
      }
    };

    const req = http.request(opciones, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n${method} ${path}`);
        console.log(`Status: ${res.statusCode}`);
        try {
          console.log(`Response:`, JSON.parse(data));
        } catch (e) {
          console.log(`Response:`, data);
        }
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function pruebas() {
  console.log('🧪 Probando guardado de configuración...');

  console.log('\n1️⃣ GET /api/admin/notificaciones (sin autenticación)');
  await hacerPeticion('GET', '/api/admin/notificaciones');

  console.log('\n2️⃣ PUT /api/admin/notificaciones (sin autenticación)');
  await hacerPeticion('PUT', '/api/admin/notificaciones', {
    notificaciones_email_activas: false,
    notificaciones_app_activas: false
  });

  console.log('\n\n✅ Test completado');
}

pruebas();
