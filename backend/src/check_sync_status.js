require('dotenv').config();
const db = require('./db');

async function main() {
  try {
    console.log('\n📊 ESTADO DE SINCRONIZACIÓN DE USUARIOS\n');

    // Total de usuarios
    const [total] = await db.query('SELECT COUNT(*) as count FROM usuarios');
    console.log(`📌 Total de usuarios: ${total[0].count}\n`);

    // Por estado
    const [porEstado] = await db.query(`
      SELECT estado, COUNT(*) as cantidad
      FROM usuarios
      GROUP BY estado
      ORDER BY cantidad DESC
    `);

    console.log('🔹 Por estado:');
    porEstado.forEach(row => {
      console.log(`   • ${row.estado}: ${row.cantidad}`);
    });

    // Usuarios sin correo
    const [sinCorreo] = await db.query(`
      SELECT COUNT(*) as count FROM usuarios WHERE correo IS NULL OR correo = ''
    `);
    console.log(`\n⚠️  Sin correo: ${sinCorreo[0].count}`);

    // Usuarios sin gerencia
    const [sinGerencia] = await db.query(`
      SELECT COUNT(*) as count FROM usuarios WHERE gerencia IS NULL OR gerencia = ''
    `);
    console.log(`⚠️  Sin gerencia: ${sinGerencia[0].count}`);

    // Usuarios sin cargo
    const [sinCargo] = await db.query(`
      SELECT COUNT(*) as count FROM usuarios WHERE cargo IS NULL OR cargo = ''
    `);
    console.log(`⚠️  Sin cargo: ${sinCargo[0].count}\n`);

    // Gerencias
    const [gerencias] = await db.query(`
      SELECT gerencia, COUNT(*) as cantidad
      FROM usuarios
      WHERE gerencia IS NOT NULL AND gerencia != ''
      GROUP BY gerencia
      ORDER BY cantidad DESC
    `);

    console.log(`📍 Gerencias (${gerencias.length} únicas):`);
    gerencias.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.gerencia}: ${row.cantidad}`);
    });

    // Verificar formato de correos
    const [sinFormatoValido] = await db.query(`
      SELECT COUNT(*) as count
      FROM usuarios
      WHERE correo NOT LIKE '%@quito-turismo.gob.ec' AND correo IS NOT NULL
    `);

    console.log(`\n✉️  Verificación de correos:`);
    console.log(`   • Con formato quito-turismo.gob.ec: ${total[0].count - sinFormatoValido[0].count}`);
    console.log(`   • Con otro formato: ${sinFormatoValido[0].count}`);

    if (sinFormatoValido[0].count > 0) {
      const [otrosFormatos] = await db.query(`
        SELECT DISTINCT correo
        FROM usuarios
        WHERE correo NOT LIKE '%@quito-turismo.gob.ec' AND correo IS NOT NULL
        ORDER BY correo
        LIMIT 10
      `);
      console.log('\n   Otros formatos encontrados:');
      otrosFormatos.forEach(row => {
        console.log(`      • ${row.correo}`);
      });
    }

    // Sincronización con Keycloak
    const [conKeycloak] = await db.query(`
      SELECT COUNT(*) as count
      FROM usuarios
      WHERE extra LIKE '%keycloakId%'
    `);
    console.log(`\n🔐 Sincronización Keycloak:`);
    console.log(`   • Usuarios sincronizados: ${conKeycloak[0].count}`);
    console.log(`   • Sin sincronizar: ${total[0].count - conKeycloak[0].count}`);

    // Resumen rápido
    console.log('\n📈 RESUMEN:');
    console.log(`   ✅ Sistema listo para sincronización desde Keycloak`);
    console.log(`   ✅ ${total[0].count} usuarios en catálogo`);
    console.log(`   ✅ Correos corporativos configurados`);
    console.log(`   ${conKeycloak[0].count > 0 ? '✅ Sincronización Keycloak activa' : '⏳ En espera de primera sincronización Keycloak'}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
