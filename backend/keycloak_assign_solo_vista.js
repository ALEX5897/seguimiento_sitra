const dotenv = require('dotenv');

dotenv.config();

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`HTTP ${response.status} ${response.statusText} - ${text}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

const getAdminToken = async ({ baseUrl, realm, clientId, clientSecret, username, password }) => {
  const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    username,
    password
  });

  if (clientSecret) {
    body.append('client_secret', clientSecret);
  }

  const tokenResponse = await fetchJson(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  return tokenResponse.access_token;
};

const getAllUsers = async ({ baseUrl, realm, token }) => {
  const users = [];
  let first = 0;
  const max = 100;

  while (true) {
    const url = `${baseUrl}/admin/realms/${realm}/users?first=${first}&max=${max}&briefRepresentation=true`;
    const batch = await fetchJson(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!batch.length) {
      break;
    }

    users.push(...batch);
    first += max;
  }

  return users;
};

const getRealmRole = async ({ baseUrl, realm, token, roleName }) => {
  const url = `${baseUrl}/admin/realms/${realm}/roles/${encodeURIComponent(roleName)}`;
  return fetchJson(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

const createRealmRole = async ({ baseUrl, realm, token, roleName }) => {
  const url = `${baseUrl}/admin/realms/${realm}/roles`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: roleName,
      description: 'Rol creado automaticamente para asignacion por defecto'
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`No se pudo crear el rol: HTTP ${response.status} ${response.statusText} - ${text}`);
  }
};

const getUserRealmRoles = async ({ baseUrl, realm, token, userId }) => {
  const url = `${baseUrl}/admin/realms/${realm}/users/${userId}/role-mappings/realm`;
  return fetchJson(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

const addRoleToUser = async ({ baseUrl, realm, token, userId, role }) => {
  const url = `${baseUrl}/admin/realms/${realm}/users/${userId}/role-mappings/realm`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([role])
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`No se pudo asignar rol: HTTP ${response.status} ${response.statusText} - ${text}`);
  }
};

const main = async () => {
  const baseUrl = (process.env.KEYCLOAK_URL || 'http://localhost:8080/auth').replace(/\/$/, '');
  const realm = process.env.KEYCLOAK_REALM || 'master';
  const adminRealm = process.env.KEYCLOAK_ADMIN_REALM || 'master';
  const adminClientId = process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli';
  const adminClientSecret = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || '';
  const adminUser = process.env.KEYCLOAK_ADMIN_USER || '';
  const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || '';

  const roleAdmin = process.env.KEYCLOAK_ROLE_ADMIN || 'admin';
  const roleSecretaria = process.env.KEYCLOAK_ROLE_SECRETARIA || 'secretaria';
  const roleSoloVista = process.env.KEYCLOAK_ROLE_SOLO_VISTA || 'empleado';
  const assignAll = process.env.KEYCLOAK_ASSIGN_ALL === 'true';
  const includeDisabled = process.env.KEYCLOAK_INCLUDE_DISABLED === 'true';

  if (!adminUser || !adminPassword) {
    throw new Error('Faltan KEYCLOAK_ADMIN_USER o KEYCLOAK_ADMIN_PASSWORD en el .env');
  }

  console.log('🔐 Autenticando en Keycloak...');
  const token = await getAdminToken({
    baseUrl,
    realm: adminRealm,
    clientId: adminClientId,
    clientSecret: adminClientSecret,
    username: adminUser,
    password: adminPassword
  });

  console.log('📥 Obteniendo usuarios del realm:', realm);
  const users = await getAllUsers({ baseUrl, realm, token });

  if (!users.length) {
    console.log('⚠️  No se encontraron usuarios en el realm.');
    return;
  }

  let soloVistaRole;
  try {
    soloVistaRole = await getRealmRole({ baseUrl, realm, token, roleName: roleSoloVista });
  } catch (error) {
    if (error.status === 404) {
      console.log(`⚠️  Rol '${roleSoloVista}' no existe. Creandolo...`);
      await createRealmRole({ baseUrl, realm, token, roleName: roleSoloVista });
      soloVistaRole = await getRealmRole({ baseUrl, realm, token, roleName: roleSoloVista });
      console.log(`✅ Rol '${roleSoloVista}' creado.`);
    } else {
      throw error;
    }
  }
  const systemRoles = new Set([roleAdmin, roleSecretaria, roleSoloVista]);

  let assigned = 0;
  let skipped = 0;
  let skippedDisabled = 0;
  let skippedNotFound = 0;

  for (const user of users) {
    if (!includeDisabled && user.enabled === false) {
      skippedDisabled += 1;
      continue;
    }

    try {
      const userRoles = await getUserRealmRoles({ baseUrl, realm, token, userId: user.id });
      const userRoleNames = new Set(userRoles.map((role) => role.name));

      const hasSystemRole = [...systemRoles].some((role) => userRoleNames.has(role));
      const alreadyHasSoloVista = userRoleNames.has(roleSoloVista);

      if (!assignAll && hasSystemRole) {
        skipped += 1;
        continue;
      }

      if (alreadyHasSoloVista) {
        skipped += 1;
        continue;
      }

      await addRoleToUser({ baseUrl, realm, token, userId: user.id, role: soloVistaRole });
      assigned += 1;
    } catch (error) {
      if (error.status === 404) {
        skippedNotFound += 1;
        const identifier = user.username || user.email || user.id;
        console.warn(`⚠️  Usuario no encontrado al asignar rol: ${identifier}`);
        continue;
      }
      throw error;
    }
  }

  console.log('✅ Asignacion completada.');
  console.log('   Usuarios totales:', users.length);
  console.log('   Roles asignados:', assigned);
  console.log('   Omitidos por rol:', skipped);
  console.log('   Omitidos (deshabilitados):', skippedDisabled);
  console.log('   Omitidos (no encontrados):', skippedNotFound);
};

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
