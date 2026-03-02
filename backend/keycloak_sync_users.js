const dotenv = require('dotenv');
const pool = require('./src/db');

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

const getDefaultRoleId = async () => {
  const [rows] = await pool.query('SELECT id FROM roles WHERE nombre = ?', ['solo_vista']);
  if (!rows.length) {
    throw new Error('No existe el rol solo_vista en la base de datos');
  }
  return rows[0].id;
};

const buildDefaultEmail = (user, defaultDomain) => {
  const domain = (defaultDomain || '').trim();
  if (!domain) {
    return null;
  }

  const base = (user.username || user.id || 'usuario')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '');

  if (!base) {
    return null;
  }

  return `${base}@${domain}`;
};

const resolveCorreo = (user, defaultDomain) => {
  if (user.email) {
    return user.email.toLowerCase();
  }
  if (user.username && user.username.includes('@')) {
    return user.username.toLowerCase();
  }
  return buildDefaultEmail(user, defaultDomain);
};

const resolveNombre = (user) => {
  if (user.firstName || user.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  return user.username || 'Usuario';
};

const splitNombreApellido = (fullName) => {
  const cleaned = (fullName || '').trim();
  if (!cleaned) {
    return { nombre: '', apellido: '' };
  }
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) {
    return { nombre: parts[0], apellido: '' };
  }
  return {
    nombre: parts.slice(0, -1).join(' '),
    apellido: parts.slice(-1).join(' ')
  };
};

const upsertUsuariosAuth = async ({ correo, keycloakId, fullName, defaultRoleId }) => {
  const { nombre, apellido } = splitNombreApellido(fullName);
  const [rows] = await pool.query(
    'SELECT id, rol_id, keycloak_id FROM usuarios_auth WHERE keycloak_id = ? OR correo = ? LIMIT 1',
    [keycloakId, correo]
  );

  if (!rows.length) {
    const [result] = await pool.query(
      'INSERT INTO usuarios_auth (correo, nombre, apellido, keycloak_id, rol_id, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [correo, nombre, apellido, keycloakId || null, defaultRoleId, 'activo']
    );
    return { created: true, id: result.insertId };
  }

  const existing = rows[0];
  await pool.query(
    'UPDATE usuarios_auth SET correo = ?, nombre = ?, apellido = ?, keycloak_id = COALESCE(keycloak_id, ?) WHERE id = ?',
    [correo, nombre, apellido, keycloakId || null, existing.id]
  );

  return { created: false, id: existing.id };
};

const ensureUsuarioNegocio = async ({ correo, fullName }) => {
  const [rows] = await pool.query('SELECT id FROM usuarios WHERE correo = ? LIMIT 1', [correo]);
  if (rows.length) {
    return { created: false, id: rows[0].id };
  }

  const nombre = resolveNombre({ firstName: fullName.split(' ')[0], lastName: fullName.split(' ').slice(1).join(' ') });
  const [result] = await pool.query(
    'INSERT INTO usuarios (nombre, correo, cargo, gerencia, telefono, estado, extra) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nombre, correo, null, null, null, 'activo', '{}']
  );
  return { created: true, id: result.insertId };
};

const main = async () => {
  const baseUrl = (process.env.KEYCLOAK_URL || 'http://localhost:8080/auth').replace(/\/$/, '');
  const realm = process.env.KEYCLOAK_REALM || 'master';
  const adminRealm = process.env.KEYCLOAK_ADMIN_REALM || 'master';
  const adminClientId = process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli';
  const adminClientSecret = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || '';
  const adminUser = process.env.KEYCLOAK_ADMIN_USER || '';
  const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || '';
  const defaultEmailDomain = process.env.KEYCLOAK_DEFAULT_EMAIL_DOMAIN || 'quito-turismo.gob.ec';

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

  const defaultRoleId = await getDefaultRoleId();

  let createdAuth = 0;
  let updatedAuth = 0;
  let createdUsuarios = 0;
  let usedDefaultEmail = 0;
  let skippedNoEmail = 0;

  for (const user of users) {
    const correo = resolveCorreo(user, defaultEmailDomain);
    if (!correo) {
      skippedNoEmail += 1;
      continue;
    }
    if (!user.email && !(user.username && user.username.includes('@'))) {
      usedDefaultEmail += 1;
    }

    const fullName = resolveNombre(user);
    const authResult = await upsertUsuariosAuth({
      correo,
      keycloakId: user.id,
      fullName,
      defaultRoleId
    });

    if (authResult.created) {
      createdAuth += 1;
    } else {
      updatedAuth += 1;
    }

    const negocioResult = await ensureUsuarioNegocio({ correo, fullName });
    if (negocioResult.created) {
      createdUsuarios += 1;
    }
  }

  console.log('✅ Sincronizacion completada.');
  console.log('   Usuarios totales en Keycloak:', users.length);
  console.log('   usuarios_auth creados:', createdAuth);
  console.log('   usuarios_auth actualizados:', updatedAuth);
  console.log('   usuarios creados:', createdUsuarios);
  console.log('   Correos por defecto asignados:', usedDefaultEmail);
  console.log('   Omitidos (sin correo):', skippedNoEmail);
};

main()
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
