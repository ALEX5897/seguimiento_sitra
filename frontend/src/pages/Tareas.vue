<template>
  <div class="container-fluid p-4">
    <!-- Encabezado -->
    <div class="mb-5">
      <h1 class="page-title">✅ Tareas Asignadas</h1>
      <p class="text-muted">Gestión de tareas y seguimiento de actividades</p>
    </div>

    <!-- Acciones -->
    <div class="row mb-4">
      <div class="col-auto" v-if="!esSoloLectura">
        <button @click="openCreate" class="btn btn-success">➕ Nueva Tarea</button>
      </div>
    </div>

    <!-- Tabla Mejorada -->
    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table id="tareasTable" class="table table-hover mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Situación</th>
                <th>Número Documento</th>
                <th>Asignado para</th>
                <th>Avance</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id" :class="{ 'table-warning': isUrgent(item), 'table-success': isCompleted(item) }">
                <td><strong>#{{ item.id }}</strong></td>
                <td>
                  <span v-if="isCompleted(item)" class="badge bg-success">✓ Completada</span>
                  <span v-else-if="isUrgent(item)" class="badge bg-warning">⚠️ Urgente</span>
                  <span v-else class="badge bg-info">→ En proceso</span>
                </td>
                <td><strong>{{ item.numero_documento }}</strong></td>
                <td><span>👤</span> {{ item.asignado_para }}</td>
                <td>
                  <div class="progress" style="height: 20px;">
                    <div class="progress-bar" :style="{ width: (parseInt(item.avance) || 0) + '%' }">
                      {{ item.avance || '0%' }}
                    </div>
                  </div>
                </td>
                <td><span class="badge" :class="getStatusClass(item.estado)">{{ item.estado }}</span></td>
                <td>
                  <button class="btn btn-sm btn-primary" @click.prevent="openView(item)" title="Ver detalles">📄</button>
                  <button v-if="!esSoloLectura" class="btn btn-sm btn-warning" @click.prevent="openEdit(item)" title="Editar">✏️</button>
                  <button v-if="!esSoloLectura" class="btn btn-sm btn-danger" @click.prevent="remove(item.id)" title="Eliminar">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de Vista -->
    <div class="modal fade" id="viewModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-bottom bg-light">
            <h5 class="modal-title"><span style="font-size: 1.5rem; margin-right: 8px;">📄</span> Detalles de Tarea</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="viewItem">
            <div class="row">
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">ID</label>
                  <p class="fs-6">{{ viewItem.id }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Número Documento</label>
                  <p class="fs-6">{{ viewItem.numero_documento }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Asignado para</label>
                  <p class="fs-6"><span>👤</span> {{ viewItem.asignado_para }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Avance</label>
                  <div class="fs-6">
                    <div class="progress" style="height: 24px;">
                      <div class="progress-bar bg-info" :style="{ width: (parseInt(viewItem.avance) || 0) + '%' }">
                        {{ viewItem.avance || '0%' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Estado</label>
                  <p class="fs-6"><span class="badge" :class="getStatusClass(viewItem.estado)">{{ viewItem.estado }}</span></p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Nro. Días</label>
                  <p class="fs-6">{{ viewItem.nro_dias }}</p>
                </div>
              </div>
              <div class="col-md-12 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Descripción</label>
                  <p class="fs-6">{{ viewItem.descripcion || '-' }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top bg-light">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <button v-if="!esSoloLectura" type="button" class="btn btn-primary" @click="openEditFromView(viewItem)">✏️ Editar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición -->
    <div class="modal fade" id="tareaModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-bottom bg-light">
            <h5 class="modal-title"><span style="font-size: 1.5rem; margin-right: 8px;">✏️</span> {{ editingId ? 'Editar' : 'Nueva' }} Tarea</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="save">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Número Documento *</label>
                  <input v-model="form.numero_documento" class="form-control" placeholder="Ej: TAREA-2026-001" required />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Avance (%)</label>
                  <input v-model="form.avance" type="number" min="0" max="100" class="form-control" placeholder="0-100" />
                </div>
                <div class="col-md-6 mb-3">
                  <UsuarioSelector 
                    v-model="form.asignado_para"
                    label="Asignado para"
                    placeholder="Buscar usuario..."
                    required
                    @usuarioSeleccionado="onUsuarioSeleccionado"
                  />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Estado</label>
                  <select v-model="form.estado" class="form-select">
                    <option value="">-- Seleccionar estado --</option>
                    <option value="pendiente">pendiente</option>
                    <option value="en_proceso">en_proceso</option>
                    <option value="completada">completada</option>
                    <option value="cancelada">cancelada</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Fecha Asignación</label>
                  <input v-model="form.fecha_asignacion" type="datetime-local" class="form-control" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Fecha Máxima</label>
                  <input v-model="form.fecha_maxima" type="datetime-local" class="form-control" />
                </div>
                <div class="col-md-12 mb-0">
                  <label class="form-label fw-bold">Descripción</label>
                  <textarea v-model="form.descripcion" class="form-control" rows="3" placeholder="Detalles de la tarea..."></textarea>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer border-top bg-light">
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
import api from '../api'
import UsuarioSelector from '../components/UsuarioSelector.vue'
import { showToast, confirmAction } from '../utils/feedback'

export default {
  components: {
    UsuarioSelector
  },
  data() { 
    return { 
      items: [], 
      form: {}, 
      editingId: null, 
      viewItem: null,
      isSaving: false,
      usuarioActual: null,
      refreshHandler: null
    } 
  },
  computed: {
    esSoloLectura() {
      const rol = (this.usuarioActual?.rol || '').toLowerCase();
      return rol === 'solo_vista' || rol === 'solo lectura' || rol === 'lectura';
    }
  },
  mounted() {
    this.refreshHandler = () => this.load();
    window.addEventListener('sistra:data-updated', this.refreshHandler);
    this.cargarUsuarioActual();
    this.load();
  },
  beforeUnmount() {
    if (this.refreshHandler) {
      window.removeEventListener('sistra:data-updated', this.refreshHandler);
    }
  },
  methods: {
    async cargarUsuarioActual() {
      try {
        const response = await api.get('/auth/usuario');
        this.usuarioActual = response.data?.usuario || null;
      } catch (error) {
        this.usuarioActual = null;
      }
    },
    async load() { 
      // Destruir DataTable antes de actualizar datos
      if ($.fn.DataTable.isDataTable('#tareasTable')) {
        $('#tareasTable').DataTable().destroy();
      }
      
      try { 
        const r = await api.get('/tareas'); 
        this.items = r.data; 
      } catch (e) { 
        this.items = [] 
      }
      
      // Esperar a que Vue actualice el DOM
      await this.$nextTick();
      
      // Reinicializar DataTable
      this.initDataTable(); 
    },
    initDataTable() {
      try {
        $('#tareasTable').DataTable({
          paging: true,
          searching: true,
          ordering: true,
          language: { url: 'https://cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json' },
          columnDefs: [{ orderable: false, targets: -1 }]
        });
      } catch (err) { /* ignore if jQuery not loaded */ }
    },
    openCreate() { 
      if (this.esSoloLectura) return;
      this.form = {}; 
      this.editingId = null; 
      const m = new bootstrap.Modal(document.getElementById('tareaModal')); 
      m.show(); 
    },
    openEdit(item) { 
      if (this.esSoloLectura) return;
      this.form = Object.assign({}, item); 
      this.editingId = item.id; 
      const m = new bootstrap.Modal(document.getElementById('tareaModal')); 
      m.show(); 
    },
    openEditFromView(item) {
      if (this.esSoloLectura) return;
      const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewModal'));
      if (viewModal) viewModal.hide();
      this.openEdit(item);
    },
    openView(item) { 
      this.viewItem = item; 
      const m = new bootstrap.Modal(document.getElementById('viewModal')); 
      m.show(); 
    },
    async save() {
      if (this.esSoloLectura) {
        showToast('No tienes permisos para guardar tareas', 'warning');
        return;
      }
      if (!this.form.numero_documento || !this.form.asignado_para) {
        showToast('Por favor completa los campos requeridos (*)', 'warning');
        return;
      }
      this.isSaving = true;
      try {
        if (this.editingId) {
          await api.put(`/tareas/${this.editingId}`, this.form);
        } else {
          await api.post('/tareas', this.form);
        }
        await this.load();
        const mod = bootstrap.Modal.getInstance(document.getElementById('tareaModal')); 
        if (mod) mod.hide();
        showToast('Tarea guardada correctamente', 'success');
      } catch (err) { 
        showToast('Error guardando: ' + (err.response?.data?.message || err.message), 'error');
      } finally {
        this.isSaving = false;
      }
    },
    async remove(id) { 
      if (this.esSoloLectura) {
        showToast('No tienes permisos para eliminar tareas', 'warning');
        return;
      }
      const confirmado = await confirmAction('¿Estás seguro de que deseas eliminar esta tarea?', 'Eliminar tarea');
      if (!confirmado) return;
      try { 
        await api.delete(`/tareas/${id}`);
        // Recargar todos los datos desde el servidor
        await this.load(); 
        showToast('Tarea eliminada correctamente', 'success');
      } catch (err) { 
        showToast('Error al eliminar', 'error');
      } 
    },
    onUsuarioSeleccionado(usuario) {
      if (usuario) {
        this.form.usuario_id = usuario.id;
      }
    },
    isCompleted(item) {
      return (item.estado || '').toLowerCase() === 'completada';
    },
    isUrgent(item) {
      const avance = parseInt(item.avance) || 0;
      const completada = this.isCompleted(item);
      return !completada && avance < 50 && item.fecha_maxima && this.isNearDeadline(item.fecha_maxima);
    },
    isNearDeadline(fecha) {
      if (!fecha) return false;
      const d = new Date(fecha);
      const now = new Date();
      const diff = d.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days <= 3 && days >= 0;
    },
    getStatusClass(status) {
      const s = (status || '').toLowerCase();
      if (s === 'completada') return 'bg-success';
      if (s === 'en_proceso') return 'bg-info';
      if (s === 'cancelada') return 'bg-danger';
      return 'bg-warning';
    }
  }
}
</script>

<style scoped>
.page-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
}

.info-group label {
  display: block;
  margin-bottom: 0.25rem;
}

.info-group p {
  margin: 0;
  color: #555;
}
</style>
