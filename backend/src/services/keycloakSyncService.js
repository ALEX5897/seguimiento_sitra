const db = require('../db');

/**
 * Obtiene un token de acceso de Keycloak con credenciales de cliente
 */
async function getAdminToken() {
  const tokenUrl = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.KEYCLOAK_CLIENT_ID);
  params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET);

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('❌ Error obteniendo token de Keycloak:', error.message);
    throw error;
  }
}

/**
 * Obtiene todos los usuarios de Keycloak
 */
async function getKeycloakUsers(token, limit = 100, offset = 0) {
  const usersUrl = `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users?max=${limit}&first=${offset}`;

  try {
    const response = await fetch(usersUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const users = await response.json();
    return users;
  } catch (error) {
    console.error('❌ Error obteniendo usuarios de Keycloak:', error.message);
    throw error;
  }
}

/**
 * Obtiene los atributos personalizados de un usuario en Keycloak
 */
function extractUserAttributes(keycloakUser) {
  const attributes = keycloakUser.attributes || {};

  return {
    cargo: attributes.cargo?.[0] || null,
    gerencia: attributes.gerencia?.[0] || null,
    telefono: attributes.telefono?.[0] || null,
    keycloakId: keycloakUser.id
  };
}

/**
 * Sincroniza usuarios de Keycloak con la base de datos
 */
async function syncKeycloakUsers() {
  try {
    if (process.env.KEYCLOAK_ENABLED !== 'true') {
      console.log('ℹ️  Keycloak deshabilitado - saltando sincronización');
      return { skipped: true, reason: 'Keycloak disabled' };
    }

    console.log('\n🔄 Iniciando sincronización de usuarios desde Keycloak...');

    // Obtener token de admin
    const token = await getAdminToken();
    console.log('✅ Token de Keycloak obtenido');

    let allUsers = [];
    let offset = 0;
    let batchCount = 0;

    // Obtener todos los usuarios paginados
    while (true) {
      const batch = await getKeycloakUsers(token, 100, offset);
      if (batch.length === 0) break;

      allUsers = allUsers.concat(batch);
      offset += 100;
      batchCount++;
      console.log(`📥 Lote ${batchCount}: ${batch.length} usuarios descargados (total: ${allUsers.length})`);
    }

    console.log(`✅ Total de usuarios descargados: ${allUsers.length}`);

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    // Sincronizar cada usuario
    for (const keycloakUser of allUsers) {
      try {
        // Solo procesar usuarios habilitados
        if (!keycloakUser.enabled) {
          continue;
        }

        const nombre = `${keycloakUser.firstName || ''} ${keycloakUser.lastName || ''}`.trim()
          || keycloakUser.username;
        const correo = keycloakUser.email;

        // No sincronizar usuarios sin correo
        if (!correo) {
          continue;
        }

        const attrs = extractUserAttributes(keycloakUser);
        const extra = JSON.stringify({
          keycloakId: attrs.keycloakId,
          syncedAt: new Date().toISOString()
        });

        // Usar INSERT ... ON DUPLICATE KEY UPDATE para sincronizar
        const [result] = await db.query(
          `INSERT INTO usuarios (nombre, correo, cargo, gerencia, telefono, estado, extra)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             nombre = VALUES(nombre),
             cargo = VALUES(cargo),
             gerencia = VALUES(gerencia),
             telefono = VALUES(telefono),
             estado = 'activo',
             extra = VALUES(extra)`,
          [
            nombre,
            correo,
            attrs.cargo,
            attrs.gerencia,
            attrs.telefono,
            'activo',
            extra
          ]
        );

        if (result.affectedRows === 1) {
          inserted++;
        } else if (result.affectedRows === 2) {
          updated++;
        }

        if ((inserted + updated) % 20 === 0) {
          console.log(`⏳ Procesados: ${inserted + updated} usuarios...`);
        }
      } catch (err) {
        errors++;
        console.error(`⚠️  Error sincronizando usuario ${keycloakUser.username}:`, err.message);
      }
    }

    console.log(`\n✨ Sincronización completada:`);
    console.log(`   ✅ Insertados: ${inserted}`);
    console.log(`   🔄 Actualizados: ${updated}`);
    console.log(`   ❌ Errores: ${errors}`);

    return {
      success: true,
      inserted,
      updated,
      errors,
      totalProcessed: inserted + updated + errors
    };
  } catch (error) {
    console.error('❌ Error en sincronización de Keycloak:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getAdminToken,
  getKeycloakUsers,
  extractUserAttributes,
  syncKeycloakUsers
};
