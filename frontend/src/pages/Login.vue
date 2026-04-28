<template>
  <div class="login-container">
    <!-- Fondo fotográfico con overlay -->
    <div class="login-bg"></div>
    <div class="login-overlay"></div>

    <!-- Contenedor principal -->
    <div class="login-wrapper">
      <!-- Encabezado del sitio -->
      <div class="site-header">
        <img
          src="https://turismo.quito.gob.ec/wp-content/uploads/2024/06/logoQT.png"
          alt="Logo Quito Turismo"
          class="header-logo"
        />
      </div>

      <!-- Caja de login -->
      <div class="login-box">
        <!-- Contenido -->
        <div class="login-box-content">
          <!-- Header con línea decorativa -->
          <div class="login-header">
            <div class="header-decoration"></div>
            <h1>Ingreso a la plataforma</h1>
            <p class="login-subtitle">Para ingresar debe utilizar su usuario del directorio activo y su respectiva clave.</p>
          </div>

          <!-- Mensajes de error -->
          <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-circle"></i> {{ error }}
            <button type="button" class="btn-close" @click="error = null"></button>
          </div>

          <!-- Mensajes de éxito -->
          <div v-if="exito" class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fas fa-check-circle"></i> {{ exito }}
          </div>

          <!-- Formulario principal -->
          <form v-if="keycloakHabilitado && metodoLogin === 'keycloak'" @submit.prevent="handleLoginKeycloak" class="login-form">
            <!-- Campo Usuario -->
            <div class="form-group">
              <label for="usuario-kc" class="form-label">Usuario</label>
              <input
                id="usuario-kc"
                v-model="formularioKeycloak.usuario"
                type="text"
                class="form-control"
                placeholder="nombre.apellido"
                required
                :disabled="cargando"
              />
            </div>

            <!-- Campo Contraseña -->
            <div class="form-group">
              <div class="form-label-row">
                <label for="contrasena-kc" class="form-label">Contraseña</label>
                <a href="#" class="forgot-password">¿Olvidó su contraseña?</a>
              </div>
              <input
                id="contrasena-kc"
                v-model="formularioKeycloak.contrasena"
                type="password"
                class="form-control"
                placeholder="••••••••"
                required
                :disabled="cargando"
              />
            </div>

            <!-- Checkbox Recuérdame -->
            <div class="form-check">
              <input
                id="remember-kc"
                v-model="recordarme"
                type="checkbox"
                class="form-check-input"
                :disabled="cargando"
              />
              <label for="remember-kc" class="form-check-label">Recuérdame</label>
            </div>

            <!-- Botón Submit -->
            <button
              type="submit"
              class="btn btn-login w-100"
              :disabled="cargando || !formularioKeycloak.usuario || !formularioKeycloak.contrasena"
            >
              <span v-if="!cargando">Iniciar sesión</span>
              <span v-else><i class="fas fa-spinner fa-spin"></i> Autenticando...</span>
            </button>

           

            <!-- Enlace a admin -->
            <div class="login-links">
              <button
                type="button"
                class="btn-link-text"
                @click="metodoLogin = 'admin'"
                :disabled="cargando"
              >
                Acceso administrador
              </button>
            </div>
          </form>

          <!-- Admin Login -->
          <form v-else-if="metodoLogin === 'admin'" @submit.prevent="handleLoginAdmin" class="login-form">
            <div class="form-group">
              <label for="usuario-admin" class="form-label">Usuario</label>
              <input
                id="usuario-admin"
                v-model="formularioAdmin.usuario"
                type="text"
                class="form-control"
                placeholder="usuario"
                required
                :disabled="cargando"
              />
            </div>

            <div class="form-group">
              <label for="contrasena-admin" class="form-label">Contraseña</label>
              <input
                id="contrasena-admin"
                v-model="formularioAdmin.contrasena"
                type="password"
                class="form-control"
                placeholder="••••••••"
                required
                :disabled="cargando"
              />
            </div>

            <button
              type="submit"
              class="btn btn-login w-100"
              :disabled="cargando || !formularioAdmin.usuario || !formularioAdmin.contrasena"
            >
              <span v-if="!cargando">Iniciar sesión</span>
              <span v-else><i class="fas fa-spinner fa-spin"></i> Autenticando...</span>
            </button>

            <div class="login-links" v-if="keycloakHabilitado">
              <button
                type="button"
                class="btn-link-text"
                @click="metodoLogin = 'keycloak'"
                :disabled="cargando"
              >
                ← Volver
              </button>
            </div>
          </form>

          <!-- Login por email -->
          <form v-else @submit.prevent="handleLoginEmail" class="login-form">
            <div class="form-group">
              <label for="correo" class="form-label">Correo Electrónico</label>
              <input
                id="correo"
                v-model="formulario.correo"
                type="email"
                class="form-control"
                placeholder="tu.correo@empresa.com"
                required
                :disabled="cargando"
              />
            </div>

            <button
              type="submit"
              class="btn btn-login w-100"
              :disabled="cargando || !formulario.correo"
            >
              <span v-if="!cargando">Iniciar sesión</span>
              <span v-else><i class="fas fa-spinner fa-spin"></i> Autenticando...</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/authStore'
