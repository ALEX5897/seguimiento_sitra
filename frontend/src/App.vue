<template>
  <div class="d-flex min-vh-100 bg-light app-shell">
    <!-- Overlay para cerrar sidebar en mobile -->
    <div v-if="authStore.isAuthenticated && showSidebar && !isDesktop" class="sidebar-overlay" @click="showSidebar = false"></div>

    <!-- Loader global mientras se autentica -->
    <div v-if="authStore.cargando" class="global-loader">
      <div class="loader-content">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="text-muted mt-3">Cargando...</p>
      </div>
    </div>

    <!-- Alerta de acceso denegado -->
    <div v-if="mostrarAlertaAccesoDenegado" class="position-fixed top-0 start-50 translate-middle-x mt-3" style="z-index: 9999;">
      <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="bi bi-exclamation-circle"></i>
        <strong> Acceso Denegado</strong> - No tienes permisos para acceder a esta sección. Se requieren permisos de administrador.
        <button type="button" class="btn-close" @click="mostrarAlertaAccesoDenegado = false"></button>
      </div>
    </div>

    <!-- Sidebar principal - Toggleable en todas las pantallas -->
    <aside v-if="authStore.isAuthenticated" v-show="showSidebar" class="bg-primary text-white flex-column p-0 sidebar position-fixed start-0 top-0 vh-100" :class="{ 'd-md-flex': showSidebar }" style="z-index: 1050; width: 200px;">
      <div class="d-flex align-items-center justify-content-between py-4 border-bottom border-secondary px-3">
        <span class="fs-4 fw-bold">SITRA</span>
        <button class="btn btn-link text-white p-0" @click="showSidebar = false">
          <i class="bi bi-x-lg fs-4"></i>
        </button>
      </div>
      <nav class="flex-grow-1 mt-4">
        <ul class="nav flex-column">
          <li class="nav-item">
            <router-link to="/dashboard" class="nav-link text-white d-flex align-items-center gap-2">
              <i class="bi bi-speedometer2"></i>
              <span>Dashboard</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/reasignados" class="nav-link text-white d-flex align-items-center gap-2">
              <i class="bi bi-arrow-left-right"></i>
              <span>Reasignados</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/enviados" class="nav-link text-white d-flex align-items-center gap-2">
              <i class="bi bi-send"></i>
              <span>Enviados</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/tareas" class="nav-link text-white d-flex align-items-center gap-2">
              <i class="bi bi-list-task"></i>
              <span>Tareas</span>
            </router-link>
          </li>
          <li class="nav-item border-top border-secondary mt-3 pt-3">
            <span class="nav-link text-warning d-flex align-items-center gap-2 small fw-bold">
              <i class="bi bi-graph-up"></i>
              <span>Reportes</span>
            </span>
          </li>
          <li class="nav-item">
            <router-link to="/reportes/reasignados" class="nav-link text-white d-flex align-items-center gap-2 ps-5">
              <i class="bi bi-file-earmark-pdf"></i>
              <span>Reasignados</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/reportes/tareas" class="nav-link text-white d-flex align-items-center gap-2 ps-5">
              <i class="bi bi-file-earmark-pdf"></i>
              <span>Tareas</span>
            </router-link>
          </li>

          <!-- Admin menu - Solo para administradores -->
          <li v-if="authStore.isAdmin" class="nav-item border-top border-secondary mt-3 pt-3">
            <span class="nav-link text-danger d-flex align-items-center gap-2 small fw-bold">
              <i class="bi bi-gear"></i>
              <span>Administración</span>
            </span>
          </li>
          <li v-if="authStore.isAdmin" class="nav-item">
            <router-link to="/admin/usuarios" class="nav-link text-white d-flex align-items-center gap-2 ps-5">
              <i class="bi bi-people"></i>
              <span>Gestión de Usuarios</span>
            </router-link>
          </li>
          <li v-if="authStore.isAdmin" class="nav-item">
            <router-link to="/admin/notificaciones" class="nav-link text-white d-flex align-items-center gap-2 ps-5">
              <i class="bi bi-bell"></i>
              <span>Notificaciones</span>
            </router-link>
          </li>
          <li v-if="authStore.isAdmin" class="nav-item">
            <router-link to="/admin/roles" class="nav-link text-white d-flex align-items-center gap-2 ps-5">
              <i class="bi bi-shield-lock"></i>
              <span>Roles y Permisos</span>
            </router-link>
          </li>
          <li v-if="authStore.isAdmin" class="nav-item">
            <router-link to="/catalogos" class="nav-link text-white d-flex align-items-center gap-2 ps-5">
              <i class="bi bi-bookmarks"></i>
              <span>Catálogos</span>
            </router-link>
          </li>
          <li v-if="authStore.isAdmin" class="nav-item">
            <router-link to="/carga-masiva" class="nav-link text-white d-flex align-items-center gap-2 ps-5">
              <i class="bi bi-cloud-upload"></i>
              <span>Carga Masiva</span>
            </router-link>
          </li>
        </ul>
      </nav>
      <div class="mt-auto p-3 text-center text-warning fw-semibold">
        Quito Turismo © 2026
        <br>
        <small class="text-white">v{{ version }}</small>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-grow-1 d-flex flex-column" :style="{ marginLeft: showSidebar && isDesktop ? '200px' : '0px', transition: 'margin-left 0.3s' }">
      <!-- Header - Solo mostrar si está autenticado -->
      <header v-if="authStore.isAuthenticated" class="bg-white shadow-sm p-3 d-flex align-items-center justify-content-between app-header">
        <div class="d-flex align-items-center">
          <button class="btn btn-link me-2" @click="showSidebar = !showSidebar">
            <i class="bi bi-list fs-4"></i>
          </button>
          <img :src="logo" alt="Logo" class="app-logo me-3" />
          <div>
            <h2 class="h5 mb-0">Seguimiento Documental</h2>
            <small class="text-muted">Gestión institucional de documentos, tareas y envíos</small>
          </div>
        </div>
        <div class="d-flex gap-2 align-items-center">
          <!-- Notificaciones -->
          <notificaciones-bell />

          <!-- Dropdown de usuario -->
          <div class="dropdown">
            <button 
              class="btn btn-sm btn-light dropdown-toggle d-flex align-items-center gap-2"
              type="button" 
              id="dropdownUser"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-person-circle"></i>
              <span>{{ authStore.usuarioNombre }}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownUser">
              <li>
                <h6 class="dropdown-header">
                  <span class="badge bg-primary">{{ authStore.usuarioRol }}</span>
                </h6>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <button
                  type="button"
                  class="dropdown-item w-100 text-start"
                  @click="handleLogout"
                >
                  <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <main class="p-3 flex-grow-1 app-main">
        <router-view />
      </main>
    </div>

    <!-- Modal de resultados de carga masiva -->
    <modal-resultados-carga ref="modalResultados" />
  </div>
