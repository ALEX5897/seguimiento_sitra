const db = require('./src/db');

async function testFilter() {
  console.log('🔍 Simulando el filtro de documentos para usuario solo_vista\n');

  try {
    const usuarioCorreo = 'acasa@quito-turismo.gob.ec';

    // Paso 1: Obtener usuario_id de tabla empleados (no usuarios)
    console.log(`1️⃣ Obteniendo usuario_id para correo: ${usuarioCorreo}`);
    const [rows] = await db.query('SELECT id FROM empleados WHERE correo = ?', [usuarioCorreo]);
    const usuarioId = rows.length > 0 ? rows[0].id : null;
    console.log(`   Resultado: usuario_id = ${usuarioId}\n`);

    if (!usuarioId) {
      console.log('❌ Usuario no encontrado');
      process.exit(1);
    }

    // Paso 2: Query con filtro (igual a lo que hace GET /api/reasignados)
    console.log(`2️⃣ Ejecutando query filtrado por usuario_id = ${usuarioId}`);
    const query = 'SELECT r.id, r.numero_documento, r.usuario_id FROM reasignados r LEFT JOIN empleados e ON r.usuario_id = e.id WHERE r.usuario_id = ? ORDER BY r.id DESC LIMIT 50';
    const [docs] = await db.query(query, [usuarioId]);
    console.log(`   Documentos encontrados: ${docs.length}\n`);

    if (docs.length > 0) {
      console.log('   Primeros 5:');
      docs.slice(0, 5).forEach(d => {
        console.log(`   - ID: ${d.id}, Documento: ${d.numero_documento}, usuario_id: ${d.usuario_id}`);
      });
    } else {
      console.log('   ⚠️ Sin documentos asignados a este usuario');
    }

    // Paso 3: Query sin filtro (lo que vería un admin)
    console.log(`\n3️⃣ Ejecutando query SIN filtro (como admin vería):`)
    const queryAll = 'SELECT COUNT(*) as total FROM reasignados';
    const [all] = await db.query(queryAll);
    console.log(`   Total de documentos en BD: ${all[0].total}`);

    // Paso 4: Ver documentos por usuario_id
    console.log(`\n4️⃣ Distribución de documentos por usuario_id (Top 10):`);
    const [distribution] = await db.query(
      `SELECT usuario_id, COUNT(*) as count FROM reasignados GROUP BY usuario_id ORDER BY count DESC LIMIT 10`
    );
    distribution.forEach(d => {
      const marker = d.usuario_id === usuarioId ? ' ← ESTE USUARIO' : '';
      console.log(`   usuario_id ${d.usuario_id}: ${d.count} documentos${marker}`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

testFilter();
