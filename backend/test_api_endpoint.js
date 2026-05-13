require('dotenv').config();
const http = require('http');
const mysql = require('mysql2/promise');

async function testAPIEndpoint() {
  let connection;
  try {
    console.log('🔄 Conectando a base de datos para verificar datos...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('✓ Conectado\n');

    // Reset notification flags for clean test
    await connection.query("UPDATE reasignados SET correo_enviado_expiracion = NULL, correo_enviado_un_dia_antes = NULL WHERE usuario_id IN (17, 53, 80, 69, 39)");
    console.log('🔄 Notification flags reseteados\n');

    // Make API call
    console.log('📡 Calling API: POST /api/admin/notificaciones/enviar-ahora');
    console.log('═'.repeat(60));

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
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': 'session=test' // Mock session for testing
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', async () => {
        console.log(`\n📊 API Response Status: ${res.statusCode}`);
        console.log('═'.repeat(60));

        if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 403) {
          try {
            const result = JSON.parse(data);
            console.log('\n📋 Response Body:');
            console.log(JSON.stringify(result, null, 2));
          } catch (e) {
            console.log('Response:', data);
          }
        } else {
          console.log('Response:', data);
        }

        // Check notification log
        console.log('\n\n📊 Verificando notificaciones_log...');
        console.log('═'.repeat(60));
        const [log] = await connection.query('SELECT * FROM notificaciones_log ORDER BY fecha_envio DESC LIMIT 3');

        if (log.length === 0) {
          console.log('ℹ️  No hay entradas en el log (esto puede ser normal si el endpoint requiere autenticación)');
        } else {
          log.forEach((entry, idx) => {
            const fecha = new Date(entry.fecha_envio).toLocaleString('es-ES');
            console.log(`${idx + 1}. [${entry.estado}] ${entry.tipo} - ${entry.cantidad_correos || 0} correos - ${fecha}`);
          });
        }

        console.log('\n✅ Test completado');
        console.log('═'.repeat(60));
        console.log('Nota: Si recibiste error 401/403, es porque se requiere autenticación admin.');
        console.log('Para probar manualmente, visita: http://localhost:5175/admin/notificaciones');

        await connection.end();
        process.exit(0);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error en la solicitud:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error('\n⚠️  Error: No se pudo conectar a localhost:3000');
        console.error('Asegúrate que el servidor backend está corriendo:');
        console.error('  npm run dev (o similar)');
      }
      connection.end();
      process.exit(1);
    });

    req.write(postData);
    req.end();

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

testAPIEndpoint();
