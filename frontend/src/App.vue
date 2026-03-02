<template>
  <div class="d-flex min-vh-100 bg-light app-shell">
    <!-- Desktop sidebar - Solo mostrar si está autenticado -->
    <aside v-if="authStore.isAuthenticated" class="bg-primary text-white d-none d-md-flex flex-column p-0 sidebar">
      <div class="d-flex align-items-center justify-content-center py-4 border-bottom border-secondary">
        <center><span class="fs-4 fw-bold">SITRA</span> </center>
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
        </ul>
      </nav>
      <div class="mt-auto p-3 text-center text-warning fw-semibold">Quito Turismo © 2026</div>
    </aside>

    <!-- Main content -->
    <div class="flex-grow-1 d-flex flex-column">
      <!-- Header - Solo mostrar si está autenticado -->
      <header v-if="authStore.isAuthenticated" class="bg-white shadow-sm p-3 d-flex align-items-center justify-content-between app-header">
        <div class="d-flex align-items-center">
          <button class="btn btn-link d-md-none me-2" data-bs-toggle="offcanvas" data-bs-target="#mobileMenu">☰</button>
          <img :src="logo" alt="Logo" class="app-logo me-3" />
          <div>
            <h2 class="h5 mb-0">Seguimiento Documental</h2>
            <small class="text-muted">Gestión institucional de documentos, tareas y envíos</small>
          </div>
        </div>
        <div class="d-flex gap-2 align-items-center">
          <div v-if="!authStore.isSoloVista" class="position-relative">
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleFileUpload" 
              accept=".xlsx,.xls" 
              style="display: none;"
            />
            <button 
              @click="$refs.fileInput.click()" 
              class="btn btn-sm btn-primary"
              :disabled="isUploading"
            >
              <span v-if="isUploading" class="spinner-border spinner-border-sm me-2"></span>
              Cargar .XLSX
            </button>
          </div>

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
                <a class="dropdown-item" href="#" @click.prevent="handleLogout">
                  <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                </a>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <main class="p-3 flex-grow-1 app-main">
        <router-view />
      </main>
    </div>

    <!-- Mobile offcanvas menu -->
    <div v-if="authStore.isAuthenticated" class="offcanvas offcanvas-start" tabindex="-1" id="mobileMenu">
      <div class="offcanvas-header">
        <h5 class="offcanvas-title">Menu</h5>
        <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body">
        <div class="mb-4 d-flex align-items-center gap-2">
          <strong>{{ authStore.usuarioNombre }}</strong>
          <span class="badge bg-primary">{{ authStore.usuarioRol }}</span>
        </div>
        <nav>
          <ul class="list-unstyled">
            <li class="mb-2"><router-link to="/dashboard" class="d-block" data-bs-dismiss="offcanvas">Dashboard</router-link></li>
            <li class="mb-2"><router-link to="/reasignados" class="d-block" data-bs-dismiss="offcanvas">Reasignados</router-link></li>
            <li class="mb-2"><router-link to="/tareas" class="d-block" data-bs-dismiss="offcanvas">Tareas</router-link></li>
            <li class="mb-2"><router-link to="/enviados" class="d-block" data-bs-dismiss="offcanvas">Enviados</router-link></li>
            <li v-if="authStore.isAdmin" class="mb-2"><router-link to="/admin/usuarios" class="d-block" data-bs-dismiss="offcanvas">Gestión de Usuarios</router-link></li>
            <li class="mb-2 border-top pt-2">
              <a href="#" @click.prevent="handleLogout" class="d-block text-danger">Cerrar Sesión</a>
            </li>
          </ul>
        </nav>
      </div>
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
      isUploading: false
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
    },

    async handleLogout() {
      const confirmado = await confirmAction('¿Estás seguro de que deseas cerrar sesión?', 'Cerrar sesión');
      if (confirmado) {
        await this.authStore.logout();
        this.$router.push('/login');
      }
    }
  }
}
</script>
