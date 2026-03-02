#!/usr/bin/env node
/**
 * Script de prueba para verificar que la carga masiva envia notificaciones
 * Verifica que el endpoint POST /api/upload retorna notificaciones
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

const API_URL = 'http://localhost:3000';
const EXCEL_FILE = 'doc/sitra2026.xlsx';

// Función helper para enviar multipart/form-data
function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const fileContent = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      
      const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`),
        fileContent,
        Buffer.from(`\r\n--${boundary}--\r\n`)
      ]);

      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function testUpload() {
  try {
    console.log('📝 Test de carga masiva con notificaciones\n');
    
    // Verificar que el archivo existe
    if (!fs.existsSync(EXCEL_FILE)) {
      console.error(`❌ Archivo no encontrado: ${EXCEL_FILE}`);
      process.exit(1);
    }

    console.log(`📂 Archivo encontrado: ${EXCEL_FILE}`);
    console.log(`📏 Tamaño: ${fs.statSync(EXCEL_FILE).size} bytes\n`);

    // Hacer request
    console.log(`🚀 Enviando POST a ${API_URL}/api/upload...\n`);
    
    const result = await uploadFile(EXCEL_FILE);

    // Mostrar resumen
    console.log('✅ Respuesta del servidor:\n');
    console.log('📊 CARGA DE DATOS:');
    console.log(`  • Reasignados: ${result.results.reasignados.insertados} insertados, ${result.results.reasignados.omitidos} omitidos`);
    console.log(`  • Tareas: ${result.results.tareas.insertados} insertadas, ${result.results.tareas.omitidos} omitidas`);
    console.log(`  • Enviados: ${result.results.enviados.insertados} insertados, ${result.results.enviados.omitidos} omitidos`);

    if (result.notificaciones) {
      console.log('\n📧 NOTIFICACIONES:');
      console.log(`  • Enviadas: ${result.notificaciones.enviadas}`);
      console.log(`  • Fallidas: ${result.notificaciones.fallidas}`);
      
      if (result.notificaciones.detalles && result.notificaciones.detalles.length > 0) {
        console.log('\n  Detalles:');
        result.notificaciones.detalles.forEach((det, i) => {
          console.log(`    ${i + 1}. ${det.usuario} (${det.correo})`);
          console.log(`       • ${det.documentos} documento(s) - ${det.estado}`);
          if (det.error) {
            console.log(`       • Error: ${det.error}`);
          }
        });
      }
    } else {
      console.log('\n⚠️  No hay información de notificaciones en la respuesta');
    }

    if (result.usuariosNoEncontrados && result.usuariosNoEncontrados.length > 0) {
      console.log('\n⚠️  Usuarios no encontrados:');
      result.usuariosNoEncontrados.forEach(u => console.log(`  • ${u}`));
    }

    console.log('\n✅ Test completado exitosamente');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

testUpload();
