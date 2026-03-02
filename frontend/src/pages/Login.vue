<template>
  <div class="login-container" :style="{ backgroundImage: `url('${fondoImg}')` }">
    <!-- Contenedor principal -->
    <div class="login-wrapper">
      <div class="login-box">
        <!-- Logo/Header -->
        <div class="login-header">
          <div class="logo-icon">
            <i class="fas fa-lock"></i>
          </div>
       <!--<h1>SISTRA</h1>--> 

<img 
  :src="logoQT"
  alt="Logo QT"
  class="logo-img"
/>

<p class="tagline">Sistema de Asignación de Memos</p>
        </div>

        <!-- Formulario de Login -->
        <div class="login-form">
          <!-- Mensajes de error -->
          <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-circle"></i> {{ error }}
            <button type="button" class="btn-close" @click="error = null"></button>
          </div>

          <!-- Mensajes de éxito -->
          <div v-if="exito" class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fas fa-check-circle"></i> {{ exito }}
          </div>

          <!-- Login con Keycloak (si está habilitado) -->
          <div v-if="keycloakHabilitado">
            <p class="login-type-label">Elige tu tipo de usuario</p>
            <!-- Tabs para seleccionar método de login -->
            <div class="login-tabs">
              <button
                type="button"
                :class="['tab-btn', { active: metodoLogin === 'keycloak' }]"
                @click="metodoLogin = 'keycloak'; loginConKeycloak()"
              >
                <i class="fas fa-users"></i> Usuario Normal
              </button>
              <button
                type="button"
                :class="['tab-btn', { active: metodoLogin === 'admin' }]"
                @click="metodoLogin = 'admin'"
              >
                <i class="fas fa-user-shield"></i> Admin
              </button>
            </div>

            <!-- Opción 2: Admin Login -->
            <form v-if="metodoLogin === 'admin'" @submit.prevent="handleLoginAdmin" class="tab-content">
              <!-- Campo Usuario -->
              <div class="form-group">
                <label for="usuario" class="form-label">
                  <i class="fas fa-user"></i> Usuario
                </label>
                <input
                  id="usuario"
                  v-model="formularioAdmin.usuario"
                  type="text"
                  class="form-control"
                  placeholder="usuario"
                  required
                  :disabled="cargando"
                />
              </div>

              <!-- Campo Contraseña -->
              <div class="form-group">
                <label for="contrasena" class="form-label">
                  <i class="fas fa-lock"></i> Contraseña
                </label>
                <input
                  id="contrasena"
                  v-model="formularioAdmin.contrasena"
                  type="password"
                  class="form-control"
                  placeholder="••••••••"
                  required
                  :disabled="cargando"
                />
              </div>

              <!-- Botón Submit -->
              <button
                type="submit"
                class="btn btn-login w-100"
                :disabled="cargando || !formularioAdmin.usuario || !formularioAdmin.contrasena"
              >
                <span v-if="!cargando">
                  <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                </span>
                <span v-else>
                  <i class="fas fa-spinner fa-spin"></i> Autenticando...
                </span>
              </button>
            </form>
          </div>

          <!-- Si Keycloak está deshabilitado, solo mostrar login por email -->
          <form v-else="!keycloakHabilitado" @submit.prevent="handleLoginEmail">
            <!-- Campo Email -->
            <div class="form-group">
              <label for="correo" class="form-label">
                <i class="fas fa-envelope"></i> Correo Electrónico
              </label>
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

            <!-- Botón de envío -->
            <button
              type="submit"
              class="btn btn-login w-100"
              :disabled="cargando || !formulario.correo"
            >
              <span v-if="!cargando">
                <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
              </span>
              <span v-else>
                <i class="fas fa-spinner fa-spin"></i> Autenticando...
              </span>
            </button>
          </form>
        </div>

        <!-- Información adicional -->
        <div class="login-footer">
          <p class="text-muted small">
            <i class="fas fa-info-circle"></i>
            Acceso restringido. Ingresa con tu correo empresarial.
          </p>
        </div>
      </div>

      <!-- Panel informativo 
      <div class="login-info-panel">
        <div class="info-item">
          <i class="fas fa-shield-alt"></i>
          <h5>Seguro</h5>
          <p>Autenticación segura con HTTPS y encriptación</p>
        </div>
        <div class="info-item">
          <i class="fas fa-users"></i>
          <h5>Basado en Roles</h5>
          <p>Acceso controlado según tu perfil</p>
        </div>
        <div class="info-item">
          <i class="fas fa-chart-bar"></i>
          <h5>Gestión Centralizada</h5>
          <p>Administra todos tus documentos en un solo lugar</p>
        </div>
    </div>-->
      </div>
  </div>
</template>

<script>
import logoQT from '../assets/logoqt.png'
import fondoImg from '../assets/fondo.jpg'
import { useAuthStore } from '../stores/authStore'
import api from '../api'

