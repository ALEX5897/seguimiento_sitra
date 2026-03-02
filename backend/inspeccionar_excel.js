const xlsx = require('xlsx');
const path = require('path');

console.log('📋 INSPECCIONAR CONTENIDO REAL DEL ARCHIVO EXCEL\n');

const file = path.resolve(__dirname, '..', 'doc', 'sitra2026.xlsx');
const wb = xlsx.readFile(file);
const sheet = wb.Sheets['Reasignados'];

console.log('='.repeat(80));
console.log('COLUMNAS DISPONIBLES EN EL EXCEL');
console.log('='.repeat(80));

const dataRaw = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: true });
const columnas = Object.keys(dataRaw[0] || {});

columnas.forEach((col, i) => {
  console.log(`${i + 1}. "${col}"`);
});

console.log('\n' + '='.repeat(80));
console.log('PRIMERAS 3 FILAS CON TODOS LOS DATOS');
console.log('='.repeat(80));

dataRaw.forEach((row, i) => {
  if (i < 3) {
    console.log(`\n📄 Fila ${i + 2}:`);
    Object.entries(row).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        console.log(`  ${key}: ${value} (${typeof value})`);
      }
    });
  }
});

console.log('\n' + '='.repeat(80));
console.log('BÚSQUEDA DE FECHAS');
console.log('='.repeat(80));

const columnasConFecha = columnas.filter(col => 
  col.toLowerCase().includes('fecha') || 
  col.toLowerCase().includes('date')
);

console.log(`\nColumnas que contienen "fecha":`);
columnasConFecha.forEach(col => {
  console.log(`  - "${col}"`);
});

console.log('\nValores de estas columnas en la primera fila:');
dataRaw.slice(0, 1).forEach((row, i) => {
  columnasConFecha.forEach(col => {
    const valor = row[col];
    console.log(`  ${col}: ${valor} (${typeof valor})`);
  });
});
