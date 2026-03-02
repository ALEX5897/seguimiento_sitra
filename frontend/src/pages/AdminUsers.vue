<template>
  <div class="admin-users-container">
    <div class="page-header mb-4">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h1 class="h3 mb-1">
            <i class="bi bi-people-fill"></i> Gestión de Usuarios
          </h1>
          <p class="text-muted mb-0">Administra usuarios del sistema y catálogo de empleados</p>
        </div>
        <button class="btn btn-primary" @click="abrirModalNuevoUsuario">
          <i class="bi bi-plus-circle"></i> Nuevo {{ tabActual === 'sistema' ? 'Usuario' : 'Empleado' }}
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <button 
          :class="['nav-link', { active: tabActual === 'sistema' }]"
          @click="cambiarTab('sistema')"
        >
          <i class="bi bi-shield-lock"></i> Usuarios del Sistema
        </button>
      </li>
      <li class="nav-item">
        <button 
          :class="['nav-link', { active: tabActual === 'empleados' }]"
          @click="cambiarTab('empleados')"
        >
          <i class="bi bi-person-badge"></i> Catálogo de Empleados
        </button>
      </li>
    </ul>

    <!-- Alertas -->
    <div v-if="alertMessage" :class="`alert alert-${alertType} alert-dismissible fade show`" role="alert">
      <i :class="`bi bi-${alertType === 'success' ? 'check-circle' : 'exclamation-circle'}`"></i>
      {{ alertMessage }}
      <button type="button" class="btn-close" @click="alertMessage = null"></button>
    </div>

    <!-- Tabla de usuarios del sistema -->
    <div v-if="tabActual === 'sistema'" class="card shadow-sm">
      <div class="card-header bg-light">
        <div class="row align-items-center g-3">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text">
                <i class="bi bi-search"></i>
              </span>
              <input
                v-model="busqueda"
                type="text"
                class="form-control"
                placeholder="Buscar por correo o nombre..."
              />
            </div>
          </div>
          <div class="col-md-3">
            <select v-model="filtroRol" class="form-select">
              <option value="">Todos los roles</option>
              <option value="solo_vista">Solo Vista</option>
              <option value="secretaria">Secretaria</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="filtroEstado" class="form-select">
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table v-if="usuariosFiltrados.length > 0" class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Correo</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Último Login</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in usuariosFiltrados" :key="usuario.id" :class="getRowClass(usuario)">
              <td class="fw-medium">{{ usuario.correo }}</td>
              <td>{{ usuario.nombre }} {{ usuario.apellido }}</td>
              <td>
                <span :class="`badge bg-${getRolColor(usuario.rol)}`">
                  {{ usuario.rol || 'Sin rol' }}
                </span>
              </td>
              <td>
                <span :class="`badge bg-${getEstadoColor(usuario.estado)}`">
                  {{ usuario.estado }}
                </span>
              </td>
              <td class="small text-muted">
                {{ usuario.ultimo_login ? formatearFecha(usuario.ultimo_login) : 'Nunca' }}
              </td>
              <td>
                <div class="btn-group btn-group-sm" role="group">
                  <button
                    class="btn btn-outline-primary"
                    @click="abrirModalEditar(usuario)"
                    title="Editar usuario"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    v-if="usuario.id !== authStore.usuarioId"
                    class="btn btn-outline-danger"
                    @click="confirmarEliminar(usuario)"
                    title="Eliminar usuario"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                  <button
                    v-else
                    class="btn btn-outline-secondary"
                    disabled
                    title="No puedes eliminarte a ti mismo"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="p-5 text-center text-muted">
          <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.5;"></i>
          <p class="mt-3">No se encontraron usuarios</p>
        </div>
      </div>

      <div v-if="usuarios.length > 0" class="card-footer bg-light text-muted small">
        Mostrando {{ usuariosFiltrados.length }} de {{ usuarios.length }} usuarios
      </div>
    </div>

    <!-- Tabla de empleados -->
    <div v-if="tabActual === 'empleados'" class="card shadow-sm">
      <div class="card-header bg-light">
        <div class="row align-items-center g-3">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text">
                <i class="bi bi-search"></i>
              </span>
              <input
                v-model="busquedaEmpleado"
                type="text"
                class="form-control"
                placeholder="Buscar por correo, nombre o gerencia..."
              />
            </div>
          </div>
          <div class="col-md-3">
            <select v-model="filtroGerencia" class="form-select">
              <option value="">Todas las gerencias</option>
              <option v-for="gerencia in gerenciasUnicas" :key="gerencia" :value="gerencia">
                {{ gerencia }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <select v-model="filtroEstadoEmpleado" class="form-select">
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table v-if="empleadosFiltrados.length > 0" class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Correo</th>
              <th>Nombre</th>
              <th>Cargo</th>
              <th>Gerencia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="empleado in empleadosFiltrados" :key="empleado.id" :class="{ 'table-light': empleado.estado === 'inactivo' }">
              <td class="fw-medium">{{ empleado.correo }}</td>
              <td>{{ empleado.nombre }}</td>
              <td><small class="text-muted">{{ empleado.cargo || '-' }}</small></td>
              <td><small class="text-muted">{{ empleado.gerencia || '-' }}</small></td>
              <td>
                <span :class="`badge bg-${empleado.estado === 'activo' ? 'success' : 'warning'}`">
                  {{ empleado.estado }}
                </span>
              </td>
              <td>
                <div class="btn-group btn-group-sm" role="group">
                  <button
                    class="btn btn-outline-primary"
                    @click="abrirModalEditarEmpleado(empleado)"
                    title="Editar empleado"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    class="btn btn-outline-danger"
                    @click="confirmarEliminarEmpleado(empleado)"
                    title="Eliminar empleado"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="p-5 text-center text-muted">
          <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.5;"></i>
          <p class="mt-3">No se encontraron empleados</p>
        </div>
      </div>

      <div v-if="empleados.length > 0" class="card-footer bg-light text-muted small">
        Mostrando {{ empleadosFiltrados.length }} de {{ empleados.length }} empleados
      </div>
    </div>

    <!-- Modal de usuario del sistema -->
    <div
      v-show="mostrarModal && tabActual === 'sistema'"
      class="modal"
      :class="{ show: mostrarModal }"
      style="display: none;"
      :style="mostrarModal ? 'display: block; background: rgba(0, 0, 0, 0.5);' : ''"
    >
      <div class="modal-dialog modal-md">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ formularioUsuario.id ? 'Editar Usuario' : 'Nuevo Usuario' }}
            </h5>
            <button type="button" class="btn-close" @click="cerrarModal"></button>
          </div>
          <form @submit.prevent="guardarUsuario">
            <div class="modal-body">
              <div class="mb-3">
                <label for="correo" class="form-label">Correo Electrónico *</label>
                <input
                  id="correo"
                  v-model="formularioUsuario.correo"
                  type="email"
                  class="form-control"
                  required
                  :disabled="formularioUsuario.id"
                />
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="nombre" class="form-label">Nombre *</label>
                    <input
                      id="nombre"
                      v-model="formularioUsuario.nombre"
                      type="text"
                      class="form-control"
                      required
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="apellido" class="form-label">Apellido *</label>
                    <input
                      id="apellido"
                      v-model="formularioUsuario.apellido"
                      type="text"
                      class="form-control"
                      required
                    />
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="rolId" class="form-label">Rol *</label>
                    <select id="rolId" v-model="formularioUsuario.rol_id" class="form-select" required>
                      <option value="">Selecciona un rol</option>
                      <option v-for="rol in roles" :key="rol.id" :value="rol.id">
                        {{ rol.nombre }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="estado" class="form-label">Estado *</label>
                    <select id="estado" v-model="formularioUsuario.estado" class="form-select" required>
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="bloqueado">Bloqueado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div v-if="roles.find(r => r.id === parseInt(formularioUsuario.rol_id))?.descripcion" class="alert alert-info small">
                <strong>{{ roles.find(r => r.id === parseInt(formularioUsuario.rol_id))?.nombre }}:</strong>
                {{ roles.find(r => r.id === parseInt(formularioUsuario.rol_id))?.descripcion }}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="cerrarModal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="cargandoGuardar">
                <span v-if="cargandoGuardar" class="spinner-border spinner-border-sm me-2"></span>
                {{ formularioUsuario.id ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Overlay del modal -->
    <div
      v-show="mostrarModal"
      class="modal-backdrop fade"
      :class="{ show: mostrarModal }"
      @click="cerrarModal"
    ></div>

    <!-- Modal de empleado -->
    <div
      v-show="mostrarModal && tabActual === 'empleados'"
      class="modal"
      :class="{ show: mostrarModal }"
      style="display: none;"
      :style="mostrarModal ? 'display: block; background: rgba(0, 0, 0, 0.5);' : ''"
    >
      <div class="modal-dialog modal-md">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ formularioEmpleado.id ? 'Editar Empleado' : 'Nuevo Empleado' }}
            </h5>
            <button type="button" class="btn-close" @click="cerrarModal"></button>
          </div>
          <form @submit.prevent="guardarEmpleado">
            <div class="modal-body">
              <div class="mb-3">
                <label for="correo-emp" class="form-label">Correo Electrónico *</label>
                <input
                  id="correo-emp"
                  v-model="formularioEmpleado.correo"
                  type="email"
                  class="form-control"
                  required
                />
              </div>

              <div class="mb-3">
                <label for="nombre-emp" class="form-label">Nombre Completo *</label>
                <input
                  id="nombre-emp"
                  v-model="formularioEmpleado.nombre"
                  type="text"
                  class="form-control"
                  required
                />
              </div>

              <div class="mb-3">
                <label for="cargo-emp" class="form-label">Cargo</label>
                <input
                  id="cargo-emp"
                  v-model="formularioEmpleado.cargo"
                  type="text"
                  class="form-control"
                />
              </div>

              <div class="mb-3">
                <label for="gerencia-emp" class="form-label">Gerencia</label>
                <input
                  id="gerencia-emp"
                  v-model="formularioEmpleado.gerencia"
                  type="text"
                  class="form-control"
                />
              </div>

              <div class="mb-3">
                <label for="telefono-emp" class="form-label">Teléfono</label>
                <input
                  id="telefono-emp"
                  v-model="formularioEmpleado.telefono"
                  type="text"
                  class="form-control"
                />
              </div>

              <div class="mb-3">
                <label for="estado-emp" class="form-label">Estado *</label>
                <select id="estado-emp" v-model="formularioEmpleado.estado" class="form-select" required>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div class="alert alert-info small">
                <i class="bi bi-info-circle"></i>
                Los empleados aparecerán en los selectores para asignar tareas y reasignar documentos.
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="cerrarModal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" :disabled="cargandoGuardar">
                <span v-if="cargandoGuardar" class="spinner-border spinner-border-sm me-2"></span>
                {{ formularioEmpleado.id ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Overlay del modal -->
    <div
      v-show="mostrarModal"
      class="modal-backdrop fade"
      :class="{ show: mostrarModal }"
    ></div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/authStore'
import api from '../api'
import { confirmAction } from '../utils/feedback'

export default {
  name: 'AdminUsers',
  setup() {
    return {
      authStore: useAuthStore()
    }
  },
  data() {
    return {
      tabActual: 'sistema',
      usuarios: [],
      empleados: [],
      roles: [],
      busqueda: '',
      busquedaEmpleado: '',
      filtroRol: '',
      filtroEstado: '',
      filtroGerencia: '',
      filtroEstadoEmpleado: '',
      mostrarModal: false,
      cargandoGuardar: false,
      cargando: false,
      alertMessage: null,
      alertType: 'success',
      formularioUsuario: {
        id: null,
        correo: '',
        nombre: '',
        apellido: '',
        rol_id: '',
        estado: 'activo'
      },
      formularioEmpleado: {
        id: null,
        correo: '',
        nombre: '',
        cargo: '',
        gerencia: '',
        telefono: '',
        estado: 'activo'
      }
    }
  },
  computed: {
    usuariosFiltrados() {
      return this.usuarios.filter(usuario => {
        const coincideBusqueda =
          usuario.correo.toLowerCase().includes(this.busqueda.toLowerCase()) ||
          `${usuario.nombre} ${usuario.apellido}`.toLowerCase().includes(this.busqueda.toLowerCase());

        const coincideRol = !this.filtroRol || usuario.rol?.nombre === this.filtroRol;
        const coincideEstado = !this.filtroEstado || usuario.estado === this.filtroEstado;

        return coincideBusqueda && coincideRol && coincideEstado;
      });
    },
    empleadosFiltrados() {
      return this.empleados.filter(empleado => {
        const coincideBusqueda =
          empleado.correo.toLowerCase().includes(this.busquedaEmpleado.toLowerCase()) ||
          empleado.nombre.toLowerCase().includes(this.busquedaEmpleado.toLowerCase()) ||
          (empleado.gerencia || '').toLowerCase().includes(this.busquedaEmpleado.toLowerCase());

        const coincideGerencia = !this.filtroGerencia || empleado.gerencia === this.filtroGerencia;
        const coincideEstado = !this.filtroEstadoEmpleado || empleado.estado === this.filtroEstadoEmpleado;

        return coincideBusqueda && coincideGerencia && coincideEstado;
      });
    },
    gerenciasUnicas() {
      const gerencias = this.empleados
        .map(e => e.gerencia)
        .filter(g => g && g.trim() !== '');
      return [...new Set(gerencias)].sort();
    }
  },
  mounted() {
    this.cargarUsuarios();
    this.cargarEmpleados();
    this.cargarRoles();
  },
  methods: {
    cambiarTab(tab) {
      this.tabActual = tab;
      this.cerrarModal();
    },

    async cargarUsuarios() {
      this.cargando = true;
      try {
        const response = await api.get('/admin/usuarios');
        this.usuarios = response.data.usuarios || [];
      } catch (err) {
        this.mostrarAlerta('Error al cargar usuarios: ' + (err.response?.data?.error || err.message), 'danger');
      } finally {
        this.cargando = false;
      }
    },

    async cargarEmpleados() {
      try {
        const response = await api.get('/usuarios');
        this.empleados = response.data || [];
      } catch (err) {
        this.mostrarAlerta('Error al cargar empleados: ' + (err.response?.data?.error || err.message), 'danger');
      }
    },

    async cargarRoles() {
      try {
        const response = await api.get('/admin/usuarios/lista/roles');
        this.roles = response.data.roles || [];
      } catch (err) {
        this.mostrarAlerta('Error al cargar roles: ' + (err.response?.data?.error || err.message), 'danger');
      }
    },

    abrirModalNuevoUsuario() {
      if (this.tabActual === 'sistema') {
        this.formularioUsuario = {
          id: null,
          correo: '',
          nombre: '',
          apellido: '',
          rol_id: '',
          estado: 'activo'
        };
      } else {
        this.formularioEmpleado = {
          id: null,
          correo: '',
          nombre: '',
          cargo: '',
          gerencia: '',
          telefono: '',
          estado: 'activo'
        };
      }
      this.mostrarModal = true;
    },

    abrirModalEditar(usuario) {
      this.formularioUsuario = {
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol_id: usuario.rol_id,
        estado: usuario.estado
      };
      this.mostrarModal = true;
    },

    abrirModalEditarEmpleado(empleado) {
      this.formularioEmpleado = {
        id: empleado.id,
        correo: empleado.correo,
        nombre: empleado.nombre,
        cargo: empleado.cargo || '',
        gerencia: empleado.gerencia || '',
        telefono: empleado.telefono || '',
        estado: empleado.estado
      };
      this.mostrarModal = true;
    },

    cerrarModal() {
      this.mostrarModal = false;
    },

    async guardarUsuario() {
      this.cargandoGuardar = true;
      try {
        if (this.formularioUsuario.id) {
          // Actualizar
          const response = await api.put(
            `/admin/usuarios/${this.formularioUsuario.id}`,
            {
              nombre: this.formularioUsuario.nombre,
              apellido: this.formularioUsuario.apellido,
              rol_id: this.formularioUsuario.rol_id,
              estado: this.formularioUsuario.estado
            }
          );
          this.mostrarAlerta('Usuario actualizado correctamente', 'success');
        } else {
          // Crear
          const response = await api.post('/admin/usuarios', {
            correo: this.formularioUsuario.correo,
            nombre: this.formularioUsuario.nombre,
            apellido: this.formularioUsuario.apellido,
            rol_id: this.formularioUsuario.rol_id,
            estado: this.formularioUsuario.estado
          });
          this.mostrarAlerta('Usuario creado correctamente', 'success');
        }

        this.cerrarModal();
        await this.cargarUsuarios();
      } catch (err) {
        this.mostrarAlerta('Error: ' + (err.response?.data?.error || err.message), 'danger');
      } finally {
        this.cargandoGuardar = false;
      }
    },

    async guardarEmpleado() {
      this.cargandoGuardar = true;
      try {
        if (this.formularioEmpleado.id) {
          // Actualizar
          await api.put(
            `/usuarios/${this.formularioEmpleado.id}`,
            this.formularioEmpleado
          );
          this.mostrarAlerta('Empleado actualizado correctamente', 'success');
        } else {
          // Crear
          await api.post('/usuarios', this.formularioEmpleado);
          this.mostrarAlerta('Empleado creado correctamente', 'success');
        }

        this.cerrarModal();
        await this.cargarEmpleados();
      } catch (err) {
        this.mostrarAlerta('Error: ' + (err.response?.data?.error || err.message), 'danger');
      } finally {
        this.cargandoGuardar = false;
      }
    },

    async confirmarEliminar(usuario) {
      const confirmado = await confirmAction(
        `¿Estás seguro de que deseas eliminar a ${usuario.correo}?`,
        'Eliminar usuario'
      );
      if (confirmado) {
        this.eliminarUsuario(usuario.id);
      }
    },

    async confirmarEliminarEmpleado(empleado) {
      const confirmado = await confirmAction(
        `¿Estás seguro de que deseas eliminar a ${empleado.nombre}?`,
        'Eliminar empleado'
      );
      if (confirmado) {
        this.eliminarEmpleado(empleado.id);
      }
    },

    async eliminarUsuario(id) {
      try {
        await api.delete(`/admin/usuarios/${id}`);
        this.mostrarAlerta('Usuario eliminado correctamente', 'success');
        await this.cargarUsuarios();
      } catch (err) {
        this.mostrarAlerta('Error: ' + (err.response?.data?.error || err.message), 'danger');
      }
    },

    async eliminarEmpleado(id) {
      try {
        await api.delete(`/usuarios/${id}`);
        this.mostrarAlerta('Empleado eliminado correctamente', 'success');
        await this.cargarEmpleados();
      } catch (err) {
        this.mostrarAlerta('Error: ' + (err.response?.data?.error || err.message), 'danger');
      }
    },

    mostrarAlerta(mensaje, tipo) {
      this.alertMessage = mensaje;
      this.alertType = tipo;
      setTimeout(() => {
        this.alertMessage = null;
      }, 5000);
    },

    getRolColor(rol) {
      const colores = {
        admin: 'danger',
        secretaria: 'warning',
        solo_vista: 'info'
      };
      return colores[rol] || 'secondary';
    },

    getEstadoColor(estado) {
      const colores = {
        activo: 'success',
        inactivo: 'warning',
        bloqueado: 'danger'
      };
      return colores[estado] || 'secondary';
    },

    getRowClass(usuario) {
      if (usuario.estado === 'bloqueado') return 'table-danger';
      if (usuario.estado === 'inactivo') return 'table-light';
      return '';
    },

    formatearFecha(fecha) {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.admin-users-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 1rem;
}

.nav-tabs {
  border-bottom: 2px solid #dee2e6;
}

.nav-tabs .nav-link {
  border: none;
  color: #6c757d;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  background: none;
  transition: all 0.3s ease;
}

.nav-tabs .nav-link:hover {
  color: #0d6efd;
  border-bottom: 2px solid #0d6efd;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom: 3px solid #0d6efd;
  background: none;
}

.card {
  border: none;
  border-radius: 8px;
}

.table tbody tr {
  transition: background-color 0.2s ease;
}

.table tbody tr:hover {
  background-color: #f8f9fa;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.modal {
  z-index: 1050;
}

.modal-backdrop {
  z-index: 1040;
}

.badge {
  font-size: 0.75rem;
  padding: 0.35rem 0.6rem;
}

input-group-text {
  background: white;
}
</style>
