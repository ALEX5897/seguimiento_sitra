const db = require('./src/db');

async function verificarFechasReasignacion() {
  console.log('🔍 VERIFICAR FECHAS DE REASIGNACIÓN EN BASE DE DATOS\n');
  
  try {
    // Traer informacion del Excel para comparar
    const xlsx = require('xlsx');
    const path = require('path');
    
    const file = path.resolve(__dirname, '..', 'doc', 'sitra2026.xlsx');
    const wb = xlsx.readFile(file);
    const sheet = wb.Sheets['Reasignados'];
    const dataExcel = xlsx.utils.sheet_to_json(sheet, { defval: null });
    
    console.log('='.repeat(80));
    console.log('COMPARACIÓN: Excel vs Base de Datos');
    console.log('='.repeat(80));
    
    // Obtener los últimos registros de la BD
    const [reasignados] = await db.query(`
      SELECT 
        numero_documento,
        reasignado_a,
        fecha_documento,
        fecha_reasignacion,
        fecha_max_respuesta,
        DATE_FORMAT(fecha_documento, '%Y-%m-%d') as fecha_doc_formateada,
        DATE_FORMAT(fecha_reasignacion, '%Y-%m-%d') as fecha_reasign_formateada,
        DATE_FORMAT(fecha_max_respuesta, '%Y-%m-%d') as fecha_max_formateada
      FROM reasignados 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    console.log('\n📊 REGISTROS EN LA BASE DE DATOS:\n');
    
    reasignados.forEach((r, i) => {
      console.log(`Registro ${i + 1}: ${r.numero_documento}`);
      console.log(`  Documento:      ${r.fecha_doc_formateada}`);
      console.log(`  Reasignación:   ${r.fecha_reasign_formateada}`);
      console.log(`  Máx. Respuesta: ${r.fecha_max_formateada}`);
      console.log();
    });
    
    console.log('='.repeat(80));
    console.log('DATOS EN EXCEL:\n');
    
    dataExcel.forEach((row, i) => {
      if (i < 5) {
        console.log(`Fila ${i + 2}: ${row['Número Documento'] || row['Numero Documento']}`);
        
        // Convertir fechas de Excel
        const fechaDoc = row['Fecha Documento'] || row['? Fecha Documento'];
        const fechaReasign = row['? Fecha Reasignación'] || row['Fecha Reasignación'];
        const fechaMaxResp = row['Fecha Max. de Respuesta'];
        
        const convertFecha = (serial) => {
          if (!serial || typeof serial !== 'number') return 'N/A';
          const dias = Math.floor(serial);
          const fecha = new Date(Date.UTC(1899, 11, 30));
          fecha.setUTCDate(fecha.getUTCDate() + dias);
          return fecha.toISOString().split('T')[0];
        };
        
        console.log(`  Documento:      ${convertFecha(fechaDoc)}`);
        console.log(`  Reasignación:   ${convertFecha(fechaReasign)}`);
        console.log(`  Máx. Respuesta: ${convertFecha(fechaMaxResp)}`);
        console.log();
      }
    });
    
    console.log('='.repeat(80));
    console.log('ANÁLISIS');
    console.log('='.repeat(80));
    console.log(`
Si ves diferencias de exactamente 1 día entre Excel y BD en:
- fecha_reasignacion: Hay un bug en el código que suma un día extra
- fecha_documento: Hay un bug en el código que suma un día extra
- fecha_max_respuesta: Hay un bug en el código que suma un día extra

Verifica que la función convertirFechaExcel() esté siendo aplicada
correctamente a TODAS las fechas, no solo a fecha_max_respuesta.
    `);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

verificarFechasReasignacion();
