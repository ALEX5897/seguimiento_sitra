require('dotenv').config();
const db = require('./db');
const fs = require('fs');

function generateKeycloakEmail(nombre) {
  if (!nombre) return null;

  const parts = nombre.trim().toLowerCase().split(/\s+/);

  if (parts.length === 1) {
    return `${parts[0]}@quito-turismo.gob.ec`;
  }

  if (parts.length === 2) {
    return `${parts[0]}.${parts[1]}@quito-turismo.gob.ec`;
  }

  if (parts.length === 3) {
    return `${parts[0]}.${parts[2]}@quito-turismo.gob.ec`;
  }

  const apellidoPrincipal = parts[parts.length - 1];
  return `${parts[0]}.${apellidoPrincipal}@quito-turismo.gob.ec`;
}

async function main() {
  try {
    console.log('📥 Obteniendo usuarios de BD...');
    const [rows] = await db.query('SELECT id, nombre, correo FROM usuarios ORDER BY nombre');

    const keycloakUsers = rows.map(row => ({
      nombre: row.nombre,
      correo: generateKeycloakEmail(row.nombre)
    }));

    console.log(`✅ ${keycloakUsers.length} usuarios\n`);
    console.log('💾 Generando archivo keycloak_users.json...\n');

    fs.writeFileSync('keycloak_users.json', JSON.stringify(keycloakUsers, null, 2));

    console.log('✅ Archivo generado: keycloak_users.json');
    console.log('\nEjemplos de patrones generados:');
    keycloakUsers.slice(0, 5).forEach(u => {
      console.log(`  ${u.nombre} → ${u.correo}`);
    });

    console.log(`\n📊 Muestra de cambios propuestos:`);
    let cambios = 0;
    rows.slice(0, 10).forEach(row => {
      const nuevoCorreo = generateKeycloakEmail(row.nombre);
      if (row.correo !== nuevoCorreo) {
        console.log(`  ${row.nombre}`);
        console.log(`    ${row.correo} → ${nuevoCorreo}`);
        cambios++;
      }
    });

    console.log(`\nPróximo paso: node update_emails_from_json.js ../keycloak_users.json`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
