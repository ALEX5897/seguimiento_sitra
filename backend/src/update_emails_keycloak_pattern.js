require('dotenv').config();
const db = require('./db');

function generateKeycloakEmail(nombre) {
  if (!nombre) return null;

  const parts = nombre.trim().split(/\s+/);

  if (parts.length < 2) {
    return null;
  }

  const apellido = parts[0].toLowerCase();
  const ultimoNombre = parts[parts.length - 1];
  const inicial = ultimoNombre[0].toLowerCase();

  return `${inicial}${apellido}@quito-turismo.gob.ec`;
}

async function main() {
  try {
    console.log('📥 Obteniendo usuarios de BD...');
    const [rows] = await db.query('SELECT id, nombre, correo FROM usuarios ORDER BY nombre');

    console.log(`✅ ${rows.length} usuarios encontrados\n`);

    const updates = [];
    let cambios = 0;

    rows.forEach(row => {
      const nuevoCorreo = generateKeycloakEmail(row.nombre);
      if (nuevoCorreo && row.correo !== nuevoCorreo) {
        updates.push({
          id: row.id,
          nombre: row.nombre,
          correoAnterior: row.correo,
          correoNuevo: nuevoCorreo
        });
        cambios++;
      }
    });

    console.log(`📋 Cambios propuestos: ${cambios}\n`);
    console.log('Muestra de cambios (primeros 10):');
    updates.slice(0, 10).forEach(u => {
      console.log(`  ${u.nombre}`);
      console.log(`    ${u.correoAnterior} → ${u.correoNuevo}`);
    });

    if (cambios === 0) {
      console.log('\n✅ No hay cambios necesarios');
      process.exit(0);
    }

    console.log(`\n🔄 Aplicando ${cambios} cambios a la base de datos...\n`);

    let actualizados = 0;
    let errores = 0;

    for (const update of updates) {
      try {
        await db.query('UPDATE usuarios SET correo = ? WHERE id = ?', [update.correoNuevo, update.id]);
        actualizados++;
      } catch (error) {
        console.error(`❌ Error actualizando usuario ${update.id}: ${error.message}`);
        errores++;
      }
    }

    console.log(`\n📊 Resultados:`);
    console.log(`  ✅ Actualizados: ${actualizados}`);
    console.log(`  ❌ Errores: ${errores}`);
    console.log(`  📈 Total cambios: ${cambios}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