export default {
  name: 'Login',
  setup() {
    return {
      authStore: useAuthStore(),
      logoQT,
      fondoImg
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
      metodoLogin: 'keycloak', // 'keycloak' o 'admin'
      keycloakHabilitado: false,
      cargando: false,
      error: null,
      exito: null
    };
  },
  async mounted() {
    // Si el usuario ya está autenticado, redirigir al dashboard
    if (this.authStore.isAuthenticated) {
      this.$router.push('/dashboard');
      return;
    }

    // Verificar si Keycloak está habilitado en el backend
    await this.verificarKeycloak();
  },
  methods: {
    async verificarKeycloak() {
      try {
        const response = await api.get('/auth/config');
        this.keycloakHabilitado = response.data.keycloakEnabled || false;
      } catch (err) {
        console.error('Error al verificar configuración de Keycloak:', err);
        // Si falla, asumir que Keycloak no está habilitado pero permitir login admin
        this.keycloakHabilitado = false;
        // No mostrar error al usuario, solo log en consola
      }
    },

    async loginConKeycloak() {
      this.cargando = true;
      this.error = null;
      this.exito = null;

      try {
        // Obtener la URL de login de Keycloak desde el backend
        const response = await api.get('/auth/keycloak/login');
        
        if (response.data.loginUrl) {
          // Redirigir al usuario a Keycloak para autenticación
          window.location.href = response.data.loginUrl;
        } else {
          throw new Error('No se pudo obtener la URL de login de Keycloak');
        }
      } catch (err) {
        this.error = err.response?.data?.error || 'Error al conectar con Keycloak';
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

        // Redirigir después de 1 segundo
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
          let errorMsg = 'Usuario o contraseña incorrectos';
          try {
            const data = await response.json();
            errorMsg = data.error || errorMsg;
          } catch (parseError) {
            // Si no puede parsear JSON, es probable que sea HTML
            const text = await response.text();
            console.error('Respuesta no-JSON del servidor:', text.substring(0, 200));
            errorMsg = 'Error del servidor. Verifica que el backend esté funcionando correctamente.';
          }
          throw new Error(errorMsg);
        }

        const data = await response.json();
        
        // Actualizar el store con los datos del usuario
        this.authStore.usuario = data.usuario;
        this.authStore.isAuthenticated = true;
        this.authStore.permisos = data.usuario?.permisos || {};

        this.exito = '¡Bienvenido! Redirigiendo...';

        // Redirigir después de 1 segundo
        setTimeout(() => {
          this.$router.push('/dashboard');
        }, 1000);
      } catch (err) {
        console.error('Error en login:', err);
        this.error = err.message || 'Error al iniciar sesión. Intenta nuevamente.';
      } finally {
        this.cargando = false;
      }
    }
  }
};
</script>

<style scoped>
/* Evitar scroll y asegurar fondo completo */
:global(html, body) {
  height: 100%;
  margin: 0;
  overflow: hidden;
}

:global(#app) {
  height: 100%;
}

/* Variables de colores */
.logo-img {
  width: 300px;
  max-width: 100%;
  margin: 10px auto 15px auto;
  display: block;
  object-fit: contain;
}
:root {
  --primary-color: #4472c4;
  --secondary-color: #5b9bd5;
  --success-color: #70ad47;
  --danger-color: #c5504f;
  --light-bg: #f5f5f5;
  --dark-text: #333;
}

.login-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  background-color: #667eea;
  z-index: 0;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(102, 126, 234, 0.6);
  z-index: 0;
}

.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 1000px;
  width: 90%;
  position: relative;
  z-index: 2;
}

/* Caja de login */
.login-box {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
  padding: 50px 40px;
  animation: slideInLeft 0.5s ease-out;
  width: 100%;
  max-width: 450px;
  backdrop-filter: blur(6px);
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Header de login */
.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 48px;
  color: var(--primary-color);
  margin-bottom: 15px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.login-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--dark-text);
  margin: 10px 0;
  letter-spacing: 2px;
}

.tagline {
  color: #888;
  font-size: 14px;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Formulario */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: var(--dark-text);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-control {
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #fafafa;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  background: white;
  box-shadow: 0 0 0 3px rgba(68, 114, 196, 0.1);
}

.form-control:disabled {
  background: #f0f0f0;
  cursor: not-allowed;
}

/* Checkbox */
.form-check {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
}

.form-check-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-color);
}

.form-check-label {
  cursor: pointer;
  font-size: 14px;
  color: #666;
  user-select: none;
}

/* Alertas */
.alert {
  padding: 12px 15px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideDown 0.3s ease-out;
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
  font-size: 20px;
  color: inherit;
  padding: 0;
}

/* Botón de login */
.btn-login {
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 10px;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(68, 114, 196, 0.4);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Botón de Keycloak */
.btn-keycloak {
  width: 100%;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #e53935 0%, #d32f2f 100%);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-keycloak:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(229, 57, 53, 0.4);
}

.btn-keycloak:active:not(:disabled) {
  transform: translateY(0);
}

.btn-keycloak:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Tabs de Login */
.login-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.login-type-label {
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin: 0 0 10px 0;
  letter-spacing: 0.5px;
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.tab-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
  box-shadow: 0 4px 12px rgba(68, 114, 196, 0.3);
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


/* Divisor */
.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.divider span {
  padding: 0 15px;
  color: #999;
  font-size: 14px;
  font-weight: 600;
}

/* Footer de login */
.login-footer {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.login-footer .text-muted {
  color: #999;
  font-size: 12px;
}

/* Panel informativo */
.login-info-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: slideInRight 0.5s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.info-item {
  background: rgba(255, 255, 255, 0.95);
  padding: 25px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.info-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.info-item i {
  font-size: 32px;
  color: var(--primary-color);
  margin-bottom: 10px;
  display: block;
}

.info-item h5 {
  font-size: 16px;
  font-weight: 600;
  color: var(--dark-text);
  margin: 10px 0;
}

.info-item p {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

/* Responsivo */
@media (max-width: 768px) {
  .login-wrapper {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .login-box {
    padding: 40px 30px;
  }

  .login-header h1 {
    font-size: 24px;
  }

  .login-info-panel {
    display: none;
  }
}
</style>
