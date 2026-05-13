const db = require('./src/db');

async function fix() {
  try {
    console.log('🔄 Iniciando reversión de datos...\n');

    // Paso 1: Revertir documentos de usuario_id 97 a 4
    console.log('1️⃣  Revirtiendo documentos de usuario_id 97 → 4');
    const [result1] = await db.query(
      'UPDATE reasignados SET usuario_id = 4 WHERE usuario_id = 97',
      []
    );
    console.log(`   ✅ ${result1.changedRows} documentos revertidos\n`);

    // Paso 2: Verificar documentos de usuario_id 4
    console.log('2️⃣  Verificando documentos de usuario_id 4 (empleados.id=4 = acasa@quito-turismo.gob.ec)');
    const [verify] = await db.query(
      'SELECT id, numero_documento FROM reasignados WHERE usuario_id = 4 ORDER BY id'
    );
    console.log(`   Total: ${verify.length} documentos\n`);
    verify.forEach(d => console.log(`   - #${d.id}: ${d.numero_documento}`));

    // Paso 3: Limpiar empleados duplicados (IDs 145-149)
    console.log('\n3️⃣  Limpiando empleados duplicados con correo de prueba (IDs 145-149)');
    const [duplicados] = await db.query(
      'SELECT id, nombre, correo FROM empleados WHERE id IN (145, 146, 147, 148, 149)'
    );

    if (duplicados.length > 0) {
      console.log(`   Encontrados ${duplicados.length} empleados duplicados:`);
      duplicados.forEach(e => console.log(`   - ID ${e.id}: ${e.nombre} (${e.correo})`));

      const [result3] = await db.query(
        'DELETE FROM empleados WHERE id IN (145, 146, 147, 148, 149)'
      );
      console.log(`   ✅ ${result3.affectedRows} empleados eliminados\n`);
    } else {
      console.log('   ✅ No hay empleados duplicados para limpiar\n');
    }

    // Paso 4: Verificar estructura final
    console.log('4️⃣  Verificación final');

    const [userInfo] = await db.query(
      'SELECT id, nombre, correo FROM empleados WHERE id = 4'
    );

    if (userInfo.length > 0) {
      const user = userInfo[0];
      console.log(`   Usuario empleados.id=4: ${user.nombre} (${user.correo})`);
      console.log(`   Documentos asignados: ${verify.length}`);
    }

    console.log('\n✨ Reversión completada exitosamente');
    console.log('\n📌 Próximos pasos:');
    console.log('   1. Actualizar getUserIdFromCorreo en middleware/auth.js para buscar en empleados');
    console.log('   2. Cambiar JOINs en estadisticas.js');
    console.log('   3. Eliminar sincronización con usuarios en auth.js');
    console.log('   4. Reiniciar backend');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

fix();