import api from '../api'

export default {
  name: 'Login',
  setup() {
    return {
      authStore: useAuthStore()
    }
  },
  data() {
    return {
      formulario: {
        correo: ''
      },
      formularioAdmin: {
        usuario: '',
        contrasena: ''
      },
      formularioKeycloak: {
        usuario: '',
        contrasena: ''
      },
      recordarme: false,
      metodoLogin: 'keycloak',
      keycloakHabilitado: false,
      cargando: false,
      error: null,
      exito: null
    };
  },
  async mounted() {
    if (this.authStore.isAuthenticated) {
      this.$router.push('/dashboard');
      return;
    }

    await this.verificarKeycloak();
  },
  methods: {
    async verificarKeycloak() {
      try {
        const response = await api.get('/auth/config');
        this.keycloakHabilitado = response.data.keycloakEnabled || false;
        if (!this.keycloakHabilitado) {
          this.metodoLogin = 'email';
        }
      } catch (err) {
        console.error('Error al verificar Keycloak:', err);
        this.keycloakHabilitado = false;
        this.metodoLogin = 'email';
      }
    },

    async handleLoginKeycloak() {
      this.cargando = true;
      this.error = null;
      this.exito = null;

      try {
        await this.authStore.loginConKeycloakDirecto(
          this.formularioKeycloak.usuario,
          this.formularioKeycloak.contrasena
        );

        this.exito = '¡Bienvenido! Redirigiendo...';

        setTimeout(() => {
          this.$router.push('/dashboard');
        }, 1000);
      } catch (err) {
        this.error = err.message || 'Credenciales inválidas. Intenta nuevamente.';
      } finally {
        this.cargando = false;
      }
    },

    async handleLoginEmail() {
      this.cargando = true;
      this.error = null;
      this.exito = null;

      try {
        await this.authStore.login(this.formulario.correo, null);

        this.exito = '¡Bienvenido! Redirigiendo...';

        setTimeout(() => {
          this.$router.push('/dashboard');
        }, 1000);
      } catch (err) {
        this.error = err.message || 'Error al iniciar sesión. Intenta nuevamente.';
      } finally {
        this.cargando = false;
      }
    },

    async handleLoginAdmin() {
      this.cargando = true;
      this.error = null;
      this.exito = null;

      try {
        const response = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            usuario: this.formularioAdmin.usuario,
            contrasena: this.formularioAdmin.contrasena
          })
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Usuario o contraseña incorrectos');
        }

        const data = await response.json();

        this.authStore.usuario = data.usuario;
        this.authStore.isAuthenticated = true;
        this.authStore.permisos = data.usuario?.permisos || {};

        this.exito = '¡Bienvenido! Redirigiendo...';

        setTimeout(() => {
          this.$router.push('/dashboard');
        }, 1000);
      } catch (err) {
        this.error = err.message || 'Error al iniciar sesión. Intenta nuevamente.';
      } finally {
        this.cargando = false;
      }
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:global(html, body) {
  height: 100%;
  margin: 0;
  overflow: hidden;
}

:global(#app) {
  height: 100%;
}

.login-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 0;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.login-bg {
  position: absolute;
  inset: 0;
  background-image: url('https://as2.ftcdn.net/v2/jpg/01/70/03/67/1000_F_170036772_vOispQGM35tY2nN0PVluT6PgQd8NttZe.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

.login-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 1;
}

.login-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 600px;
  width: 90%;
  position: relative;
  z-index: 10;
  gap: 30px;
}

.site-header {
  text-align: center;
  color: white;
  margin-bottom: 0;
}

.header-logo {
  width: 290px;
  max-width: 100%;
  margin-bottom: 12px;
  object-fit: contain;
  filter: brightness(1.1);
}

.site-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.login-box {
  background: #f3f0f0;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideInUp 0.5s ease-out;
  width: 100%;
  max-width: 403px;
}

