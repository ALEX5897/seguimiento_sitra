require('dotenv').config();
const fs = require('fs');
const https = require('https');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function getToken() {
  const baseUrl = process.env.KEYCLOAK_URL.replace(/\/$/, '');
  const realm = process.env.KEYCLOAK_REALM;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

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
    throw new Error(`Failed to get token: ${error.message}`);
  }
}

async function getUsers(token) {
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

async function main() {
  try {
    console.log('🔐 Obteniendo token...');
    const token = await getToken();
    console.log('✅ Token obtenido\n');

    console.log('📥 Descargando usuarios de Keycloak...');
    const users = await getUsers(token);
    console.log(`✅ Total: ${users.length} usuarios\n`);

    const formatted = users
      .filter(u => u.enabled && u.email)
      .map(u => ({
        nombre: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
        correo: u.email
      }));

    console.log(`💾 Guardando ${formatted.length} usuarios habilitados en keycloak_users.json\n`);

    fs.writeFileSync(
      'keycloak_users.json',
      JSON.stringify(formatted, null, 2),
      'utf8'
    );

    console.log('✅ Archivo exportado exitosamente');
    console.log('\nPróximo paso: node update_emails_from_json.js keycloak_users.json');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
