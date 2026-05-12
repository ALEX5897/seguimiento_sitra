require('dotenv').config();
const pool = require('./src/db');
const xlsx = require('xlsx');
const fs = require('fs');

async function insertEmployees() {
  try {
    console.log('📋 Reading funcionarios_28042026.xlsx...');

    const workbook = xlsx.readFile('../doc/funcionarios_28042026.xlsx');
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    // The actual headers are in row 2 (index 1), so specify header row
    const data = xlsx.utils.sheet_to_json(ws, { range: 1, defval: null });

    console.log(`📥 Found ${data.length} employees in Excel file\n`);

    let inserted = 0;
    let skipped = 0;

    const connection = await pool.getConnection();

    // Desactivar restricciones para inserciones más rápidas
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const row of data) {
      const nombre = row['FUNCIONARIO'] || null;
      const gerencia = row['ÁREA'] || row['ÁREa'] || row['AREA'] || null;
      const cargo = row['CARGO'] || null;

      if (!nombre || typeof nombre !== 'string') {
        skipped++;
        continue;
      }

      // Generate email from first part of name
      const partes = nombre.split(' ');
      const apellido = partes[0].toLowerCase();
      const correo = `${apellido}@quito-turismo.gob.ec`;

      try {
        // Use INSERT IGNORE to skip duplicates
        const [result] = await connection.query(
          'INSERT IGNORE INTO usuarios (nombre, correo, cargo, gerencia, estado) VALUES (?, ?, ?, ?, ?)',
          [nombre, correo, cargo, gerencia, 'activo']
        );

        if (result.affectedRows > 0) {
          inserted++;
          if (inserted % 10 === 0) {
            console.log(`⏳ Inserted: ${inserted} employees...`);
          }
        }
      } catch (err) {
        console.error(`❌ Error inserting ${nombre}:`, err.message);
      }
    }

    // Reactivate foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    connection.release();

    console.log(`\n✅ Insertion complete:`);
    console.log(`   ✅ Inserted: ${inserted}`);
    console.log(`   ⊘ Skipped: ${skipped}`);

    // Verify
    const [total] = await pool.query('SELECT COUNT(*) as count FROM usuarios WHERE estado = "activo"');
    console.log(`\n📊 Total active employees in database: ${total[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertEmployees();
