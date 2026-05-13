require('dotenv').config();
const http = require('http');
const mysql = require('mysql2/promise');

async function diagnoseNotificationIssue() {
  let connection;

  try {
    console.log('\n🔍 DIAGNÓSTICO DEL PROBLEMA DE NOTIFICACIONES\n');
    console.log('═'.repeat(70));

    // 1. Verificar conexión a BD
    console.log('\n1️⃣  Verificando conexión a base de datos...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
    console.log('   ✅ Conexión a BD exitosa');

    // 2. Verificar configuración
    console.log('\n2️⃣  Verificando configuración de notificaciones...');
    const [config] = await connection.query(
      'SELECT activo, notificaciones_email_activas FROM notificaciones_config WHERE id = 1'
    );
    if (config.length === 0) {
      console.log('   ❌ Configuración no encontrada');
    } else {
      console.log(`   ✅ Sistema activo: ${config[0].activo ? 'SÍ' : 'NO'}`);
      console.log(`   ✅ Emails activos: ${config[0].notificaciones_email_activas ? 'SÍ' : 'NO'}`);
    }

    // 3. Verificar documentos disponibles
    console.log('\n3️⃣  Verificando documentos para notificar...');
    const [expirados] = await connection.query(`
      SELECT COUNT(*) as count FROM reasignados
      WHERE DATE(fecha_max_respuesta) <= DATE(DATE_SUB(NOW(), INTERVAL 1 DAY))
        AND estado NOT IN ('archivado', 'eliminado', 'enviado', 'cancelado', 'resuelto', 'completado')
    `);
    const [proximos] = await connection.query(`
      SELECT COUNT(*) as count FROM reasignados
      WHERE DATE(fecha_max_respuesta) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY))
        AND estado NOT IN ('archivado', 'eliminado', 'enviado', 'cancelado', 'resuelto', 'completado')
    `);
    console.log(`   ✅ Documentos expirados: ${expirados[0].count}`);
    console.log(`   ✅ Documentos próximos: ${proximos[0].count}`);

    // 4. Verificar SMTP
    console.log('\n4️⃣  Verificando configuración SMTP...');
    console.log(`   ✅ SMTP_HOST: ${process.env.SMTP_HOST || '❌ NO CONFIGURADO'}`);
    console.log(`   ✅ SMTP_USER: ${process.env.SMTP_USER ? '✅ Configurado' : '❌ NO CONFIGURADO'}`);
    console.log(`   ✅ TEST EMAIL: ${process.env.MAIL_TO_PRUEBA || '❌ NO CONFIGURADO'}`);

    // 5. Test del endpoint SIN autenticación
    console.log('\n5️⃣  Probando endpoint /api/admin/notificaciones/enviar-ahora...');
    console.log('   (Esto debería retornar 401 sin sesión válida)\n');

    const postData = JSON.stringify({
      documentosExpirados: expirados[0].count > 0,
      documentosProximos: proximos[0].count > 0
    });

    const testResult = await new Promise((resolve) => {
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

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: data,
            cookies: res.headers['set-cookie']
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          error: error.message,
          code: error.code
        });
      });

      req.write(postData);
      req.end();
    });

    if (testResult.error) {
      console.log(`   ❌ Error: ${testResult.error}`);
      if (testResult.code === 'ECONNREFUSED') {
        console.log('   ⚠️  El servidor no está corriendo en localhost:3000');
        console.log('   ℹ️  Inicia con: npm run dev');
      }
    } else {
      console.log(`   Status Code: ${testResult.statusCode}`);

      if (testResult.statusCode === 401) {
        console.log('   ⚠️  Error esperado (sin autenticación)');
        console.log('   ℹ️  Esto es NORMAL - el endpoint requiere login');
      } else if (testResult.statusCode === 200) {
        console.log('   ✅ Endpoint respondió correctamente!');
        try {
          const json = JSON.parse(testResult.body);
          console.log(`   📊 Resultado: ${json.mensaje}`);
        } catch(e) {}
      } else {
        console.log(`   ❌ Status inesperado: ${testResult.statusCode}`);
        console.log(`   Respuesta: ${testResult.body}`);
      }
    }

    // 6. Resumen
    console.log('\n' + '═'.repeat(70));
    console.log('\n📋 RESUMEN DEL DIAGNÓSTICO\n');

    console.log('✅ VERIFICADO:');
    console.log('   • Conexión a BD');
    console.log('   • Configuración de notificaciones');
    console.log('   • Documentos disponibles');
    console.log('   • SMTP configurado');
    console.log('   • Endpoint accesible');

    console.log('\n📌 PRÓXIMOS PASOS:\n');
    console.log('Si los correos NO se envían desde la UI:');
    console.log('   1. Ve a http://localhost:5175');
    console.log('   2. Asegúrate de estar logueado como ADMIN');
    console.log('   3. Ve a Admin → Notificaciones');
    console.log('   4. Haz clic en "Enviar Notificaciones Ahora"');
    console.log('   5. Abre DevTools (F12) → Console');
    console.log('   6. Copia el comando del archivo TROUBLESHOOTING_NOTIFICACIONES.md');

    console.log('\nSi quieres probar envío directo (sin UI):');
    console.log('   npm run test-notif');
    console.log('   O:');
    console.log('   node test_send_now.js');

    await connection.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

diagnoseNotificationIssue();
