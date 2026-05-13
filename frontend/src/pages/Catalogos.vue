<template>
  <div class="container-fluid p-4">
    <!-- Encabezado -->
    <div class="mb-5">
      <h1 class="page-title">📋 Catálogos del Sistema</h1>
      <p class="text-muted">Gestión de valores fijos y dominios</p>
    </div>

    <!-- Tab navigation -->
    <div class="mb-4">
      <ul class="nav nav-tabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'estados' }"
            @click="activeTab = 'estados'"
            type="button"
            role="tab">
            <i class="bi bi-tags me-2"></i>Estados de Reasignados
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'importancias' }"
            @click="activeTab = 'importancias'"
            type="button"
            role="tab">
            <i class="bi bi-exclamation-circle me-2"></i>Importancias
          </button>
        </li>
      </ul>
    </div>

    <!-- Tab content -->
    <div class="tab-content">
      <!-- Estados de Reasignados -->
      <div v-if="activeTab === 'estados'" class="tab-pane fade show active">
        <!-- Acciones -->
        <div class="row mb-4">
          <div class="col-auto">
            <button @click="openCreateEstado" class="btn btn-success" v-if="isAdmin">
              ➕ Nuevo Estado
            </button>
          </div>
        </div>

        <!-- Tabla de Estados -->
        <div class="card">
          <div class="card-header bg-light">
            <span>📊</span> Estados de Reasignados
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover mb-0" v-if="estados.length > 0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Icono</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Color</th>
                    <th>Estado</th>
                    <th v-if="isAdmin" style="width: 150px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="estado in estados" :key="estado.id" :class="{ 'table-secondary': !estado.activo }">
                    <td><strong>#{{ estado.id }}</strong></td>
                    <td><span style="font-size: 1.5rem;">{{ estado.icono || '◯' }}</span></td>
                    <td><code>{{ estado.codigo }}</code></td>
                    <td><strong>{{ estado.nombre }}</strong></td>
                    <td class="text-muted" style="max-width: 200px; white-space: normal;">{{ estado.descripcion || '-' }}</td>
                    <td>
                      <span
                        class="badge"
                        :class="{
                          'bg-primary': estado.color === 'primary',
                          'bg-secondary': estado.color === 'secondary',
                          'bg-success': estado.color === 'success',
                          'bg-danger': estado.color === 'danger',
                          'bg-warning text-dark': estado.color === 'warning',
                          'bg-info': estado.color === 'info',
                          'bg-light text-dark': estado.color === 'light',
                          'bg-dark': estado.color === 'dark'
                        }">
                        {{ estado.color || 'ninguno' }}
                      </span>
                    </td>
                    <td>
                      <span v-if="estado.activo" class="badge bg-success">✓ Activo</span>
                      <span v-else class="badge bg-secondary">✗ Inactivo</span>
                    </td>
                    <td v-if="isAdmin">
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary" @click="openEditEstado(estado)" title="Editar" :disabled="isSaving">✏️</button>
                        <button v-if="estado.activo" class="btn btn-danger" @click="desactivarEstado(estado.id)" title="Desactivar" :disabled="isSaving">🗑️</button>
                        <button v-else class="btn btn-success" @click="reactivarEstado(estado.id)" title="Reactivar" :disabled="isSaving">↻</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="text-center py-4 text-muted">
                <span>ℹ️</span> Sin catálogos disponibles
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Importancias -->
      <div v-if="activeTab === 'importancias'" class="tab-pane fade show active">
        <!-- Acciones -->
        <div class="row mb-4">
          <div class="col-auto">
            <button @click="openCreateImportancia" class="btn btn-success" v-if="isAdmin">
              ➕ Nueva Importancia
            </button>
          </div>
        </div>

        <!-- Tabla de Importancias -->
        <div class="card">
          <div class="card-header bg-light">
            <span>⚡</span> Importancias
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover mb-0" v-if="importancias.length > 0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Icono</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Color</th>
                    <th>Estado</th>
                    <th v-if="isAdmin" style="width: 150px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="imp in importancias" :key="imp.id" :class="{ 'table-secondary': !imp.activo }">
                    <td><strong>#{{ imp.id }}</strong></td>
                    <td><span style="font-size: 1.5rem;">{{ imp.icono || '◯' }}</span></td>
                    <td><code>{{ imp.codigo }}</code></td>
                    <td><strong>{{ imp.nombre }}</strong></td>
                    <td class="text-muted" style="max-width: 200px; white-space: normal;">{{ imp.descripcion || '-' }}</td>
                    <td>
                      <span
                        class="badge"
                        :class="{
                          'bg-primary': imp.color === 'primary',
                          'bg-secondary': imp.color === 'secondary',
                          'bg-success': imp.color === 'success',
                          'bg-danger': imp.color === 'danger',
                          'bg-warning text-dark': imp.color === 'warning',
                          'bg-info': imp.color === 'info',
                          'bg-light text-dark': imp.color === 'light',
                          'bg-dark': imp.color === 'dark'
                        }">
                        {{ imp.color || 'ninguno' }}
                      </span>
                    </td>
                    <td>
                      <span v-if="imp.activo" class="badge bg-success">✓ Activo</span>
                      <span v-else class="badge bg-secondary">✗ Inactivo</span>
                    </td>
                    <td v-if="isAdmin">
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary" @click="openEditImportancia(imp)" title="Editar" :disabled="isSaving">✏️</button>
                        <button v-if="imp.activo" class="btn btn-danger" @click="desactivarImportancia(imp.id)" title="Desactivar" :disabled="isSaving">🗑️</button>
                        <button v-else class="btn btn-success" @click="reactivarImportancia(imp.id)" title="Reactivar" :disabled="isSaving">↻</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="text-center py-4 text-muted">
                <span>ℹ️</span> Sin importancias disponibles
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Crear/Editar -->
    <div class="modal fade" id="modalEstado" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingId ? 'Editar Estado' : 'Nuevo Estado' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="save">
              <div class="mb-3">
                <label class="form-label fw-bold">Código *</label>
                <input v-model="form.codigo" type="text" class="form-control" placeholder="ej: pendiente" required :disabled="editingId" />
                <small class="text-muted">No se puede cambiar después de crear</small>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Nombre *</label>
                <input v-model="form.nombre" type="text" class="form-control" placeholder="ej: Pendiente" required />
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Descripción</label>
                <textarea v-model="form.descripcion" class="form-control" rows="3" placeholder="Descripción del estado..."></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Icono</label>
                <input v-model="form.icono" type="text" class="form-control" placeholder="ej: ⏳" maxlength="2" />
                <small class="text-muted">Un emoji (opcional)</small>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Color Bootstrap</label>
                <select v-model="form.color" class="form-select">
                  <option value="">-- Sin color --</option>
                  <option value="primary">Primary (Azul)</option>
                  <option value="secondary">Secondary (Gris)</option>
                  <option value="success">Success (Verde)</option>
                  <option value="danger">Danger (Rojo)</option>
                  <option value="warning">Warning (Amarillo)</option>
                  <option value="info">Info (Cyan)</option>
                  <option value="light">Light (Claro)</option>
                  <option value="dark">Dark (Oscuro)</option>
                </select>
              </div>
              <div v-if="editingId" class="mb-3">
                <label class="form-label fw-bold">Activo</label>
                <div class="form-check form-switch">
                  <input v-model="form.activo" type="checkbox" class="form-check-input" id="activoCheck" />
                  <label class="form-check-label" for="activoCheck">
                    {{ form.activo ? 'Activo' : 'Inactivo' }}
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" @click="save" :disabled="isSaving">
              <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
              💾 Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';