.login-box-content {
  padding: 40px 40px;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header de login */
.login-header {
  text-align: left;
  margin-bottom: 32px;
  padding-bottom: 0;
}

.header-decoration {
  width: 60px;
  height: 5px;
  background: linear-gradient(90deg, #FF6B35 0%, #FF9800 100%);
  border-radius: 3px;
  margin-bottom: 14px;
}

.login-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 10px 0;
  letter-spacing: -0.5px;
}

.login-subtitle {
  font-size: 15px;
  color: #666;
  margin: 0;
  line-height: 1.6;
  font-weight: 400;
}

/* Formulario */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.form-label {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 14px;
  margin: 0;
  display: block;
}

.forgot-password {
  font-size: 13px;
  color: #FF6B35;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.forgot-password:hover {
  color: #E55A25;
  text-decoration: underline;
}

.form-control {
  padding: 16px 18px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: white;
  font-family: inherit;
  font-weight: 400;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.form-control:focus {
  outline: none;
  border-color: #34446C;
  background: white;
  box-shadow: 0 4px 16px rgba(52, 68, 108, 0.12);
}

.form-control::placeholder {
  color: #b0b0b0;
  font-weight: 400;
}

.form-control:disabled {
  background: #f9f9f9;
  cursor: not-allowed;
  color: #999;
  border-color: #e5e5e5;
}

/* Checkbox */
.form-check {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0 0 0;
}

.form-check-input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #34446C;
  flex-shrink: 0;
}

.form-check-label {
  cursor: pointer;
  font-size: 14px;
  color: #555;
  user-select: none;
  margin: 0;
  font-weight: 500;
}

/* Alertas */
.alert {
  padding: 12px 14px;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  animation: slideDown 0.3s ease-out;
  margin-bottom: 18px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-danger {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: inherit;
  padding: 0;
  margin-left: auto;
  flex-shrink: 0;
}

/* Botón de login */
.btn-login {
  padding: 14px 24px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  background: #34446C;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
  box-shadow: 0 6px 20px rgba(52, 68, 108, 0.25);
  letter-spacing: 0.3px;
}

.btn-login:hover:not(:disabled) {
  background: #2a365c;
  box-shadow: 0 10px 30px rgba(52, 68, 108, 0.4);
  transform: translateY(-3px);
}

.btn-login:active:not(:disabled) {
  background: #1f264a;
  transform: translateY(-1px);
}

.btn-login:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Botón de soporte */
.btn-support {
  padding: 14px 20px;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid #34446C;
  border-radius: 12px;
  background: transparent;
  color: #34446C;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.btn-support:hover {
  background: rgba(52, 68, 108, 0.08);
  border-color: #2a365c;
  color: #2a365c;
}

.btn-support:active {
  background: rgba(52, 68, 108, 0.15);
}

/* Botones de enlace */
.login-links {
  text-align: center;
  padding-top: 10px;
}

.btn-link-text {
  background: none;
  border: none;
  padding: 0;
  color: #34446C;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-link-text:hover:not(:disabled) {
  color: #FF6B35;
  text-decoration: underline;
}

.btn-link-text:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-content {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Divider */


/* Footer de login */
.login-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.login-footer .text-muted {
  color: #999;
  font-size: 12px;
  margin: 0;
}

/* Responsivo - Tablet */
@media (max-width: 768px) {
  .login-wrapper {
    gap: 28px;
    width: 95%;
  }

  .site-header {
    margin-bottom: 0;
  }

  .header-logo {
    width: 242px;
    margin-bottom: 10px;
  }

  .site-title {
    font-size: 16px;
  }

  .login-box {
    border-radius: 22px;
    max-width: 370px;
  }

  .login-box-content {
    padding: 35px 32px;
  }

  .login-header {
    margin-bottom: 28px;
  }

  .login-header h1 {
    font-size: 28px;
    margin-bottom: 14px;
  }

  .login-subtitle {
    font-size: 14px;
  }

  .form-control {
    padding: 14px 16px;
    font-size: 14px;
    border-radius: 11px;
  }

  .btn-login {
    padding: 15px 20px;
    font-size: 14px;
    border-radius: 11px;
  }

  .btn-support {
    padding: 13px 18px;
    font-size: 13px;
    border-radius: 11px;
  }

  .form-label {
    font-size: 13px;
  }

  .login-form {
    gap: 16px;
  }
}

/* Responsivo - Mobile */
@media (max-width: 480px) {
  .login-wrapper {
    width: 100%;
    padding: 0 16px;
    gap: 24px;
  }

  .site-title {
    font-size: 14px;
  }

  .header-logo {
    width: 169px;
  }

  .login-box {
    border-radius: 20px;
    max-width: 100%;
  }

  .login-box-content {
    padding: 30px 20px;
  }

  .login-header {
    margin-bottom: 22px;
  }

  .header-decoration {
    width: 50px;
    margin-bottom: 12px;
  }

  .login-header h1 {
    font-size: 24px;
    margin-bottom: 12px;
  }

  .login-subtitle {
    font-size: 13px;
  }

  .form-control {
    padding: 13px 14px;
    font-size: 13px;
    border-radius: 10px;
  }

  .btn-login {
    padding: 14px 18px;
    font-size: 13px;
    border-radius: 10px;
    margin-top: 6px;
  }

  .btn-support {
    padding: 12px 16px;
    font-size: 12px;
    border-radius: 10px;
  }

  .form-label {
    font-size: 12px;
  }

  .login-form {
    gap: 14px;
  }

  .form-check {
    gap: 10px;
  }
}
</style>
