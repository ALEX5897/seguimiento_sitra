import Keycloak from 'keycloak-js';

// Configuración de Keycloak para el frontend
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080/auth',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'tu-realm',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'sistra-app'
};

// Instancia de Keycloak
let keycloakInstance = null;

/**
 * Inicializa Keycloak
 * @returns {Promise<Keycloak>}
 */
export async function initKeycloak() {
  if (keycloakInstance) {
    return keycloakInstance;
  }

  keycloakInstance = new Keycloak(keycloakConfig);

  try {
    const authenticated = await keycloakInstance.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
      checkLoginIframe: false
    });

    console.log('🔐 Keycloak inicializado:', authenticated ? 'Autenticado' : 'No autenticado');

    if (authenticated) {
      // Configurar refresh token automático
      setInterval(() => {
        keycloakInstance.updateToken(70).then((refreshed) => {
          if (refreshed) {
            console.log('🔄 Token actualizado');
          }
        }).catch(() => {
          console.error('❌ Error actualizando token');
        });
      }, 60000); // Cada minuto
    }

    return keycloakInstance;
  } catch (error) {
    console.error('❌ Error inicializando Keycloak:', error);
    throw error;
  }
}

/**
 * Obtiene la instancia de Keycloak
 * @returns {Keycloak|null}
 */
export function getKeycloak() {
  return keycloakInstance;
}

/**
 * Login con Keycloak
 * @returns {Promise<void>}
 */
export async function login() {
  if (!keycloakInstance) {
    await initKeycloak();
  }
  
  return keycloakInstance.login({
    redirectUri: window.location.origin + '/dashboard'
  });
}

/**
 * Logout con Keycloak
 * @returns {Promise<void>}
 */
export async function logout() {
  if (!keycloakInstance) {
    return;
  }
  
  return keycloakInstance.logout({
    redirectUri: window.location.origin + '/login'
  });
}

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean}
 */
export function isAuthenticated() {
  return keycloakInstance?.authenticated || false;
}

/**
 * Obtiene el token de acceso
 * @returns {string|null}
 */
export function getToken() {
  return keycloakInstance?.token || null;
}

/**
 * Obtiene información del usuario
 * @returns {object|null}
 */
export function getUserInfo() {
  if (!keycloakInstance?.tokenParsed) {
    return null;
  }

  const token = keycloakInstance.tokenParsed;
  
  return {
    id: token.sub,
    username: token.preferred_username,
    email: token.email,
    firstName: token.given_name,
    lastName: token.family_name,
    roles: token.realm_access?.roles || [],
    fullName: `${token.given_name || ''} ${token.family_name || ''}`.trim()
  };
}

/**
 * Verifica si el usuario tiene un rol específico
 * @param {string} role - Nombre del rol
 * @returns {boolean}
 */
export function hasRole(role) {
  return keycloakInstance?.hasRealmRole(role) || false;
}

/**
 * Actualiza el token si es necesario
 * @param {number} minValidity - Mínima validez en segundos
 * @returns {Promise<boolean>}
 */
export function updateToken(minValidity = 70) {
  if (!keycloakInstance) {
    return Promise.resolve(false);
  }
  
  return keycloakInstance.updateToken(minValidity);
}

export default {
  initKeycloak,
  getKeycloak,
  login,
  logout,
  isAuthenticated,
  getToken,
  getUserInfo,
  hasRole,
  updateToken
};
