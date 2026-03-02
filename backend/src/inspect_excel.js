const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

const file = path.resolve(__dirname, '..', '..', 'doc', 'sitra2026.xlsx');
if (!fs.existsSync(file)) { console.error('File not found:', file); process.exit(1); }
const wb = xlsx.readFile(file);
for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const headers = rows[0] || [];
  console.log('Sheet:', name);
  console.log('Headers:', headers.join(' | '));
  console.log('---');
}
