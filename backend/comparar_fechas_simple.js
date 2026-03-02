const db = require('./src/db');
const xlsx = require('xlsx');
const path = require('path');

async function compararFechas() {
  console.log('🔍 COMPARACIÓN DETALLADA: EXCEL vs BASE DE DATOS\n');
  
  try {
    // Leer Excel
    const file = path.resolve(__dirname, '..', 'doc', 'sitra2026.xlsx');
    const wb = xlsx.readFile(file);
    const sheet = wb.Sheets['Reasignados'];
    const dataExcel = xlsx.utils.sheet_to_json(sheet, { defval: null });
    
    console.log('='.repeat(90));
    console.log('DATOS CRUDOS DEL EXCEL');
    console.log('='.repeat(90));
    
    dataExcel.forEach((row, i) => {
      if (i < 3) {
        console.log(`\n📄 Fila ${i + 2}:`);
        console.log(`  Documento: ${row['Número Documento']}`);
        console.log(`  Fecha Doc (crudo): "${row['Fecha Documento']}"`);
        console.log(`  Fecha Reasign (crudo): "${row['? Fecha Reasignación']}"`);
        console.log(`  Fecha Max Resp (crudo): ${row['Fecha Max. de Respuesta']}`);
        
        // Procesar como lo hace el código
        const fechaDoc = row['Fecha Documento'] || null;
        const fechaReasign = row['? Fecha Reasignación'] || null;
        const fechaMaxResp = row['Fecha Max. de Respuesta'] || null;
        
        // Aplicar conversión
        const convertFecha = (f) => {
          if (!f) return null;
          
          if (typeof f === 'number') {
            const dias = Math.floor(f);
            const fecha = new Date(Date.UTC(1899, 11, 30));
            fecha.setUTCDate(fecha.getUTCDate() + dias);
            return fecha.toISOString().split('T')[0];
          }
          
          if (typeof f === 'string') {
            let fechaLimpia = f.trim();
            fechaLimpia = fechaLimpia.replace(/\s*\(GMT[^)]*\)\s*$/i, '').trim();
            const fecha = new Date(fechaLimpia);
            if (!isNaN(fecha.getTime())) {
              return fecha.toISOString().split('T')[0];
            }
          }
          
          return null;
        };
        
        console.log(`  ✅ Fecha Doc convertida: ${convertFecha(fechaDoc)}`);
        console.log(`  ✅ Fecha Reasign convertida: ${convertFecha(fechaReasign)}`);
        console.log(`  ✅ Fecha Max Resp convertida: ${convertFecha(fechaMaxResp)}`);
      }
    });
    
    console.log('\n' + '='.repeat(90));
    console.log('DATOS EN BASE DE DATOS');
    console.log('='.repeat(90));
    
    const [reasignados] = await db.query(`
      SELECT 
        numero_documento,
        DATE_FORMAT(fecha_documento, '%Y-%m-%d') as fecha_doc,
        DATE_FORMAT(fecha_reasignacion, '%Y-%m-%d') as fecha_reasign,
        DATE_FORMAT(fecha_max_respuesta, '%Y-%m-%d') as fecha_max
      FROM reasignados 
      ORDER BY id DESC 
      LIMIT 3
    `);
    
    reasignados.forEach((r, i) => {
      console.log(`\n📄 Documento: ${r.numero_documento}`);
      console.log(`  Fecha Documento: ${r.fecha_doc}`);
      console.log(`  Fecha Reasignación: ${r.fecha_reasign}`);
      console.log(`  Fecha Máx. Respuesta: ${r.fecha_max}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

compararFechas();
