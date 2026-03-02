const Keycloak = require('keycloak-connect');

/**
 * Configuración de Keycloak
 */
const keycloakConfig = {
  realm: process.env.KEYCLOAK_REALM || 'master',
  'auth-server-url': process.env.KEYCLOAK_URL || 'http://localhost:8080/auth',
  'ssl-required': 'external',
  resource: process.env.KEYCLOAK_CLIENT_ID || 'sistra-app',
  'confidential-port': parseInt(process.env.KEYCLOAK_CONFIDENTIAL_PORT) || 0,
  credentials: {
    secret: process.env.KEYCLOAK_CLIENT_SECRET || ''
  },
  'verify-token-audience': process.env.KEYCLOAK_VERIFY_TOKEN_AUDIENCE === 'true',
  'use-resource-role-mappings': true
};

let keycloakInstance = null;

/**
 * Inicializa Keycloak con la sesión de Express
 * @param {object} memoryStore - Store de sesión de Express
 * @returns {Keycloak} Instancia de Keycloak
 */
function initKeycloak(memoryStore) {
  if (keycloakInstance) {
    console.log('⚠️  Keycloak ya está inicializado');
    return keycloakInstance;
  }

  keycloakInstance = new Keycloak({ store: memoryStore }, keycloakConfig);
  
  console.log('🔐 Keycloak inicializado:');
  console.log('   Realm:', keycloakConfig.realm);
  console.log('   Server:', keycloakConfig['auth-server-url']);
  console.log('   Client:', keycloakConfig.resource);
  
  return keycloakInstance;
}

/**
 * Obtiene la instancia de Keycloak
 * @returns {Keycloak|null}
 */
function getKeycloak() {
  return keycloakInstance;
}

/**
 * Verifica si Keycloak está habilitado
 * @returns {boolean}
 */
function isKeycloakEnabled() {
  return process.env.KEYCLOAK_ENABLED === 'true';
}

/**
 * Extrae información del usuario desde el token de Keycloak
 * @param {object} kauth - Objeto de autenticación de Keycloak
 * @returns {object} Información del usuario
 */
function extractUserInfo(kauth) {
  const token = kauth.grant.access_token;
  
  return {
    id: token.content.sub,
    username: token.content.preferred_username,
    email: token.content.email,
    firstName: token.content.given_name,
    lastName: token.content.family_name,
    roles: token.content.realm_access?.roles || [],
    groups: token.content.groups || []
  };
}

/**
 * Mapea roles de Keycloak a roles del sistema
 * @param {Array} keycloakRoles - Roles desde Keycloak
 * @returns {string} Rol del sistema (admin, secretaria, solo_vista)
 */
function mapKeycloakRoleToSystemRole(keycloakRoles) {
  const adminRole = process.env.KEYCLOAK_ROLE_ADMIN || 'admin';
  const secretariaRole = process.env.KEYCLOAK_ROLE_SECRETARIA || 'secretaria';
  const soloVistaRole = process.env.KEYCLOAK_ROLE_SOLO_VISTA || 'empleado';

  if (keycloakRoles.includes(adminRole)) {
    return 'admin';
  }
  
  if (keycloakRoles.includes(secretariaRole)) {
    return 'secretaria';
  }
  
  if (keycloakRoles.includes(soloVistaRole)) {
    return 'solo_vista';
  }

  // Por defecto, asignar solo_vista
  return 'solo_vista';
}

/**
 * Middleware para verificar si el usuario tiene un rol específico
 * @param {string[]} allowedRoles - Roles permitidos
 * @returns {Function} Middleware
 */
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session?.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userRole = req.session.usuario.rol;
    
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({ error: 'Sin permisos suficientes' });
  };
}

/**
 * Obtiene la URL de login de Keycloak
 * @param {string} redirectUri - URL de redirección después del login
 * @returns {string} URL de login
 */
function getLoginUrl(redirectUri) {
  const baseUrl = keycloakConfig['auth-server-url'];
  const realm = keycloakConfig.realm;
  const clientId = keycloakConfig.resource;
  
  return `${baseUrl}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid`;
}

/**
 * Obtiene la URL de logout de Keycloak
 * @param {string} redirectUri - URL de redirección después del logout
 * @returns {string} URL de logout
 */
function getLogoutUrl(redirectUri) {
  const baseUrl = keycloakConfig['auth-server-url'];
  const realm = keycloakConfig.realm;
  
  return `${baseUrl}/realms/${realm}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/**
 * Intercambia un código de autorización por tokens de Keycloak
 * @param {string} code - Código de autorización
 * @param {string} redirectUri - URI de redirección (debe ser igual al usado en login)
 * @returns {Promise<object>} Tokens de Keycloak
 */
async function exchangeCodeForToken(code, redirectUri) {
  const baseUrl = keycloakConfig['auth-server-url'];
  const realm = keycloakConfig.realm;
  const clientId = keycloakConfig.resource;
  
  const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', clientId);
  params.append('code', code);
  params.append('redirect_uri', redirectUri);
  
  // Si hay secret, incluirlo
  if (keycloakConfig.credentials?.secret) {
    params.append('client_secret', keycloakConfig.credentials.secret);
  }
  
  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error intercambiando código por token:', error);
      throw new Error(`Token exchange failed: ${error}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error en intercambio de token:', error.message);
    throw error;
  }
}

module.exports = {
  initKeycloak,
  getKeycloak,
  isKeycloakEnabled,
  extractUserInfo,
  mapKeycloakRoleToSystemRole,
  checkRole,
  getLoginUrl,
  getLogoutUrl,
  exchangeCodeForToken,
  keycloakConfig
};
