const xlsx = require('xlsx');
const path = require('path');

console.log('🔍 DIAGNÓSTICO DE FECHAS - Problema de disminución de 1 día\n');

const file = path.resolve(__dirname, '..', 'doc', 'sitra2026.xlsx');
const wb = xlsx.readFile(file);
const sheet = wb.Sheets['Reasignados'];
const data = xlsx.utils.sheet_to_json(sheet);

console.log('='.repeat(70));
console.log('ANÁLISIS DETALLADO DE FECHAS');
console.log('='.repeat(70));

data.forEach((row, i) => {
  if (i < 5) {
    const fechaMaxRespuesta = row['Fecha Max. de Respuesta'];
    
    console.log(`\n📄 Fila ${i + 2}:`);
    console.log(`   Valor crudo en Excel: ${fechaMaxRespuesta}`);
    console.log(`   Tipo de dato: ${typeof fechaMaxRespuesta}`);
    
    if (typeof fechaMaxRespuesta === 'number') {
      // Método 1: parse_date_code (lo que usamos actualmente)
      const fecha1 = xlsx.SSF.parse_date_code(fechaMaxRespuesta);
      const fechaStr1 = `${fecha1.y}-${String(fecha1.m).padStart(2, '0')}-${String(fecha1.d).padStart(2, '0')}`;
      console.log(`   ❌ Método actual (parse_date_code): ${fechaStr1}`);
      
      // Método 2: Conversión manual correcta
      // Excel fecha base: 1900-01-01 (pero Excel tiene un bug del año 1900)
      const excelEpoch = new Date(1899, 11, 30); // 30 de diciembre de 1899
      const dias = Math.floor(fechaMaxRespuesta);
      const fecha2 = new Date(excelEpoch.getTime() + dias * 86400000);
      const fechaStr2 = fecha2.toISOString().split('T')[0];
      console.log(`   ⚠️  Conversión Date simple: ${fechaStr2}`);
      
      // Método 3: Sin zona horaria (UTC)
      const fecha3 = new Date(Date.UTC(1899, 11, 30));
      fecha3.setUTCDate(fecha3.getUTCDate() + dias);
      const fechaStr3 = fecha3.toISOString().split('T')[0];
      console.log(`   ✅ Conversión UTC correcta: ${fechaStr3}`);
      
      // Mostrar diferencia
      const diff = new Date(fechaStr3).getTime() - new Date(fechaStr1).getTime();
      const diffDias = diff / (1000 * 60 * 60 * 24);
      console.log(`   📊 Diferencia: ${diffDias} día(s)`);
    }
  }
});

console.log('\n' + '='.repeat(70));
console.log('EXPLICACIÓN DEL PROBLEMA');
console.log('='.repeat(70));
console.log(`
El problema ocurre por la zona horaria local vs UTC:

1. ❌ parse_date_code usa zona horaria local (Ecuador: UTC-5)
   - Al convertir 46069 → 2026-02-16 00:00:00 (local)
   - Al guardar en MySQL, se convierte a UTC
   - MySQL guarda: 2026-02-16 05:00:00 (UTC)
   - Al leer, vuelve a local: 2026-02-15 (¡pierde 1 día!)

2. ✅ Conversión UTC directa
   - Convierte 46069 → 2026-02-16 00:00:00 (UTC)
   - MySQL guarda: 2026-02-16 00:00:00 (UTC)
   - Al leer: 2026-02-16 (correcto)

SOLUCIÓN: Usar Date.UTC para mantener la fecha exacta sin zona horaria.
`);

console.log('='.repeat(70));
console.log('CÓDIGO CORRECTO A IMPLEMENTAR');
console.log('='.repeat(70));

console.log(`
// En lugar de esto (incorrecto):
const fecha = xlsx.SSF.parse_date_code(fechaExcel);
const fechaString = \`\${fecha.y}-\${fecha.m}-\${fecha.d}\`;

// Usar esto (correcto):
function convertirFechaExcel(serialDate) {
  if (!serialDate || typeof serialDate !== 'number') return null;
  
  const dias = Math.floor(serialDate);
  const fecha = new Date(Date.UTC(1899, 11, 30));
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  
  return fecha.toISOString().split('T')[0]; // YYYY-MM-DD
}

const fechaCorrecta = convertirFechaExcel(fechaExcel);
`);

console.log('\n✅ Análisis completado\n');
