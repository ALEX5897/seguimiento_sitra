<template>
  <div class="container-fluid p-4">
    <!-- Encabezado -->
    <div class="mb-5">
      <h1 class="page-title">📮 Documentos Enviados</h1>
      <p class="text-muted">Control de documentos enviados a usuarios</p>
    </div>

    <!-- Acciones -->
    <div class="row mb-4">
      <div class="col-auto">
        <button @click="openCreate" class="btn btn-success">➕ Nuevo Enviado</button>
      </div>
    </div>

    <!-- Tabla Mejorada -->
    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table id="enviadosTable" class="table table-hover mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Número Documento</th>
                <th>Remitente</th>
                <th>Para</th>
                <th>Asunto</th>
                <th>Tipo/Ref.</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id" :class="{ 'table-info': item.estado === 'recibido' }">
                <td><strong>#{{ item.id }}</strong></td>
                <td><strong>{{ item.numero_documento }}</strong></td>
                <td>{{ item.remitente }}</td>
                <td><span>👤</span> {{ item.para }}</td>
                <td><small>{{ item.asunto ? item.asunto.substring(0, 30) + '...' : '-' }}</small></td>
                <td>
                  <small class="text-muted">
                    {{ item.tipo_documento }}<br/>
                    {{ item.no_referencia }}
                  </small>
                </td>
                <td><span class="badge" :class="getStatusClass(item.estado)">{{ item.estado }}</span></td>
                <td>
                  <button class="btn btn-sm btn-primary" @click.prevent="openView(item)" title="Ver detalles">📄</button>
                  <button class="btn btn-sm btn-warning" @click.prevent="openEdit(item)" title="Editar">✏️</button>
                  <button class="btn btn-sm btn-danger" @click.prevent="remove(item.id)" title="Eliminar">🗑️</button>
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
            <h5 class="modal-title"><span style="font-size: 1.5rem; margin-right: 8px;">📄</span> Detalles del Documento Enviado</h5>
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
                  <label class="fw-bold text-muted small">Remitente</label>
                  <p class="fs-6">{{ viewItem.remitente }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Para</label>
                  <p class="fs-6"><span>👤</span> {{ viewItem.para }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Tipo Documento</label>
                  <p class="fs-6">{{ viewItem.tipo_documento || '-' }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">No. Referencia</label>
                  <p class="fs-6">{{ viewItem.no_referencia || '-' }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Nro. Trámite</label>
                  <p class="fs-6">{{ viewItem.nro_tramite || '-' }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Fecha Documento</label>
                  <p class="fs-6">{{ formatDate(viewItem.fecha_documento) }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Estado</label>
                  <p class="fs-6"><span class="badge" :class="getStatusClass(viewItem.estado)">{{ viewItem.estado }}</span></p>
                </div>
              </div>
              <div class="col-md-12 mb-0">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Asunto</label>
                  <p class="fs-6">{{ viewItem.asunto || '-' }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top bg-light">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <button type="button" class="btn btn-primary" @click="openEditFromView(viewItem)">✏️ Editar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición -->
    <div class="modal fade" id="enviadoModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-bottom bg-light">
            <h5 class="modal-title"><span style="font-size: 1.5rem; margin-right: 8px;">✏️</span> {{ editingId ? 'Editar' : 'Nuevo' }} Enviado</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="save">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Número Documento *</label>
                  <input v-model="form.numero_documento" class="form-control" placeholder="Ej: ENV-2026-001" required />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Remitente</label>
                  <input v-model="form.remitente" class="form-control" placeholder="Departamento/Persona que envía" />
                </div>
                <div class="col-md-6 mb-3">
                  <UsuarioSelector 
                    v-model="form.para"
                    label="Para"
                    placeholder="Buscar usuario..."
                    required
                    @usuarioSeleccionado="onUsuarioSeleccionado"
                  />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Fecha Documento</label>
                  <input v-model="form.fecha_documento" type="datetime-local" class="form-control" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Tipo Documento</label>
                  <input v-model="form.tipo_documento" class="form-control" placeholder="Ej: Contrato, Memorando" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">No. Referencia</label>
                  <input v-model="form.no_referencia" class="form-control" placeholder="Referencia" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Nro. Trámite</label>
                  <input v-model="form.nro_tramite" class="form-control" placeholder="Número de trámite" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Estado</label>
                  <select v-model="form.estado" class="form-select">
                    <option value="">-- Seleccionar estado --</option>
                    <option value="enviado">enviado</option>
                    <option value="recibido">recibido</option>
                    <option value="leído">leído</option>
                    <option value="archivado">archivado</option>
                  </select>
                </div>
                <div class="col-md-12 mb-0">
                  <label class="form-label fw-bold">Asunto</label>
                  <input v-model="form.asunto" class="form-control" placeholder="Asunto del documento" />
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
      refreshHandler: null 
    } 
  },
  mounted() {
    this.refreshHandler = () => this.load();
    window.addEventListener('sistra:data-updated', this.refreshHandler);
    this.load();
  },
  beforeUnmount() {
    if (this.refreshHandler) {
      window.removeEventListener('sistra:data-updated', this.refreshHandler);
    }
  },
  methods: {
    async load() { 
      // Destruir DataTable antes de actualizar datos
      if ($.fn.DataTable.isDataTable('#enviadosTable')) {
        $('#enviadosTable').DataTable().destroy();
      }
      
      try { 
        const r = await api.get('/enviados'); 
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
        $('#enviadosTable').DataTable({
          paging: true,
          searching: true,
          ordering: true,
          language: { url: 'https://cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json' },
          columnDefs: [{ orderable: false, targets: -1 }]
        });
      } catch (err) { /* ignore if jQuery not loaded */ }
    },
    openCreate() { 
      this.form = {}; 
      this.editingId = null; 
      const m = new bootstrap.Modal(document.getElementById('enviadoModal')); 
      m.show(); 
    },
    openEdit(item) { 
      this.form = Object.assign({}, item); 
      this.editingId = item.id; 
      const m = new bootstrap.Modal(document.getElementById('enviadoModal')); 
      m.show(); 
    },
    openEditFromView(item) {
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
      if (!this.form.numero_documento || !this.form.para) {
        showToast('Por favor completa los campos requeridos (*)', 'warning');
        return;
      }
      this.isSaving = true;
      try {
        if (this.editingId) {
          await api.put(`/enviados/${this.editingId}`, this.form);
        } else {
          await api.post('/enviados', this.form);
        }
        await this.load();
        const mod = bootstrap.Modal.getInstance(document.getElementById('enviadoModal')); 
        if (mod) mod.hide();
        showToast('Documento guardado correctamente', 'success');
      } catch (err) { 
        showToast('Error guardando: ' + (err.response?.data?.message || err.message), 'error');
      } finally {
        this.isSaving = false;
      }
    },
    async remove(id) { 
      const confirmado = await confirmAction('¿Estás seguro de que deseas eliminar este documento?', 'Eliminar documento');
      if (!confirmado) return;
      try { 
        await api.delete(`/enviados/${id}`);
        // Recargar todos los datos desde el servidor
        await this.load(); 
        showToast('Documento eliminado correctamente', 'success');
      } catch (err) { 
        showToast('Error al eliminar', 'error');
      } 
    },
    onUsuarioSeleccionado(usuario) {
      if (usuario) {
        this.form.usuario_id = usuario.id;
      }
    },
    getStatusClass(status) {
      const s = (status || '').toLowerCase();
      if (s === 'recibido' || s === 'leído') return 'bg-success';
      if (s === 'enviado') return 'bg-info';
      if (s === 'archivado') return 'bg-warning';
      return 'bg-secondary';
    },
    formatDate(d) {
      if (!d) return '-';
      if (typeof d === 'string') d = new Date(d);
      if (!(d instanceof Date)) return '-';
      return d.toLocaleString('es-ES', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
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
