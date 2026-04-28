require('dotenv').config();
const db = require('./db');
const https = require('https');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function getAdminToken() {
  const baseUrl = process.env.KEYCLOAK_URL.replace(/\/$/, '');
  const realm = process.env.KEYCLOAK_ADMIN_REALM || 'master';
  const clientId = process.env.KEYCLOAK_ADMIN_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET;
  const username = process.env.KEYCLOAK_ADMIN_USER;
  const password = process.env.KEYCLOAK_ADMIN_PASSWORD;

  const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;

  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', clientId);
  params.append('username', username);
  params.append('password', password);

  if (clientSecret) {
    params.append('client_secret', clientSecret);
  }

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      agent: httpsAgent
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    throw new Error(`Failed to get admin token: ${error.message}`);
  }
}

async function getKeycloakUsers(token) {
  const baseUrl = process.env.KEYCLOAK_URL.replace(/\/$/, '');
  const realm = process.env.KEYCLOAK_REALM;

  let allUsers = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const url = `${baseUrl}/admin/realms/${realm}/users?max=${limit}&first=${offset}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        agent: httpsAgent
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const users = await response.json();
      if (users.length === 0) break;

      allUsers = allUsers.concat(users);
      offset += limit;
      console.log(`📥 Descargados ${allUsers.length} usuarios...`);
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  return allUsers;
}

async function createEmpleadosTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS empleados (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      usuario VARCHAR(255) NOT NULL UNIQUE,
      correo VARCHAR(255) NOT NULL UNIQUE,
      nombre VARCHAR(255),
      cargo VARCHAR(255),
      gerencia VARCHAR(255),
      telefono VARCHAR(50),
      estado VARCHAR(50) DEFAULT 'activo',
      extra JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_gerencia (gerencia)
    )
  `;
  await db.query(sql);
  console.log('✅ Tabla empleados creada/verificada');
}

async function main() {
  try {
    console.log('🔐 Obteniendo token de admin...');
    const token = await getAdminToken();
    console.log('✅ Token obtenido\n');

    console.log('📥 Descargando usuarios de Keycloak...');
    const keycloakUsers = await getKeycloakUsers(token);
    console.log(`✅ Total: ${keycloakUsers.length} usuarios\n`);

    console.log('🔨 Creando tabla empleados...');
    await createEmpleadosTable();

    console.log('🗑️  Limpiando tabla empleados...');
    await db.query('TRUNCATE TABLE empleados');
    console.log('✅ Tabla limpiada\n');

    const formatted = keycloakUsers
      .filter(u => u.enabled && u.email)
      .map(u => ({
        usuario: u.username,
        correo: u.email,
        nombre: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
        cargo: u.attributes?.cargo?.[0] || null,
        gerencia: u.attributes?.gerencia?.[0] || null,
        telefono: u.attributes?.telefono?.[0] || null,
        estado: 'activo'
      }));

    console.log(`💾 Insertando ${formatted.length} empleados...\n`);

    let insertados = 0;
    let errores = 0;

    for (const emp of formatted) {
      try {
        await db.query(
          'INSERT INTO empleados (usuario, correo, nombre, cargo, gerencia, telefono, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [emp.usuario, emp.correo, emp.nombre, emp.cargo, emp.gerencia, emp.telefono, emp.estado]
        );
        insertados++;
      } catch (error) {
        console.error(`❌ Error insertando ${emp.usuario}: ${error.message}`);
        errores++;
      }
    }

    console.log(`📊 Resultados:`);
    console.log(`  ✅ Insertados: ${insertados}`);
    console.log(`  ❌ Errores: ${errores}`);
    console.log(`  📈 Total: ${formatted.length}`);

    if (insertados > 0) {
      console.log('\n👥 Muestra de empleados (primeros 5):');
      const [sample] = await db.query('SELECT usuario, correo, nombre, cargo, gerencia FROM empleados LIMIT 5');
      sample.forEach(emp => {
        console.log(`  ${emp.usuario} | ${emp.correo} | ${emp.nombre}`);
        if (emp.cargo) console.log(`    Cargo: ${emp.cargo}`);
        if (emp.gerencia) console.log(`    Gerencia: ${emp.gerencia}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