</template>

<script>
import logo from '../../img/logoqt.png'
import api from './api'
import { useAuthStore } from './stores/authStore'
import NotificacionesBell from './components/NotificacionesBell.vue'
import ModalResultadosCarga from './components/ModalResultadosCarga.vue'
import { showToast, confirmAction } from './utils/feedback'
import packageJson from '../package.json'

export default {
  name: 'App',
  components: {
    NotificacionesBell,
    ModalResultadosCarga
  },
  setup() {
    return {
      authStore: useAuthStore()
    }
  },
  data() {
    return {
      logo,
      isUploading: false,
      showSidebar: window.innerWidth >= 768,
      isDesktop: window.innerWidth >= 768,
      version: packageJson.version,
      mostrarAlertaAccesoDenegado: false
    }
  },
  methods: {
    async handleFileUpload() {
      if (this.authStore.isSoloVista) {
        showToast('No tienes permisos para cargar archivos', 'warning');
        return;
      }

      const file = this.$refs.fileInput.files[0];
      if (!file) return;

      this.isUploading = true;
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        // Mostrar modal con resultados detallados
        this.$refs.modalResultados.mostrar(response.data);
        
        // Limpiar el input
        this.$refs.fileInput.value = '';
        
        // Escuchar el evento de cierre del modal de Bootstrap para recargar
        const modalElement = document.getElementById('modalResultadosCarga');
        const handleModalHidden = () => {
          modalElement.removeEventListener('hidden.bs.modal', handleModalHidden);
          window.dispatchEvent(new CustomEvent('sistra:data-updated'));
        };
        modalElement.addEventListener('hidden.bs.modal', handleModalHidden);
      } catch (err) {
        showToast('Error al cargar archivo: ' + (err.response?.data?.error || err.message), 'error');
        this.$refs.fileInput.value = '';
      } finally {
        this.isUploading = false;
      }
    }
  },
  mounted() {
    this.updateIsDesktop();
    window.addEventListener('resize', this.updateIsDesktop);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateIsDesktop);
  },
  watch: {
    'authStore.isAuthenticated'(nuevoValor) {
      // Si cambió de autenticado a no autenticado (logout)
      if (nuevoValor === false && this.$route.path !== '/login') {
        console.log('🚪 Logout detectado, redirigiendo a login...');
        this.$router.push('/login');
      }
    },
    '$route'() {
      // Cerrar sidebar automáticamente al navegar en pantallas pequeñas
      if (!this.isDesktop) {
        this.showSidebar = false;
      }
      // Verificar si hay intento de acceso denegado
      if (window.mostrarAlertaNoAutorizado) {
        window.mostrarAlertaNoAutorizado = false;
        this.mostrarAlertaAccesoDenegado = true;
        setTimeout(() => {
          this.mostrarAlertaAccesoDenegado = false;
        }, 5000);
      }
    }
  },
  methods: {
    updateIsDesktop() {
      this.isDesktop = window.innerWidth >= 768;
      // Mostrar sidebar automáticamente en pantallas grandes
      if (this.isDesktop) {
        this.showSidebar = true;
      } else {
        // Ocultar sidebar automáticamente en pantallas pequeñas
        this.showSidebar = false;
      }
    },

    async handleLogout() {
      console.clear();
      console.log('%c🚪 LOGOUT INICIADO 🚪', 'color: red; font-size: 16px; font-weight: bold;');
      console.log('handleLogout ejecutándose...');

      // Usar confirm simple en lugar de modal para evitar problemas
      const confirmar = window.confirm('¿Estás seguro de que deseas cerrar sesión?');
      console.log('Confirmación del usuario:', confirmar);

      if (confirmar) {
        try {
          console.log('Ejecutando authStore.logout()...');
          await this.authStore.logout();
          console.log('Logout completado en store');

          // Pequeña pausa para asegurar que la sesión se destruya
          await new Promise(resolve => setTimeout(resolve, 500));

          console.log('Redirigiendo a /login...');
          this.$router.push('/login');
        } catch (error) {
          console.error('Error en logout:', error);
          this.$router.push('/login');
        }
      } else {
        console.log('Usuario canceló el logout');
      }
    }
  }
}
</script>

