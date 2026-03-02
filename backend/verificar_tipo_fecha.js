const xlsx = require('xlsx');
const path = require('path');

console.log('🔍 VERIFICAR QUÉ DATOS RECIBIMOS DE EXCEL\n');

const file = path.resolve(__dirname, '..', 'doc', 'sitra2026.xlsx');
const wb = xlsx.readFile(file);
const sheet = wb.Sheets['Reasignados'];

// Sin conversión automática
const dataRaw = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: true });

// Con conversión automática (como está actualmente)
const dataAuto = xlsx.utils.sheet_to_json(sheet, { defval: null });

console.log('='.repeat(70));
console.log('COMPARACIÓN: raw: true vs raw: false (defecto)');
console.log('='.repeat(70));

dataRaw.forEach((rowRaw, i) => {
  if (i < 3) {
    const rowAuto = dataAuto[i];
    const fechaRaw = rowRaw['Fecha Max. de Respuesta'];
    const fechaAuto = rowAuto['Fecha Max. de Respuesta'];
    
    console.log(`\n📄 Fila ${i + 2}:`);
    console.log(`   Con raw:true  → ${typeof fechaRaw === 'number' ? `${fechaRaw} (número serial)` : fechaRaw}`);
    console.log(`   Con raw:false → ${fechaAuto instanceof Date ? `${fechaAuto.toISOString()} (Date)` : fechaAuto}`);
    
    if (fechaAuto instanceof Date) {
      console.log(`   📆 Fecha local: ${fechaAuto.toLocaleDateString()}`);
      console.log(`   📆 Fecha ISO: ${fechaAuto.toISOString().split('T')[0]}`);
      console.log(`   ⚠️  PROBLEMA: Date tiene zona horaria incluida`);
    }
  }
});

console.log('\n' + '='.repeat(70));
console.log('DIAGNÓSTICO DEL PROBLEMA');
console.log('='.repeat(70));
console.log(`
Cuando usamos sheet_to_json() SIN especificar raw:true:
- Excel convierte automáticamente números seriales a Date de JavaScript
- Estos Date tienen zona horaria local (Ecuador: UTC-5)
- Al insertar en MySQL, la fecha se desplaza según la zona horaria

EJEMPLO:
- Excel: 46101 (representa 2026-03-20)
- JavaScript crea: Date("2026-03-20T00:00:00-05:00")
- Al convertir a string o guardar: se ajusta a UTC
- Resultado: puede mostrar 2026-03-19 según cómo se maneje

SOLUCIÓN:
1. Usar raw:true para mantener números seriales
2. Convertir manualmente sin zona horaria
`);

console.log('\n✅ Verificación completada\n');
