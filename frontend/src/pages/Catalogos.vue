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
            class="nav-link active"
            id="estados-tab"
            data-bs-toggle="tab"
            data-bs-target="#estados-content"
            type="button"
            role="tab"
            aria-controls="estados-content"
            aria-selected="true">
            <i class="bi bi-tags me-2"></i>Estados de Reasignados
          </button>
        </li>
      </ul>
    </div>

    <!-- Tab content -->
    <div class="tab-content">
      <!-- Estados de Reasignados -->
      <div class="tab-pane fade show active" id="estados-content" role="tabpanel" aria-labelledby="estados-tab">
        <!-- Acciones -->
        <div class="row mb-4">
          <div class="col-auto">
            <button @click="openCreate" class="btn btn-success" v-if="isAdmin">
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
                        <button class="btn btn-primary" @click="openEdit(estado)" title="Editar" :disabled="isSaving">✏️</button>
                        <button v-if="estado.activo" class="btn btn-danger" @click="desactivar(estado.id)" title="Desactivar" :disabled="isSaving">🗑️</button>
                        <button v-else class="btn btn-success" @click="reactivar(estado.id)" title="Reactivar" :disabled="isSaving">↻</button>
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
      form: {},
      editingId: null,
      loading: false,
      isSaving: false,
      isAdmin: false
    };
  },
  mounted() {
    this.cargarPermiso();
    this.cargarEstados();
  },
  methods: {
    cargarPermiso() {
      const rol = localStorage.getItem('userRole') || '';
      this.isAdmin = rol.toLowerCase().includes('admin');
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

    openCreate() {
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

    openEdit(estado) {
      this.editingId = estado.id;
      this.form = { ...estado };
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

        if (this.editingId) {
          // Actualizar
          console.log('Actualizando estado:', this.editingId);
          await api.put(`/catalogos/estados-reasignados/${this.editingId}`, {
            nombre: this.form.nombre,
            descripcion: this.form.descripcion,
            icono: this.form.icono,
            color: this.form.color,
            activo: this.form.activo
          });
          showToast('✓ Estado actualizado correctamente', 'success');
        } else {
          // Crear
          console.log('Creando nuevo estado:', this.form.codigo);
          await api.post('/catalogos/estados-reasignados', {
            codigo: this.form.codigo.toLowerCase(),
            nombre: this.form.nombre,
            descripcion: this.form.descripcion,
            icono: this.form.icono,
            color: this.form.color
          });
          showToast('✓ Estado creado correctamente', 'success');
        }

        // Cerrar modal
        const modalEl = document.getElementById('modalEstado');
        const modal = window.bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // Limpiar formulario
        this.form = {};
        this.editingId = null;

        // Recargar
        await this.cargarEstados();
      } catch (err) {
        console.error('Error al guardar:', err);
        const mensaje = err.response?.data?.error || err.message;
        showToast('❌ Error: ' + mensaje, 'error');
      } finally {
        this.isSaving = false;
      }
    },

    async desactivar(id) {
      const estado = this.estados.find(e => e.id === id);
      if (!estado) return;

      if (!await confirmAction(`¿Desactivar el estado "${estado.nombre}"?`)) {
        return;
      }

      try {
        this.isSaving = true;
        console.log('Desactivando estado:', id);
        await api.delete(`/catalogos/estados-reasignados/${id}`);
        showToast(`✓ Estado "${estado.nombre}" desactivado`, 'success');
        await this.cargarEstados();
      } catch (err) {
        console.error('Error al desactivar:', err);
        const mensaje = err.response?.data?.error || err.message;
        showToast('❌ Error: ' + mensaje, 'error');
      } finally {
        this.isSaving = false;
      }
    },

    async reactivar(id) {
      const estado = this.estados.find(e => e.id === id);
      if (!estado) return;

      if (!await confirmAction(`¿Reactivar el estado "${estado.nombre}"?`)) {
        return;
      }

      try {
        this.isSaving = true;
        console.log('Reactivando estado:', id);
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
        console.error('Error al reactivar:', err);
        const mensaje = err.response?.data?.error || err.message;
        showToast('❌ Error: ' + mensaje, 'error');
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