<style scoped>
/* Global loader */
.global-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.98);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.loader-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loader-content .spinner-border {
  width: 3rem;
  height: 3rem;
}

.dropdown-item.w-100 {
  border: none;
  background: transparent;
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: #212529;
}

.dropdown-item.w-100:hover {
  background-color: #f8f9fa;
  color: #212529;
}

.dropdown-item.w-100:active,
.dropdown-item.w-100:focus {
  background-color: #e9ecef;
  color: #212529;
}

/* Sidebar overlay en pantallas pequeñas */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1049;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 767px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.show,
  .sidebar[style*="display: flex"],
  .sidebar[style*="display: block"] {
    transform: translateX(0);
  }
}

/* Responsive styles */
@media (max-width: 767px) {
  .sidebar {
    width: 100% !important;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }

  .app-header {
    flex-wrap: wrap;
    gap: 1rem !important;
  }

  .app-header h2 {
    font-size: 1.1rem !important;
  }

  .app-header small {
    display: none;
  }

  .app-main {
    padding: 0.75rem !important;
  }

  .nav-link span {
    font-size: 0.9rem;
  }

  .dropdown-toggle {
    padding: 0.25rem 0.5rem !important;
    font-size: 0.85rem;
  }

  .dropdown-toggle i {
    display: none;
  }
}

@media (max-width: 576px) {
  .app-logo {
    width: 30px !important;
    height: 30px !important;
    margin-right: 0.5rem !important;
  }

  .app-header {
    padding: 0.75rem !important;
  }

  .app-main {
    padding: 0.5rem !important;
  }

  .btn-link {
    padding: 0 !important;
    margin-right: 0.5rem !important;
  }

  .nav-link {
    padding: 0.5rem 1rem !important;
  }

  h2 {
    font-size: 1rem !important;
  }
}
</style>
