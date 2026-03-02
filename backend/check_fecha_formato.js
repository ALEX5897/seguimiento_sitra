const xlsx = require('xlsx');
const path = require('path');

console.log('📅 FORMATOS DE FECHA SOPORTADOS\n');

console.log('='.repeat(60));
console.log('TIPO DE DATO EN BASE DE DATOS');
console.log('='.repeat(60));
console.log('Campo: fecha_max_respuesta');
console.log('Tipo: DATETIME');
console.log('Formato MySQL: YYYY-MM-DD HH:MM:SS');
console.log('Ejemplo: 2026-12-31 23:59:59\n');

console.log('='.repeat(60));
console.log('FORMATOS ACEPTADOS EN EXCEL');
console.log('='.repeat(60));

const formatosAceptados = [
  { formato: 'Fecha de Excel (numérico)', ejemplo: '45678', descripcion: 'Excel almacena fechas como números seriales' },
  { formato: 'DD/MM/YYYY', ejemplo: '31/12/2026', descripcion: 'Formato común en Latinoamérica' },
  { formato: 'MM/DD/YYYY', ejemplo: '12/31/2026', descripcion: 'Formato común en USA' },
  { formato: 'YYYY-MM-DD', ejemplo: '2026-12-31', descripcion: 'Formato ISO 8601 (recomendado)' },
  { formato: 'DD-MM-YYYY', ejemplo: '31-12-2026', descripcion: 'Con guiones' },
  { formato: 'DD/MM/YYYY HH:MM', ejemplo: '31/12/2026 15:30', descripcion: 'Con hora' },
  { formato: 'YYYY-MM-DD HH:MM:SS', ejemplo: '2026-12-31 15:30:00', descripcion: 'Formato completo ISO' }
];

formatosAceptados.forEach((f, i) => {
  console.log(`${i + 1}. ${f.formato}`);
  console.log(`   Ejemplo: ${f.ejemplo}`);
  console.log(`   ${f.descripcion}\n`);
});

console.log('='.repeat(60));
console.log('RECOMENDACIONES');
console.log('='.repeat(60));
console.log('✅ RECOMENDADO: Usar formato de celda DATE en Excel');
console.log('✅ Columna formateada como "Fecha" en Excel');
console.log('✅ Formato visual: DD/MM/YYYY (ejemplo: 31/12/2026)');
console.log('✅ Excel lo convertirá automáticamente al importar\n');

console.log('⚠️  IMPORTANTE:');
console.log('   - NO usar formato TEXTO en Excel');
console.log('   - Asegurarse que la columna esté formateada como FECHA');
console.log('   - Si aparece como texto, Excel no lo reconocerá correctamente\n');

// Probar el archivo actual si existe
const file = path.resolve(__dirname, '..', 'doc', 'sitra2026.xlsx');
const fs = require('fs');

if (fs.existsSync(file)) {
  console.log('='.repeat(60));
  console.log('ANÁLISIS DEL ARCHIVO ACTUAL: sitra2026.xlsx');
  console.log('='.repeat(60));
  
  const wb = xlsx.readFile(file);
  const sheet = wb.Sheets['Reasignados'];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  console.log('\nMuestra de fechas en el archivo:\n');
  
  data.forEach((row, i) => {
    if (i < 3) {
      const fechaMaxRespuesta = row['Fecha Max. de Respuesta'];
      const tipoFecha = typeof fechaMaxRespuesta;
      
      console.log(`Fila ${i + 2}:`);
      console.log(`  Valor original: ${fechaMaxRespuesta}`);
      console.log(`  Tipo de dato: ${tipoFecha}`);
      
      if (fechaMaxRespuesta) {
        // Si es un número serial de Excel, convertirlo
        if (typeof fechaMaxRespuesta === 'number') {
          const fecha = xlsx.SSF.parse_date_code(fechaMaxRespuesta);
          const fechaFormateada = `${fecha.y}-${String(fecha.m).padStart(2, '0')}-${String(fecha.d).padStart(2, '0')}`;
          console.log(`  Fecha convertida: ${fechaFormateada}`);
          console.log(`  ✅ Formato correcto (número serial de Excel)`);
        } else if (typeof fechaMaxRespuesta === 'string') {
          console.log(`  ⚠️  Es texto - puede causar problemas`);
          console.log(`  📝 Sugerencia: Formatear columna como FECHA en Excel`);
        } else if (fechaMaxRespuesta instanceof Date) {
          console.log(`  Fecha JS: ${fechaMaxRespuesta.toISOString()}`);
          console.log(`  ✅ Formato correcto (objeto Date)`);
        }
      } else {
        console.log(`  ⚠️  Fecha vacía o NULL`);
      }
      console.log('');
    }
  });
  
  console.log('='.repeat(60));
  console.log('RESUMEN');
  console.log('='.repeat(60));
  console.log('Total de reasignados en el archivo:', data.length);
  
  const fechasValidas = data.filter(r => r['Fecha Max. de Respuesta']);
  console.log('Registros con fecha máxima:', fechasValidas.length);
  console.log('Registros sin fecha máxima:', data.length - fechasValidas.length);
}

console.log('\n✅ Análisis completado\n');
console.log('💡 TIP: Para asegurar compatibilidad:');
console.log('   1. Abrir Excel');
console.log('   2. Seleccionar columna "Fecha Max. de Respuesta"');
console.log('   3. Click derecho → Formato de celdas');
console.log('   4. Seleccionar "Fecha" en categoría');
console.log('   5. Elegir formato: DD/MM/YYYY o similar');
console.log('   6. Guardar el archivo\n');
