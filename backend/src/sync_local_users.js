require('dotenv').config();
const db = require('./db');

/**
 * Genera un correo corporativo basado en el nombre
 */
function generarCorreo(nombre) {
  if (!nombre) return null;
  const partes = nombre.trim().toLowerCase().split(/\s+/);

  // Tomar el primer nombre y el último apellido
  if (partes.length < 2) {
    return `${partes[0]}@quito-turismo.gob.ec`;
  }

  const apellido = partes[partes.length - 1];
  const nombres = partes.slice(0, -1).join('');

  return `${nombres}.${apellido}@quito-turismo.gob.ec`;
}

/**
 * Script principal
 */
async function main() {
  try {
    console.log('\n📊 Iniciando sincronización local de usuarios...\n');

    // 1. Obtener todos los usuarios
    console.log('📥 Obteniendo usuarios de la base de datos...');
    const [usuarios] = await db.query(
      'SELECT id, nombre, correo, cargo, gerencia, telefono, estado FROM usuarios ORDER BY nombre ASC'
    );
    console.log(`✅ ${usuarios.length} usuarios en la BD\n`);

    // 2. Analizar y generar correos
    console.log('🔍 Analizando usuarios y generando correos...\n');
    const actualizaciones = [];
    const sinCambios = [];
    const conErrores = [];

    for (const usuario of usuarios) {
      const correoGenerado = generarCorreo(usuario.nombre);

      if (!correoGenerado) {
        conErrores.push({
          id: usuario.id,
          nombre: usuario.nombre,
          razon: 'No se pudo generar correo (nombre inválido)'
        });
        continue;
      }

      if (usuario.correo === correoGenerado) {
        sinCambios.push({
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo
        });
        continue;
      }

      // Verificar que el correo nuevo no esté duplicado
      const [existing] = await db.query(
        'SELECT id FROM usuarios WHERE correo = ? AND id != ?',
        [correoGenerado, usuario.id]
      );

      if (existing.length > 0) {
        conErrores.push({
          id: usuario.id,
          nombre: usuario.nombre,
          correoActual: usuario.correo,
          correoGenerado,
          razon: 'Correo generado ya existe en otro usuario'
        });
        continue;
      }

      actualizaciones.push({
        id: usuario.id,
        nombre: usuario.nombre,
        correoActual: usuario.correo,
        correoNuevo: correoGenerado,
        cargo: usuario.cargo,
        gerencia: usuario.gerencia,
        telefono: usuario.telefono
      });
    }

    // 3. Mostrar resumen
    console.log('┌─ RESUMEN ───────────────────────────────────────────────┐');
    console.log(`│ Actualizaciones necesarias: ${actualizaciones.length}`);
    console.log(`│ Sin cambios: ${sinCambios.length}`);
    console.log(`│ Con errores: ${conErrores.length}`);
    console.log('└─────────────────────────────────────────────────────────┘\n');

    if (actualizaciones.length === 0) {
      console.log('ℹ️  No hay cambios para realizar\n');
      if (conErrores.length > 0) {
        console.log('⚠️  USUARIOS CON ERRORES:\n');
        conErrores.forEach((e, i) => {
          console.log(`${i + 1}. ${e.nombre}`);
          console.log(`   Error: ${e.razon}`);
        });
      }
      process.exit(0);
    }

    // 4. Mostrar cambios propuestos
    console.log('📋 CAMBIOS PROPUESTOS:\n');
    actualizaciones.forEach((upd, i) => {
      console.log(`${i + 1}. ${upd.nombre}`);
      console.log(`   ${upd.correoActual} → ${upd.correoNuevo}`);
      if (upd.cargo) console.log(`   Cargo: ${upd.cargo}`);
      if (upd.gerencia) console.log(`   Gerencia: ${upd.gerencia}`);
      console.log('');
    });

    // 5. Ejecutar actualizaciones
    console.log('💾 Actualizando correos en la base de datos...\n');
    let actualizados = 0;
    let erroresEjecucion = 0;

    for (const upd of actualizaciones) {
      try {
        await db.query(
          'UPDATE usuarios SET correo = ?, extra = ? WHERE id = ?',
          [
            upd.correoNuevo,
            JSON.stringify({
              correoAnterior: upd.correoActual,
              actualizadoEn: new Date().toISOString(),
              fuente: 'sincronización_local'
            }),
            upd.id
          ]
        );

        console.log(`✅ ${upd.nombre}`);
        console.log(`   ${upd.correoActual} → ${upd.correoNuevo}`);
        actualizados++;

        if (actualizados % 10 === 0) {
          console.log(`   (${actualizados}/${actualizaciones.length})\n`);
        }
      } catch (err) {
        erroresEjecucion++;
        console.error(`❌ Error actualizando ${upd.nombre}:`, err.message);
      }
    }

    // 6. Mostrar resumen final
    console.log(`\n✨ Actualización completada:`);
    console.log(`   ✅ Actualizados: ${actualizados}/${actualizaciones.length}`);
    console.log(`   ❌ Errores: ${erroresEjecucion}`);

    // 7. Estadísticas finales
    const [stats] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activos,
        SUM(CASE WHEN estado = 'inactivo' THEN 1 ELSE 0 END) as inactivos,
        COUNT(DISTINCT gerencia) as gerencias,
        COUNT(DISTINCT cargo) as cargos
      FROM usuarios
    `);

    console.log(`\n📊 ESTADÍSTICAS FINALES:`);
    console.log(`   Total usuarios: ${stats[0].total}`);
    console.log(`   Activos: ${stats[0].activos}`);
    console.log(`   Inactivos: ${stats[0].inactivos}`);
    console.log(`   Gerencias únicas: ${stats[0].gerencias}`);
    console.log(`   Cargos únicos: ${stats[0].cargos}`);

    const [porGerencia] = await db.query(`
      SELECT gerencia, COUNT(*) as cantidad
      FROM usuarios
      WHERE gerencia IS NOT NULL
      GROUP BY gerencia
      ORDER BY cantidad DESC
      LIMIT 10
    `);

    if (porGerencia.length > 0) {
      console.log(`\n   Top 10 gerencias:`);
      porGerencia.forEach((row, i) => {
        console.log(`      ${i + 1}. ${row.gerencia}: ${row.cantidad} usuarios`);
      });
    }

    console.log('\n✅ ¡Sincronización completada exitosamente!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
