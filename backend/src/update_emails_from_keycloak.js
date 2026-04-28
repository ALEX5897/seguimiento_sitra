require('dotenv').config();
const db = require('./db');
const https = require('https');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

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

async function getAdminToken() {
  const baseUrl = process.env.KEYCLOAK_URL.replace(/\/$/, '');
  const realm = process.env.KEYCLOAK_REALM || 'master';
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  let tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;

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

    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    }

    if (response.status === 404 || response.status === 401) {
      tokenUrl = `${baseUrl}/auth/realms/${realm}/protocol/openid-connect/token`;
      const response2 = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        agent: httpsAgent
      });

      if (!response2.ok) {
        throw new Error(`Failed to get token: ${response2.statusText}`);
      }

      const data = await response2.json();
      return data.access_token;
    }

    throw new Error(`Failed to get token: ${response.statusText}`);
  } catch (error) {
    console.error('Error getting token:', error.message);
    throw error;
  }
}

async function getKeycloakUsers(token) {
  let allUsers = [];
  let offset = 0;
  const baseUrl = process.env.KEYCLOAK_URL.replace(/\/$/, '');
  const realm = process.env.KEYCLOAK_REALM;
  let usersUrl = `${baseUrl}/admin/realms/${realm}/users`;

  while (true) {
    const url = `${usersUrl}?max=100&first=${offset}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        agent: httpsAgent
      });

      if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);

      const users = await response.json();
      if (users.length === 0) break;

      allUsers = allUsers.concat(users);
      offset += 100;
    } catch (error) {
      console.error('Error fetching users:', error.message);
      throw error;
    }
  }

  return allUsers;
}

async function main() {
  try {
    console.log('📥 Obteniendo usuarios de BD...');
    const [usuariosDB] = await db.query('SELECT id, nombre, correo FROM usuarios ORDER BY nombre ASC');
    console.log(`✅ ${usuariosDB.length} usuarios en BD\n`);

    console.log('🔐 Obteniendo token de Keycloak...');
    const token = await getAdminToken();
    console.log('✅ Token obtenido\n');

    console.log('📥 Descargando usuarios de Keycloak...');
    const keycloakUsers = await getKeycloakUsers(token);
    const usuariosKeycloak = keycloakUsers
      .filter(u => u.enabled && u.email)
      .map(u => ({
        nombre: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
        correo: u.email,
        keycloakId: u.id
      }));
    console.log(`✅ ${usuariosKeycloak.length} usuarios en Keycloak\n`);

    console.log('🔍 Haciendo match entre usuarios...\n');
    const updates = [];
    const sinMatch = [];

    for (const usuarioDB of usuariosDB) {
      let bestMatch = null;
      let bestSimilarity = 0.7;

      for (const usuarioKC of usuariosKeycloak) {
        const similarity = stringSimilarity(usuarioDB.nombre, usuarioKC.nombre);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = usuarioKC;
        }
      }

      if (bestMatch) {
        updates.push({
          id: usuarioDB.id,
          nombre: usuarioDB.nombre,
          correoAnterior: usuarioDB.correo,
          correoNuevo: bestMatch.correo,
          keycloakId: bestMatch.keycloakId,
          similarity: bestSimilarity
        });
      } else {
        sinMatch.push({
          id: usuarioDB.id,
          nombre: usuarioDB.nombre,
          correo: usuarioDB.correo
        });
      }
    }

    console.log(`✅ MATCHES: ${updates.length}`);
    console.log(`⚠️  SIN MATCH: ${sinMatch.length}\n`);

    if (updates.length === 0) {
      console.log('No hay actualizaciones disponibles');
      process.exit(0);
    }

    console.log('💾 Actualizando correos...\n');
    let actualizados = 0;
    let errores = 0;

    for (const upd of updates) {
      try {
        if (upd.correoAnterior !== upd.correoNuevo) {
          const [existing] = await db.query(
            'SELECT id FROM usuarios WHERE correo = ? AND id != ?',
            [upd.correoNuevo, upd.id]
          );

          if (existing.length > 0) {
            console.log(`⚠️  ${upd.nombre}: Correo ya existe en otro usuario`);
            errores++;
            continue;
          }

          await db.query(
            'UPDATE usuarios SET correo = ?, extra = JSON_SET(COALESCE(extra, "{}"), "$.keycloakId", ?) WHERE id = ?',
            [upd.correoNuevo, upd.keycloakId, upd.id]
          );

          console.log(`✅ ${upd.nombre}`);
          console.log(`   ${upd.correoAnterior} → ${upd.correoNuevo}`);
          actualizados++;
        }

        if ((actualizados + errores) % 10 === 0) {
          console.log(`   (${actualizados + errores}/${updates.length})\n`);
        }
      } catch (err) {
        errores++;
        console.error(`❌ ${upd.nombre}: ${err.message}`);
      }
    }

    console.log(`\n✨ Completado:`);
    console.log(`   ✅ Actualizados: ${actualizados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   ⏭️  Sin match: ${sinMatch.length}\n`);

    if (sinMatch.length > 0) {
      console.log('Sin match en Keycloak:');
      sinMatch.forEach((u, i) => {
        console.log(`${i + 1}. ${u.nombre}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
