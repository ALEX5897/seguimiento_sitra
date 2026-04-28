require('dotenv').config();
const db = require('./db');
const https = require('https');

// Desabilitar verificación de SSL para desarrollo (si es necesario)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * Normaliza un nombre para comparación
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // Remover acentos
}

/**
 * Calcula similitud entre dos strings
 */
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

/**
 * Calcula distancia de Levenshtein
 */
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

/**
 * Obtiene token de Keycloak (maneja Keycloak 17+ sin /auth)
 */
async function getAdminToken() {
  const baseUrl = process.env.KEYCLOAK_URL.replace(/\/$/, ''); // Remove trailing slash
  const realm = process.env.KEYCLOAK_REALM || 'master';
  const clientId = process.env.KEYCLOAK_CLIENT_ID || 'admin-cli';
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  let tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;

  console.log(`🔐 Intentando obtener token de: ${tokenUrl}`);

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

    // Si falla, intentar con /auth (Keycloak antiguo)
    if (response.status === 404 || response.status === 401) {
      console.log('⚠️  Intentando con URL alternativa (con /auth)...');
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
    console.error('❌ Error en autenticación:', error.message);
    throw error;
  }
}

/**
 * Obtiene usuarios de Keycloak
 */
async function getKeycloakUsers(token) {
  let allUsers = [];
  let offset = 0;
  const baseUrl = process.env.KEYCLOAK_URL.replace(/\/$/, '');
  const realm = process.env.KEYCLOAK_REALM;
  let usersUrl = `${baseUrl}/admin/realms/${realm}/users`;

  console.log(`📥 Obteniendo usuarios de: ${usersUrl}`);

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
      console.log(`   Descargado lote: ${allUsers.length} usuarios...`);
    } catch (error) {
      console.error('Error fetching users:', error.message);
      throw error;
    }
  }

  return allUsers;
}

/**
 * Extrae atributos de un usuario de Keycloak
 */
function extractKeycloakUserInfo(keycloakUser) {
  const attributes = keycloakUser.attributes || {};
  const nombre = `${keycloakUser.firstName || ''} ${keycloakUser.lastName || ''}`.trim() || keycloakUser.username;

  return {
    keycloakId: keycloakUser.id,
    nombre,
    correo: keycloakUser.email,
    cargo: attributes.cargo?.[0] || null,
    gerencia: attributes.gerencia?.[0] || null,
    telefono: attributes.telefono?.[0] || null,
    enabled: keycloakUser.enabled
  };
}

/**
 * Script principal
 */
