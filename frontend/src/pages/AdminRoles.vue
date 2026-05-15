<template>
  <div class="container-fluid py-4">
    <div class="row mb-4">
      <div class="col">
        <h2 class="mb-0">
          <i class="bi bi-shield-lock-fill"></i> Gestión de Roles y Permisos
        </h2>
        <small class="text-muted">Administra los roles del sistema y asigna permisos por rol</small>
      </div>
      <div class="col-auto">
        <button @click="mostrarModalCrear = true" class="btn btn-success">
          <i class="bi bi-plus-circle me-2"></i> Nuevo Rol
        </button>
      </div>
    </div>

    <!-- Lista de roles -->
    <div v-if="!cargando" class="row">
      <div class="col-md-4">
        <div class="card sticky-top" style="top: 20px;">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0"><i class="bi bi-list"></i> Roles Disponibles</h5>
          </div>
          <div class="list-group list-group-flush">
            <button
              v-for="rol in roles"
              :key="rol.id"
              @click="seleccionarRol(rol)"
              :class="['list-group-item', 'list-group-item-action', { active: rolSeleccionado?.id === rol.id }]"
            >
              <div class="d-flex justify-content-between align-items-start">
                <div class="text-start flex-grow-1">
                  <h6 class="mb-1">{{ rol.nombre }}</h6>
                  <small class="text-muted">{{ rol.cantidad_usuarios }} usuario(s)</small>
                </div>
                <span class="badge bg-info">{{ rol.id }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Detalles del rol seleccionado -->
      <div class="col-md-8">
        <div v-if="rolSeleccionado" class="card">
          <div class="card-header bg-info text-white">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0">{{ rolSeleccionado.nombre }}</h5>
              <div>
                <button
                  v-if="![1, 2, 3].includes(rolSeleccionado.id)"
                  @click="editarRol"
                  class="btn btn-sm btn-warning me-2"
                >
                  <i class="bi bi-pencil"></i> Editar
                </button>
                <button
                  v-if="![1, 2, 3].includes(rolSeleccionado.id)"
                  @click="eliminarRol"
                  class="btn btn-sm btn-danger"
                >
                  <i class="bi bi-trash"></i> Eliminar
                </button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <!-- Descripción -->
            <div class="mb-4">
              <h6><i class="bi bi-info-circle"></i> Descripción</h6>
              <p class="text-muted">{{ rolSeleccionado.descripcion || 'Sin descripción' }}</p>
            </div>

            <!-- Usuarios asignados -->
            <div class="mb-4">
              <h6><i class="bi bi-people"></i> Usuarios Asignados</h6>
              <p v-if="rolSeleccionado.cantidad_usuarios === 0" class="text-muted">
                No hay usuarios asignados a este rol
              </p>
              <span v-else class="badge bg-primary">{{ rolSeleccionado.cantidad_usuarios }} usuario(s)</span>
            </div>

            <!-- Permisos -->
            <div class="mb-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0"><i class="bi bi-key-fill"></i> Permisos</h6>
                <button @click="guardarPermisos" :disabled="!permisosModificados" class="btn btn-sm btn-success">
                  <span v-if="guardandoPermisos" class="spinner-border spinner-border-sm me-2"></span>
                  <i class="bi bi-check-circle me-1"></i> Guardar Cambios
                </button>
              </div>

              <div v-if="permisosDisponibles" class="permissions-container">
                <div v-for="(grupo, clave) in permisosDisponibles" :key="clave" class="mb-3 p-3 border rounded">
                  <div class="d-flex align-items-start mb-2">
                    <div class="form-check form-switch flex-grow-1">
                      <input
                        type="checkbox"
                        :id="`grupo-${clave}`"
                        class="form-check-input"
                        :checked="esGrupoCompleto(clave)"
                        @change="toggleGrupo(clave)"
                      />
                      <label :for="`grupo-${clave}`" class="form-check-label fw-bold">
                        {{ grupo.nombre }}
                      </label>
                    </div>
                  </div>
                  <small class="text-muted d-block mb-2">{{ grupo.descripcion }}</small>

                  <!-- Permisos individuales del grupo -->
                  <div class="ps-4">
                    <div v-for="(desc, permiso) in grupo.permisos" :key="permiso" class="form-check mb-2">
                      <input
                        type="checkbox"
                        :id="`permiso-${permiso}`"
                        class="form-check-input"
                        :checked="rolSeleccionado.permisos[permiso] === true"
                        @change="(e) => togglePermiso(permiso, e.target.checked)"
                      />
                      <label :for="`permiso-${permiso}`" class="form-check-label">
                        {{ desc }}
                        <code class="ms-2">{{ permiso }}</code>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Información del rol -->
            <div class="border-top pt-3">
              <small class="text-muted">
                <strong>Creado:</strong> {{ formatearFecha(rolSeleccionado.created_at) }}<br />
                <strong>Actualizado:</strong> {{ formatearFecha(rolSeleccionado.updated_at) }}
              </small>
            </div>
          </div>
        </div>

        <!-- Sin rol seleccionado -->
        <div v-else class="card text-center text-muted py-5">
          <i class="bi bi-info-circle" style="font-size: 3rem; opacity: 0.3;"></i>
          <p class="mt-3">Selecciona un rol de la lista para ver y editar sus permisos</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-else class="alert alert-info">
      <i class="bi bi-hourglass-split"></i> Cargando roles...
    </div>

    <!-- Modal para crear/editar rol -->
    <div v-if="mostrarModalCrear || mostrarModalEditar" class="modal d-block" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ mostrarModalEditar ? 'Editar Rol' : 'Crear Nuevo Rol' }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="mostrarModalCrear = false; mostrarModalEditar = false;"
            ></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label"><strong>Nombre del Rol</strong></label>
              <input
                v-model="rolForm.nombre"
                type="text"
                class="form-control"
                placeholder="Ej: editor, revisor, etc."
              />
              <small class="text-muted">Debe ser único y sin espacios</small>
            </div>

            <div class="mb-3">
              <label class="form-label"><strong>Descripción</strong></label>
              <textarea
                v-model="rolForm.descripcion"
                class="form-control"
                rows="3"
                placeholder="Describe el propósito de este rol"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="mostrarModalCrear = false; mostrarModalEditar = false;"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="guardarRol"
              :disabled="!rolForm.nombre"
            >
              <span v-if="guardandoRol" class="spinner-border spinner-border-sm me-2"></span>
              {{ mostrarModalEditar ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminRoles',
  data() {
    return {
      roles: [],
      rolSeleccionado: null,
      permisosDisponibles: null,
      permisosModificados: false,
      cargando: false,
      guardandoPermisos: false,
      guardandoRol: false,
      mostrarModalCrear: false,
      mostrarModalEditar: false,
      rolForm: {
        nombre: '',
        descripcion: ''
      }
    };
  },
  mounted() {
    this.cargarRoles();
    this.cargarPermisosDisponibles();
  },
  methods: {
    async cargarRoles() {
      try {
        this.cargando = true;
        const response = await fetch('/api/admin/roles', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Error cargando roles');

        this.roles = await response.json();
        if (this.roles.length > 0) {
          this.seleccionarRol(this.roles[0]);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los roles: ' + error.message);
      } finally {
        this.cargando = false;
      }
    },

    async cargarPermisosDisponibles() {
      try {
        const response = await fetch('/api/admin/roles/estructura/permisos', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Error cargando permisos');

        this.permisosDisponibles = await response.json();
      } catch (error) {
        console.error('Error:', error);
      }
    },

    seleccionarRol(rol) {
      this.rolSeleccionado = rol;
      this.permisosModificados = false;
    },

    esGrupoCompleto(clave) {
      if (!this.rolSeleccionado || !this.permisosDisponibles) return false;
      const grupo = this.permisosDisponibles[clave];
      return Object.keys(grupo.permisos).every(permiso =>
        this.rolSeleccionado.permisos[permiso] === true
      );
    },

    toggleGrupo(clave) {
      if (!this.rolSeleccionado || !this.permisosDisponibles) return;

      const grupo = this.permisosDisponibles[clave];
      const esCompleto = this.esGrupoCompleto(clave);

      Object.keys(grupo.permisos).forEach(permiso => {
        this.rolSeleccionado.permisos[permiso] = !esCompleto;
      });

      this.permisosModificados = true;
    },

    togglePermiso(permiso, valor) {
      if (!this.rolSeleccionado) return;
      this.rolSeleccionado.permisos[permiso] = valor;
      this.permisosModificados = true;
    },

    async guardarPermisos() {
      try {
        this.guardandoPermisos = true;
        const response = await fetch(`/api/admin/roles/${this.rolSeleccionado.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permisos: this.rolSeleccionado.permisos
          })
        });

        if (!response.ok) throw new Error('Error guardando permisos');

        const data = await response.json();
        this.rolSeleccionado = data.role;
        this.permisosModificados = false;
        alert('✅ Permisos guardados correctamente');
      } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar permisos: ' + error.message);
      } finally {
        this.guardandoPermisos = false;
      }
    },

    editarRol() {
      this.rolForm = {
        nombre: this.rolSeleccionado.nombre,
        descripcion: this.rolSeleccionado.descripcion
      };
      this.mostrarModalEditar = true;
    },

    async guardarRol() {
      try {
        if (!this.rolForm.nombre.trim()) {
          alert('El nombre del rol es requerido');
          return;
        }

        this.guardandoRol = true;
        const url = this.mostrarModalEditar
          ? `/api/admin/roles/${this.rolSeleccionado.id}`
          : '/api/admin/roles';
        const method = this.mostrarModalEditar ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: this.rolForm.nombre,
            descripcion: this.rolForm.descripcion,
            permisos: this.mostrarModalEditar ? undefined : {}
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error desconocido');
        }

        const data = await response.json();
        alert('✅ ' + data.message);

        this.mostrarModalCrear = false;
        this.mostrarModalEditar = false;
        this.rolForm = { nombre: '', descripcion: '' };
        await this.cargarRoles();
      } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
      } finally {
        this.guardandoRol = false;
      }
    },

    async eliminarRol() {
      if (!confirm(`¿Estás seguro de que deseas eliminar el rol "${this.rolSeleccionado.nombre}"?`)) {
        return;
      }

      try {
        const response = await fetch(`/api/admin/roles/${this.rolSeleccionado.id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error desconocido');
        }

        const data = await response.json();
        alert('✅ ' + data.message);
        await this.cargarRoles();
      } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
      }
    },

    formatearFecha(fecha) {
      if (!fecha) return 'N/A';
      return new Date(fecha).toLocaleString('es-ES');
    }
  }
};
</script>

<style scoped>
.list-group-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}

.list-group-item.active {
  background-color: #0d6efd;
  color: white;
}

.permissions-container {
  max-height: 600px;
  overflow-y: auto;
}

.card {
  border: 1px solid #dee2e6;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-header {
  border-bottom: 1px solid #dee2e6;
}

code {
  background-color: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.85rem;
}

.form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.badge {
  font-size: 0.75rem;
  padding: 0.35rem 0.65rem;
}

/* Responsive styles */
@media (max-width: 768px) {
  .permissions-container {
    max-height: 400px;
  }

  .list-group-item {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .card {
    margin-bottom: 1rem;
  }

  .form-check {
    margin-bottom: 0.75rem;
  }

  .btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 576px) {
  .permissions-container {
    max-height: 300px;
  }

  .list-group-item {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .card {
    margin-bottom: 0.75rem;
    border-radius: 6px;
  }

  .card-header {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .card-body {
    padding: 0.75rem;
  }

  .form-check {
    margin-bottom: 0.5rem;
  }

  .form-check-label {
    font-size: 0.85rem;
    margin-bottom: 0;
  }

  .form-control,
  .form-select {
    font-size: 16px;
    padding: 0.4rem;
  }

  .btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }

  .badge {
    font-size: 0.65rem;
    padding: 0.25rem 0.5rem;
  }

  code {
    font-size: 0.75rem;
  }

  h3, h4, h5 {
    font-size: 1rem;
  }
}
</style>
