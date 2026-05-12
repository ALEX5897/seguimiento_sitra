// Script para probar el endpoint de notificaciones
const http = require('http');

// Función para hacer una petición HTTP
function hacerPeticion(method, path) {
  return new Promise((resolve, reject) => {
    const opciones = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': ''  // Esto se actualizaría con la sesión real
      }
    };

    const req = http.request(opciones, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        console.log(`Body:`, data);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error);
      reject(error);
    });

    req.end();
  });
}

async function pruebas() {
  console.log('🧪 Probando endpoints de notificaciones...\n');

  console.log('1️⃣  GET /api/admin/notificaciones (sin sesión)');
  await hacerPeticion('GET', '/api/admin/notificaciones');

  console.log('\n2️⃣  GET /api/auth/usuario');
  await hacerPeticion('GET', '/api/auth/usuario');
}

pruebas();
