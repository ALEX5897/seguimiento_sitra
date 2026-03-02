import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    usuario: null,
    isAuthenticated: false,
    cargando: false,
    error: null,
    permisos: {}
  }),

  getters: {
    /**
     * Obtiene el rol del usuario actual
     */
    usuarioRol: (state) => state.usuario?.rol || null,

    /**
     * Obtiene el ID del usuario actual
     */
    usuarioId: (state) => state.usuario?.id || null,

    /**
     * Obtiene el correo del usuario actual
     */
    usuarioCorreo: (state) => state.usuario?.correo || null,

    /**
     * Obtiene el nombre completo del usuario
     */
    usuarioNombre: (state) => {
      if (!state.usuario) return '';
      return `${state.usuario.nombre || ''} ${state.usuario.apellido || ''}`.trim();
    },

    /**
     * Verifica si el usuario es administrador
     */
    isAdmin: (state) => state.usuario?.rol === 'admin',

    /**
     * Verifica si el usuario es secretaria
     */
    isSecretaria: (state) => state.usuario?.rol === 'secretaria',

    /**
     * Verifica si el usuario es solo vista
     */
    isSoloVista: (state) => state.usuario?.rol === 'solo_vista',

    /**
     * Obtiene todos los permisos del usuario
     */
    usuarioPermisos: (state) => state.usuario?.permisos || {}
  },

  actions: {
    /**
     * Verifica si el usuario tiene permiso para una característica específica
     * @param {string} feature - Nombre de la característica (ej: 'usuarios', 'reportes.crear')
     * @returns {boolean}
     */
    hasPermission(feature) {
      if (!this.usuario?.rol?.permisos) return false;

      const permisos = this.usuario.rol.permisos;
      
      // Verificar permisos directos
      if (feature in permisos) {
        return permisos[feature] === true;
      }

      // Verificar permisos anidados (ej: reportes.descargar)
      const parts = feature.split('.');
      let current = permisos;

      for (const part of parts) {
        if (current[part] === true) return true;
        if (typeof current[part] === 'object') {
          current = current[part];
        } else {
          return false;
        }
      }

      return false;
    },

    /**
     * Intenta iniciar sesión con correo
     * @param {string} correo - Correo del usuario
     * @param {string|null} keyloakToken - Token de Keycloak (opcional)
     */
    async login(correo, keyloakToken = null) {
      this.cargando = true;
      this.error = null;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            correo,
            token_keycloak: keyloakToken
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al iniciar sesión');
        }

        const data = await response.json();
        
        // Guardar usuario
        this.usuario = data.usuario;
        this.isAuthenticated = true;
        this.permisos = data.usuario?.permisos || {};

        return data.usuario;
      } catch (err) {
        this.error = err.message;
        this.isAuthenticated = false;
        throw err;
      } finally {
        this.cargando = false;
      }
    },

    /**
     * Obtiene los datos del usuario autenticado (si existe)
     */
    async fetchUser() {
      this.cargando = true;
      this.error = null;

      try {
        const response = await fetch('/api/auth/usuario', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          this.usuario = data.usuario;
          this.isAuthenticated = true;
          this.permisos = data.usuario?.permisos || {};
          return data.usuario;
        } else if (response.status === 401) {
          // No autenticado - esto es normal
          this.usuario = null;
          this.isAuthenticated = false;
          return null;
        } else {
          // Otro error
          console.error('Error obteniendo usuario, status:', response.status);
          this.usuario = null;
          this.isAuthenticated = false;
          return null;
        }
      } catch (err) {
        console.error('Error en fetchUser:', err);
        this.error = err.message;
        this.usuario = null;
        this.isAuthenticated = false;
        return null;
      } finally {
        this.cargando = false;
      }
    },

    /**
     * Cierra la sesión del usuario
     */
    async logout() {
      this.cargando = true;

      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
      } catch (err) {
        console.error('Error al cerrar sesión:', err);
      } finally {
        this.usuario = null;
        this.isAuthenticated = false;
        this.permisos = {};
        this.cargando = false;
        this.error = null;
      }
    },

    /**
     * Limpia los datos del usuario
     */
    clear() {
      this.usuario = null;
      this.isAuthenticated = false;
      this.permisos = {};
      this.error = null;
      this.cargando = false;
    }
  }
});
