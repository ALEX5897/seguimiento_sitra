const xlsx = require('xlsx');
const path = require('path');

const file = path.resolve(__dirname, '..', 'doc', 'sitra2026.xlsx');
const wb = xlsx.readFile(file);

console.log('REASIGNADOS:');
const sheetR = wb.Sheets['Reasignados'];
const dataR = xlsx.utils.sheet_to_json(sheetR);
dataR.forEach((r, i) => console.log(`  ${i + 1}. "${r['Reasignado a']}"`));

console.log('\nTAREAS:');
const sheetT = wb.Sheets['Tareas'];
const dataT = xlsx.utils.sheet_to_json(sheetT);
dataT.forEach((r, i) => console.log(`  ${i + 1}. "${r['Asignado para']}"`));

console.log('\nENVIADOS:');
const sheetE = wb.Sheets['Enviados'];
const dataE = xlsx.utils.sheet_to_json(sheetE);
dataE.forEach((r, i) => console.log(`  ${i + 1}. "${r['Para']}"`));
