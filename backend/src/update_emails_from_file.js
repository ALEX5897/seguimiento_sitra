require('dotenv').config();
const db = require('./db');
const xlsx = require('xlsx');
const path = require('path');

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function stringSimilarity(a, b) {
  a = normalizeName(a);
  b = normalizeName(b);
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(longer, shorter) {
  const costs = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  return costs[shorter.length];
}

async function main() {
  try {
    const filePath = path.resolve(__dirname, '../../doc/funcionarios_28042026.xlsx');

    console.log('📂 Leyendo archivo de funcionarios...');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

    const usuariosFile = rows
      .filter(row => row['__EMPTY_1'] && row['__EMPTY_4']) // nombre y correo
      .map(row => ({
        nombre: String(row['__EMPTY_1']).trim(),
        correo: String(row['__EMPTY_4']).trim().toLowerCase()
      }))
      .filter(u => u.correo && u.correo.includes('@'));

    console.log(`✅ ${usuariosFile.length} usuarios en archivo\n`);

    console.log('📥 Obteniendo usuarios de BD...');
    const [usuariosDB] = await db.query('SELECT id, nombre, correo FROM usuarios ORDER BY nombre ASC');
    console.log(`✅ ${usuariosDB.length} usuarios en BD\n`);

    console.log('🔍 Haciendo match...\n');
    const updates = [];
    const sinMatch = [];

    for (const usuarioDB of usuariosDB) {
      let bestMatch = null;
      let bestSimilarity = 0.7;

      for (const usuarioFile of usuariosFile) {
        const similarity = stringSimilarity(usuarioDB.nombre, usuarioFile.nombre);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = usuarioFile;
        }
      }

      if (bestMatch) {
        updates.push({
          id: usuarioDB.id,
          nombre: usuarioDB.nombre,
          correoAnterior: usuarioDB.correo,
          correoNuevo: bestMatch.correo,
          similarity: bestSimilarity
        });
      } else {
        sinMatch.push({
          id: usuarioDB.id,
          nombre: usuarioDB.nombre
        });
      }
    }

    console.log(`✅ MATCHES: ${updates.length}`);
    console.log(`⚠️  SIN MATCH: ${sinMatch.length}\n`);

    if (updates.length === 0) {
      console.log('No hay actualizaciones');
      process.exit(0);
    }

    console.log('💾 Actualizando correos...\n');
    let actualizados = 0;
    let errores = 0;
    let sinCambio = 0;

    for (const upd of updates) {
      try {
        if (upd.correoAnterior === upd.correoNuevo) {
          sinCambio++;
          continue;
        }

        const [existing] = await db.query(
          'SELECT id FROM usuarios WHERE correo = ? AND id != ?',
          [upd.correoNuevo, upd.id]
        );

        if (existing.length > 0) {
          console.log(`⚠️  ${upd.nombre}: Correo ya existe`);
          errores++;
          continue;
        }

        await db.query(
          'UPDATE usuarios SET correo = ? WHERE id = ?',
          [upd.correoNuevo, upd.id]
        );

        console.log(`✅ ${upd.nombre}`);
        console.log(`   ${upd.correoAnterior} → ${upd.correoNuevo}`);
        actualizados++;

        if ((actualizados + errores) % 15 === 0) {
          console.log('');
        }
      } catch (err) {
        errores++;
        console.error(`❌ ${upd.nombre}: ${err.message}`);
      }
    }

    console.log(`\n✨ Completado:`);
    console.log(`   ✅ Actualizados: ${actualizados}`);
    console.log(`   ⏭️  Sin cambio: ${sinCambio}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   ⚠️  Sin match: ${sinMatch.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