import { showToast, confirmAction } from '../utils/feedback';

export default {
  name: 'Catalogos',
  data() {
    return {
      estados: [],
      importancias: [],
      form: {},
      editingId: null,
      loading: false,
      isSaving: false,
      isAdmin: false,
      activeTab: 'estados',
      usuarioActual: null
    };
  },
  mounted() {
    this.cargarPermiso();
    this.cargarEstados();
    this.cargarImportancias();
  },
  methods: {
    async cargarPermiso() {
      try {
        const response = await api.get('/auth/usuario');
        if (response.data && response.data.usuario) {
          this.usuarioActual = response.data.usuario;
          const rol = (response.data.usuario.rol || '').toLowerCase();
          this.isAdmin = rol.includes('admin');
          console.log('✓ Rol cargado:', response.data.usuario.rol, 'isAdmin:', this.isAdmin);
        }
      } catch (error) {
        console.error('Error cargando permiso:', error);
        this.isAdmin = false;
      }
    },

    async cargarEstados() {
      try {
        this.loading = true;
        const response = await api.get('/catalogos/estados-reasignados');
        this.estados = response.data || [];
        console.log('✓ Estados cargados:', this.estados.length);
      } catch (err) {
        showToast('❌ Error cargando estados: ' + err.message, 'error');
        console.error('Error:', err);
      } finally {
        this.loading = false;
      }
    },

    async cargarImportancias() {
      try {
        const response = await api.get('/catalogos/importancias');
        this.importancias = response.data || [];
        console.log('✓ Importancias cargadas:', this.importancias.length);
      } catch (err) {
        console.error('Error cargando importancias:', err);
        this.importancias = [];
      }
    },

    openCreateEstado() {
      this.activeTab = 'estados';
      this.editingId = null;
      this.form = {
        codigo: '',
        nombre: '',
        descripcion: '',
        icono: '',
        color: 'primary',
        activo: true
      };
      this.abrirModal();
    },

    openEditEstado(estado) {
      this.activeTab = 'estados';
      this.editingId = estado.id;
      this.form = { ...estado };
      this.abrirModal();
    },

    openCreateImportancia() {
      this.activeTab = 'importancias';
      this.editingId = null;
      this.form = {
        codigo: '',
        nombre: '',
        descripcion: '',
        icono: '',
        color: 'primary',
        activo: true
      };
      this.abrirModal();
    },

    openEditImportancia(imp) {
      this.activeTab = 'importancias';
      this.editingId = imp.id;
      this.form = { ...imp };
      this.abrirModal();
    },

    abrirModal() {
      const modal = new window.bootstrap.Modal(document.getElementById('modalEstado'));
      modal.show();
    },

    validarFormulario() {
      const errores = [];

      if (!this.form.codigo || this.form.codigo.trim() === '') {
        errores.push('El código es requerido');
      } else if (!/^[a-z_]+$/.test(this.form.codigo)) {
        errores.push('El código debe contener solo letras minúsculas y guiones bajos');
      }

      if (!this.form.nombre || this.form.nombre.trim() === '') {
        errores.push('El nombre es requerido');
      } else if (this.form.nombre.length > 100) {
        errores.push('El nombre no puede exceder 100 caracteres');
      }

      if (this.form.icono && this.form.icono.length > 2) {
        errores.push('El icono debe ser máximo 2 caracteres');
      }

      if (errores.length > 0) {
        showToast('⚠️ ' + errores[0], 'warning');
        return false;
      }

      return true;
    },

    async save() {
      try {
        if (!this.validarFormulario()) {
          return;
        }

        this.isSaving = true;
        const isEstado = this.activeTab === 'estados';
        const endpoint = isEstado ? '/catalogos/estados-reasignados' : '/catalogos/importancias';

        if (this.editingId) {
          // Actualizar
          console.log(`Actualizando ${isEstado ? 'estado' : 'importancia'}:`, this.editingId);
          await api.put(`${endpoint}/${this.editingId}`, {
            nombre: this.form.nombre,
            descripcion: this.form.descripcion,
            icono: this.form.icono,
            color: this.form.color,
            activo: this.form.activo
          });
          showToast(`✓ ${isEstado ? 'Estado' : 'Importancia'} actualizado correctamente`, 'success');
        } else {
          // Crear
          console.log(`Creando nuevo ${isEstado ? 'estado' : 'importancia'}:`, this.form.codigo);
          await api.post(endpoint, {
            codigo: this.form.codigo.toLowerCase(),
            nombre: this.form.nombre,
            descripcion: this.form.descripcion,
            icono: this.form.icono,
            color: this.form.color
          });
          showToast(`✓ ${isEstado ? 'Estado' : 'Importancia'} creado correctamente`, 'success');
        }

        // Cerrar modal
        const modalEl = document.getElementById('modalEstado');
        const modal = window.bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // Limpiar formulario
        this.form = {};
        this.editingId = null;

        // Recargar
        if (isEstado) {
          await this.cargarEstados();
        } else {
          await this.cargarImportancias();
        }
      } catch (err) {
        console.error('Error al guardar:', err);
        const mensaje = err.response?.data?.error || err.message;
        showToast('❌ Error: ' + mensaje, 'error');
      } finally {
        this.isSaving = false;
      }
    },

    async desactivarEstado(id) {
      const estado = this.estados.find(e => e.id === id);
      if (!estado) return;

      if (!await confirmAction(`¿Desactivar el estado "${estado.nombre}"?`)) {
        return;
      }

      try {
        this.isSaving = true;
        await api.delete(`/catalogos/estados-reasignados/${id}`);
        showToast(`✓ Estado "${estado.nombre}" desactivado`, 'success');
        await this.cargarEstados();
      } catch (err) {
        console.error('Error:', err);
        showToast('❌ Error: ' + (err.response?.data?.error || err.message), 'error');
      } finally {
        this.isSaving = false;
      }
    },

    async reactivarEstado(id) {
      const estado = this.estados.find(e => e.id === id);
      if (!estado) return;

      if (!await confirmAction(`¿Reactivar el estado "${estado.nombre}"?`)) {
        return;
      }

      try {
        this.isSaving = true;
        await api.put(`/catalogos/estados-reasignados/${id}`, {
          nombre: estado.nombre,
          descripcion: estado.descripcion,
          icono: estado.icono,
          color: estado.color,
          activo: true
        });
        showToast(`✓ Estado "${estado.nombre}" reactivado`, 'success');
        await this.cargarEstados();
      } catch (err) {
        console.error('Error:', err);
        showToast('❌ Error: ' + (err.response?.data?.error || err.message), 'error');
      } finally {
        this.isSaving = false;
      }
    },

    async desactivarImportancia(id) {
      const imp = this.importancias.find(i => i.id === id);
      if (!imp) return;

      if (!await confirmAction(`¿Desactivar la importancia "${imp.nombre}"?`)) {
        return;
      }

      try {
        this.isSaving = true;
        await api.delete(`/catalogos/importancias/${id}`);
        showToast(`✓ Importancia "${imp.nombre}" desactivada`, 'success');
        await this.cargarImportancias();
      } catch (err) {
        console.error('Error:', err);
        showToast('❌ Error: ' + (err.response?.data?.error || err.message), 'error');
      } finally {
        this.isSaving = false;
      }
    },

    async reactivarImportancia(id) {
      const imp = this.importancias.find(i => i.id === id);
      if (!imp) return;

      if (!await confirmAction(`¿Reactivar la importancia "${imp.nombre}"?`)) {
        return;
      }

      try {
        this.isSaving = true;
        await api.put(`/catalogos/importancias/${id}`, {
          nombre: imp.nombre,
          descripcion: imp.descripcion,
          icono: imp.icono,
          color: imp.color,
          activo: true
        });
        showToast(`✓ Importancia "${imp.nombre}" reactivada`, 'success');
        await this.cargarImportancias();
      } catch (err) {
        console.error('Error:', err);
        showToast('❌ Error: ' + (err.response?.data?.error || err.message), 'error');
      } finally {
        this.isSaving = false;
      }
    }
  }
};
</script>

<style scoped>
.page-title {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}

.nav-tabs .nav-link {
  color: #666;
  border-bottom: 2px solid #ddd;
}

.nav-tabs .nav-link.active {
  color: #007bff;
  border-bottom: 2px solid #007bff;
  background: none;
}

.nav-tabs .nav-link:hover {
  color: #007bff;
}

.card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  border-radius: 8px 8px 0 0;
  border: none;
  font-weight: 500;
}

.table-hover tbody tr:hover {
  background-color: #f5f5f5;
}

code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  color: #d63384;
}
</style>
