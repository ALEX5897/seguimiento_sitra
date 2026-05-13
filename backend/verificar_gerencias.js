require('dotenv').config();
const mysql = require('mysql2/promise');

async function verificarGerencias() {
  let connection;
  try {
    console.log('🔄 Conectando a base de datos...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('✓ Conectado\n');

    // Contar usuarios con gerencia asignada
    console.log('📊 Reporte de Gerencias Asignadas:');
    const [usuariosConGerencia] = await connection.query(
      `SELECT COUNT(*) as total FROM usuarios WHERE gerencia IS NOT NULL AND gerencia != '' AND gerencia != 'Sin Gerencia'`
    );
    const [usuariosSinGerencia] = await connection.query(
      `SELECT COUNT(*) as total FROM usuarios WHERE (gerencia IS NULL OR gerencia = '' OR gerencia = 'Sin Gerencia')`
    );
    const [totalUsuarios] = await connection.query('SELECT COUNT(*) as total FROM usuarios');

    console.log(`\n✓ Usuarios con gerencia: ${usuariosConGerencia[0].total}`);
    console.log(`✗ Usuarios sin gerencia: ${usuariosSinGerencia[0].total}`);
    console.log(`📋 Total de usuarios: ${totalUsuarios[0].total}`);
    console.log(`📈 Cobertura: ${Math.round((usuariosConGerencia[0].total / totalUsuarios[0].total) * 100)}%`);

    // Distribución por gerencia
    console.log('\n📋 Distribución por Gerencia:');
    const [distribucion] = await connection.query(`
      SELECT
        COALESCE(gerencia, 'Sin Gerencia') as gerencia,
        COUNT(*) as cantidad
      FROM usuarios
      GROUP BY gerencia
      ORDER BY cantidad DESC
    `);

    distribucion.forEach(row => {
      const porcentaje = ((row.cantidad / totalUsuarios[0].total) * 100).toFixed(1);
      const barra = '█'.repeat(Math.round(row.cantidad / 3));
      console.log(`  ${barra} ${row.gerencia}: ${row.cantidad} usuario(s) (${porcentaje}%)`);
    });

    // Usuarios por gerencia (primeros 3)
    console.log('\n👥 Muestra de Usuarios por Gerencia:');
    const [gerenciasUnicas] = await connection.query(`
      SELECT DISTINCT gerencia FROM usuarios WHERE gerencia IS NOT NULL AND gerencia != '' ORDER BY gerencia
    `);

    for (const {gerencia} of gerenciasUnicas.slice(0, 3)) {
      const [usuarios] = await connection.query(
        `SELECT nombre FROM usuarios WHERE gerencia = ? ORDER BY nombre LIMIT 3`,
        [gerencia]
      );
      console.log(`\n  🏢 ${gerencia}:`);
      usuarios.forEach(u => console.log(`     - ${u.nombre}`));
    }

    // Verificar catálogo de gerencias
    console.log('\n\n📚 Catálogo de Gerencias:');
    const [catalogo] = await connection.query(`
      SELECT COUNT(*) as total FROM catalogo_gerencias WHERE activo = true
    `);
    console.log(`  ✓ Gerencias activas en catálogo: ${catalogo[0].total}`);

    console.log('\n✓ Verificación completada');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

verificarGerencias();
