require('dotenv').config();
const xlsx = require('xlsx');
const fs = require('fs');

async function fixUploadNames() {
  try {
    console.log('📋 Loading funcionarios list...');

    // Load funcionarios file with proper headers
    const wb1 = xlsx.readFile('../doc/funcionarios_28042026.xlsx');
    const ws1 = wb1.Sheets[wb1.SheetNames[0]];
    const funcionarios_data = xlsx.utils.sheet_to_json(ws1, { range: 1 });

    // Create a map of names
    const funcionarios_map = new Map();
    for (const row of funcionarios_data) {
      if (row['FUNCIONARIO']) {
        const nombre = row['FUNCIONARIO'].toUpperCase().trim();
        funcionarios_map.set(nombre, row);
      }
    }

    console.log(`✅ Loaded ${funcionarios_map.size} official names\n`);

    // Load sitra2026 file
    console.log('📋 Loading sitra2026.xlsx...');
    const wb2 = xlsx.readFile('../doc/sitra2026.xlsx');

    // Process each sheet
    for (const sheetName of wb2.SheetNames) {
      const ws2 = wb2.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(ws2);

      // Find the name column
      let nameCol = null;
      if (data.length > 0) {
        const firstRow = data[0];
        if ('Reasignado a' in firstRow) nameCol = 'Reasignado a';
        else if ('Asignado para' in firstRow) nameCol = 'Asignado para';
        else if ('Para' in firstRow) nameCol = 'Para';
      }

      if (nameCol) {
        console.log(`\n${sheetName} (column: ${nameCol}):`);

        // List of names that need fixing
        const needsFix = new Map();

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (row[nameCol]) {
            // Clean the name - remove parentheses content
            const originalName = row[nameCol];
            const cleanedName = originalName.toUpperCase().replace(/\s*\([^)]*\)/g, '').trim();

            // Try to find matching oficial name
            let found = false;
            for (const [oficialName] of funcionarios_map) {
              if (oficialName.includes(cleanedName) || cleanedName.includes(oficialName)) {
                if (row[nameCol] !== oficialName) {
                  needsFix.set(originalName, oficialName);
                }
                found = true;
                break;
              }
            }

            if (!found) {
              console.log(`  ❌ "${originalName}" - NO MATCH FOUND`);
            }
          }
        }

        // Show fixes needed
        if (needsFix.size > 0) {
          console.log(`\n  Fixes needed in "${sheetName}":`);
          for (const [old, nuevo] of needsFix) {
            console.log(`    "${old}" -> "${nuevo}"`);
          }
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixUploadNames();
