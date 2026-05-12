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
                    <th v-if="isAdmin">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="estado in estados" :key="estado.id">
                    <td><strong>#{{ estado.id }}</strong></td>
                    <td><span style="font-size: 1.5rem;">{{ estado.icono }}</span></td>
                    <td><code>{{ estado.codigo }}</code></td>
                    <td><strong>{{ estado.nombre }}</strong></td>
                    <td class="text-muted">{{ estado.descripcion || '-' }}</td>
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
                        {{ estado.color }}
                      </span>
                    </td>
                    <td>
                      <span v-if="estado.activo" class="badge bg-success">Activo</span>
                      <span v-else class="badge bg-secondary">Inactivo</span>
                    </td>
                    <td v-if="isAdmin">
                      <button class="btn btn-sm btn-primary" @click="openEdit(estado)" title="Editar">✏️</button>
                      <button v-if="estado.activo" class="btn btn-sm btn-danger" @click="desactivar(estado.id)" title="Desactivar">🗑️</button>
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
      // Verificar si es administrador
      const rol = localStorage.getItem('userRole') || '';
      this.isAdmin = rol.toLowerCase().includes('admin');
    },
    async cargarEstados() {
      try {
        this.loading = true;
        const response = await api.get('/catalogos/estados-reasignados');
        this.estados = response.data;
      } catch (err) {
        showToast('Error cargando estados: ' + err.message, 'error');
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
    async save() {
      try {
        if (!this.form.codigo || !this.form.nombre) {
          showToast('Código y Nombre son requeridos', 'warning');
          return;
        }

        this.isSaving = true;

        if (this.editingId) {
          // Actualizar
          await api.put(`/catalogos/estados-reasignados/${this.editingId}`, this.form);
          showToast('✓ Estado actualizado', 'success');
        } else {
          // Crear
          await api.post('/catalogos/estados-reasignados', this.form);
          showToast('✓ Estado creado', 'success');
        }

        // Cerrar modal
        const modal = window.bootstrap.Modal.getInstance(document.getElementById('modalEstado'));
        modal.hide();

        // Recargar
        await this.cargarEstados();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      } finally {
        this.isSaving = false;
      }
    },
    async desactivar(id) {
      if (!await confirmAction('¿Desactivar este estado?')) return;

      try {
        await api.delete(`/catalogos/estados-reasignados/${id}`);
        showToast('✓ Estado desactivado', 'success');
        await this.cargarEstados();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
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