async function main() {
  try {
    console.log('\n📊 Iniciando sincronización y match de usuarios...\n');

    if (process.env.KEYCLOAK_ENABLED !== 'true') {
      console.error('❌ Keycloak está deshabilitado. Actívalo en .env');
      process.exit(1);
    }

    // 1. Obtener usuarios de la BD actual
    console.log('📥 Obteniendo usuarios de la base de datos...');
    const [usuariosDB] = await db.query('SELECT id, nombre, correo, cargo, gerencia, telefono, estado FROM usuarios ORDER BY nombre ASC');
    console.log(`✅ ${usuariosDB.length} usuarios en la BD\n`);

    // 2. Obtener token de Keycloak
    console.log('🔐 Obteniendo token de Keycloak...');
    const token = await getAdminToken();
    console.log('✅ Token obtenido\n');

    // 3. Obtener usuarios de Keycloak
    console.log('📥 Descargando usuarios de Keycloak...');
    const keycloakUsers = await getKeycloakUsers(token);
    const usuariosKeycloak = keycloakUsers
      .filter(u => u.enabled && u.email)
      .map(extractKeycloakUserInfo);
    console.log(`✅ ${usuariosKeycloak.length} usuarios activos en Keycloak\n`);

    // 4. Hacer match entre usuarios
    console.log('🔍 Haciendo match entre usuarios...\n');
    const matches = [];
    const noMatches = [];

    for (const usuarioDB of usuariosDB) {
      let bestMatch = null;
      let bestSimilarity = 0.6; // Umbral de similitud (60%)

      for (const usuarioKC of usuariosKeycloak) {
        const similarity = stringSimilarity(usuarioDB.nombre, usuarioKC.nombre);

        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = usuarioKC;
        }
      }

      if (bestMatch) {
        matches.push({
          idDB: usuarioDB.id,
          nombreDB: usuarioDB.nombre,
          correoActual: usuarioDB.correo,
          nombreKC: bestMatch.nombre,
          correoNuevo: bestMatch.correo,
          similarity: (bestSimilarity * 100).toFixed(1),
          cargo: bestMatch.cargo || usuarioDB.cargo,
          gerencia: bestMatch.gerencia || usuarioDB.gerencia,
          telefono: bestMatch.telefono || usuarioDB.telefono,
          keycloakId: bestMatch.keycloakId
        });
      } else {
        noMatches.push({
          idDB: usuarioDB.id,
          nombre: usuarioDB.nombre,
          correo: usuarioDB.correo
        });
      }
    }

    // 5. Mostrar resultados del match
    console.log(`✅ MATCHES ENCONTRADOS: ${matches.length}\n`);
    console.log('┌─ USUARIOS CON MATCH ────────────────────────────────────────────┐');
    matches.forEach((m, i) => {
      console.log(`│ ${i + 1}. ${m.nombreDB}`);
      console.log(`│    Similitud: ${m.similarity}%`);
      console.log(`│    Correo actual: ${m.correoActual}`);
      console.log(`│    Correo nuevo: ${m.correoNuevo}`);
      if (m.cargo) console.log(`│    Cargo: ${m.cargo}`);
      if (m.gerencia) console.log(`│    Gerencia: ${m.gerencia}`);
      console.log('│');
    });
    console.log('└──────────────────────────────────────────────────────────────────┘\n');

    if (noMatches.length > 0) {
      console.log(`⚠️  SIN MATCH: ${noMatches.length}\n`);
      noMatches.forEach((m, i) => {
        console.log(`${i + 1}. ${m.nombre} (${m.correo})`);
      });
      console.log('\n');
    }

    // 6. Actualizar correos en la BD
    console.log('💾 Actualizando correos en la base de datos...\n');
    let actualizados = 0;
    let errores = 0;

    for (const match of matches) {
      try {
        // Verificar que el correo nuevo no está duplicado
        const [existing] = await db.query(
          'SELECT id FROM usuarios WHERE correo = ? AND id != ?',
          [match.correoNuevo, match.idDB]
        );

        if (existing.length > 0) {
          console.log(`⚠️  ${match.nombreDB}: Correo ${match.correoNuevo} ya existe en otro usuario`);
          errores++;
          continue;
        }

        // Actualizar usuario
        await db.query(
          `UPDATE usuarios
           SET correo = ?, cargo = ?, gerencia = ?, telefono = ?, extra = ?
           WHERE id = ?`,
          [
            match.correoNuevo,
            match.cargo,
            match.gerencia,
            match.telefono,
            JSON.stringify({
              keycloakId: match.keycloakId,
              syncedAt: new Date().toISOString()
            }),
            match.idDB
          ]
        );

        console.log(`✅ ${match.nombreDB}`);
        console.log(`   ${match.correoActual} → ${match.correoNuevo}`);
        actualizados++;

        if (actualizados % 10 === 0) {
          console.log(`   (${actualizados}/${matches.length} procesados...)\n`);
        }
      } catch (err) {
        errores++;
        console.error(`❌ Error actualizando ${match.nombreDB}:`, err.message);
      }
    }

    console.log(`\n✨ Actualización completada:`);
    console.log(`   ✅ Actualizados: ${actualizados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   ⏭️  Sin match: ${noMatches.length}\n`);

    // 7. Sincronizar usuarios nuevos de Keycloak
    console.log('🔄 Sincronizando usuarios nuevos de Keycloak...\n');
    let insertados = 0;
    let skippeados = 0;

    for (const usuarioKC of usuariosKeycloak) {
      // Verificar si ya existe
      const [existing] = await db.query(
        'SELECT id FROM usuarios WHERE correo = ?',
        [usuarioKC.correo]
      );

      if (existing.length > 0) {
        skippeados++;
        continue;
      }

      try {
        await db.query(
          `INSERT INTO usuarios (nombre, correo, cargo, gerencia, telefono, estado, extra)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            usuarioKC.nombre,
            usuarioKC.correo,
            usuarioKC.cargo,
            usuarioKC.gerencia,
            usuarioKC.telefono,
            'activo',
            JSON.stringify({
              keycloakId: usuarioKC.keycloakId,
              syncedAt: new Date().toISOString()
            })
          ]
        );

        console.log(`✅ Insertado: ${usuarioKC.nombre} (${usuarioKC.correo})`);
        insertados++;

        if (insertados % 10 === 0) {
          console.log(`   (${insertados} nuevos usuarios insertados...)\n`);
        }
      } catch (err) {
        console.error(`❌ Error insertando ${usuarioKC.nombre}:`, err.message);
      }
    }

    console.log(`\n✨ Inserción de nuevos usuarios completada:`);
    console.log(`   ✅ Insertados: ${insertados}`);
    console.log(`   ⏭️  Ya existían: ${skippeados}\n`);

    // 8. Resumen final
    const [usuariosDBFinal] = await db.query('SELECT COUNT(*) as total FROM usuarios');
    const [porEstado] = await db.query(
      'SELECT estado, COUNT(*) as cantidad FROM usuarios GROUP BY estado'
    );
    const [porGerencia] = await db.query(
      'SELECT gerencia, COUNT(*) as cantidad FROM usuarios WHERE gerencia IS NOT NULL GROUP BY gerencia ORDER BY cantidad DESC LIMIT 5'
    );

    console.log('📊 RESUMEN FINAL:');
    console.log(`   Total usuarios en BD: ${usuariosDBFinal[0].total}`);
    console.log(`   Estado:`);
    porEstado.forEach(row => {
      console.log(`      - ${row.estado}: ${row.cantidad}`);
    });
    console.log(`\n   Top 5 gerencias:`);
    porGerencia.forEach(row => {
      console.log(`      - ${row.gerencia}: ${row.cantidad}`);
    });

    console.log('\n✅ ¡Sincronización completada exitosamente!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
