require('dotenv').config();
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const db = require('./db');

// Genera un correo basado en el nombre
function generarCorreo(nombre) {
  if (!nombre) return null;
  const partes = nombre.trim().toLowerCase().split(/\s+/);
  const apellido = partes[partes.length - 1];
  const nombres = partes.slice(0, -1).join('');
  return `${nombres}.${apellido}@quitoturismo.gob.ec`;
}

async function loadFuncionarios() {
  const file = path.resolve(__dirname, '..', '..', 'doc', 'funcionarios_28042026.xlsx');
  if (!fs.existsSync(file)) {
    console.error('❌ File not found:', file);
    process.exit(1);
  }

  console.log('📂 Reading file:', file);
  const workbook = xlsx.readFile(file);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

  console.log(`\n📊 Sheet: "${sheetName}"`);
  console.log(`📈 Total rows: ${rows.length}`);

  // Skip the header row (first row contains column names)
  const dataRows = rows.slice(1);

  let insertados = 0;
  let errores = 0;

  console.log('\n👥 Loading funcionarios into usuarios table...\n');

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];

    // Map columns from Excel structure
    // Column headers from Excel inspection:
    // 'LISTADO DEL PERSONAL DE QUITO TURISMO' -> Nro
    // __EMPTY -> CC
    // __EMPTY_1 -> FUNCIONARIO (nombre)
    // __EMPTY_2 -> ÁREA (gerencia)
    // __EMPTY_3 -> CARGO (cargo)

    const nro = row['LISTADO DEL PERSONAL DE QUITO TURISMO'];
    const nombre = row['__EMPTY_1'];
    const area = row['__EMPTY_2'];
    const cargo = row['__EMPTY_3'];
    const cc = row['__EMPTY'];

    // Skip rows without nombre
    if (!nombre) {
      continue;
    }

    const correo = generarCorreo(nombre);
    const estado = 'activo';

    try {
      await db.query(
        `INSERT INTO usuarios (nombre, correo, cargo, gerencia, estado, extra)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           cargo = VALUES(cargo),
           gerencia = VALUES(gerencia),
           estado = VALUES(estado)`,
        [
          nombre,
          correo,
          cargo || null,
          area || null,
          estado,
          JSON.stringify({ cc, nro })
        ]
      );

      insertados++;
      if (insertados % 10 === 0) {
        console.log(`✅ ${insertados} funcionarios procesados...`);
      }
    } catch (err) {
      errores++;
      console.error(`❌ Error with row ${i + 1} (${nombre}):`, err.message);
    }
  }

  console.log(`\n✨ Process completed!`);
  console.log(`✅ Insertados: ${insertados}`);
  console.log(`❌ Errores: ${errores}`);

  // Show summary
  try {
    const [usuarios] = await db.query(
      'SELECT COUNT(*) as total, COUNT(DISTINCT gerencia) as areas FROM usuarios'
    );
    console.log(`\n📊 Summary:`);
    console.log(`   Total usuarios: ${usuarios[0].total}`);
    console.log(`   Unique areas: ${usuarios[0].areas}`);

    const [byArea] = await db.query(
      'SELECT gerencia, COUNT(*) as cantidad FROM usuarios GROUP BY gerencia ORDER BY cantidad DESC LIMIT 10'
    );
    console.log(`\n📋 Top areas:`);
    byArea.forEach(row => {
      console.log(`   ${row.gerencia}: ${row.cantidad}`);
    });
  } catch (err) {
    console.error('Error fetching summary:', err.message);
  }

  console.log('\n✅ Done!');
  process.exit(0);
}

loadFuncionarios().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
