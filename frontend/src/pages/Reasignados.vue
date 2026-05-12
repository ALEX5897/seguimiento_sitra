<template>
  <div class="container-fluid p-4">
    <!-- Encabezado -->
    <div class="mb-5">
      <h1 class="page-title">📋 Documentos Reasignados</h1>
      <p class="text-muted">Gestión de documentos reasignados y control de plazos</p>
    </div>

    <!-- Acciones -->
    <div class="row mb-4">
      <div class="col-auto" v-if="!esSoloLectura">
        <input ref="fileInput" type="file" accept=".xlsx" class="d-none" @change="onFile" />

        <button @click="openCreate" class="btn btn-success">
          ➕ Nuevo Reasignado
        </button>
      </div>
    </div>

    <!-- Filtros Activos y Buscador Global -->
    <div class="row mb-3 align-items-center">
      <div class="col-md-6">
        <div class="input-group">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input
            v-model="busqueda"
            type="text"
            class="form-control"
            placeholder="Buscar por documento, estado, tipo..."
            autocomplete="off"
          />
          <button v-if="busqueda" @click="busqueda = ''" class="btn btn-outline-secondary" type="button">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
      <div class="col-md-6 text-end text-muted small">
        <div v-if="filtroActivo" class="mb-2">
          <span class="badge bg-primary me-2">
            {{ filtroActivo }}
            <button @click="limpiarFiltro" class="btn-close btn-close-white ms-2" style="width: 0.6rem; height: 0.6rem;"></button>
          </span>
        </div>
        {{ itemsFiltrados.length }} resultado(s)
        <span v-if="busqueda"> para "<strong>{{ busqueda }}</strong>"</span>
      </div>
    </div>

    <!-- Tabla Mejorada -->
    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Situación</th>
                <th>Días Expirados</th>
                <th>Número Documento</th>
                <th>Tipo Documento</th>
                <th>Importancia</th>
                <th>Nro. Trámite</th>
                <th>Fecha Máx. Respuesta</th>
                <th>Reasignado a</th>
                <th>Correo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in itemsPaginados" :key="item.id" :class="{ 'table-danger': isExpired(item) }">
                <td><strong>#{{ item.id }}</strong></td>
                <td>
                  <span v-if="hasDeadline(item)" :class="isExpired(item) ? 'badge bg-danger' : 'badge bg-success'">
                    {{ isExpired(item) ? '❌ Expirado' : '✓ A tiempo' }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <span v-if="hasDeadline(item)" :class="isExpired(item) ? 'text-danger fw-bold' : 'text-muted'">
                    {{ getDaysExpiredOrRemaining(item) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td><strong>{{ item.numero_documento }}</strong></td>
                <td>{{ item.tipo_documento }}</td>
                <td>
                  <span v-if="item.importancia" :class="getImportanceClass(item.importancia)" class="badge">
                    {{ item.importancia }}
                  </span>
                </td>
                <td>{{ item.numero_tramite }}</td>
                <td>{{ formatDate(getDeadline(item)) }}</td>
                <td><span>👤</span> {{ item.reasignado_a }}</td>
                <td><small class="text-muted">{{ item.correo || '-' }}</small></td>
                <td><span class="badge bg-info">{{ item.estado }}</span></td>
                <td>
                  <button class="btn btn-sm btn-primary" @click.prevent="openView(item)" title="Ver detalles">📄</button>
                  <button v-if="!esSoloLectura" class="btn btn-sm btn-warning" @click.prevent="openEdit(item)" title="Editar">✏️</button>
                  <button v-if="!esSoloLectura" class="btn btn-sm btn-danger" @click.prevent="remove(item.id)" title="Eliminar">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div class="text-muted small">
            Mostrando {{ Math.min((paginaActual-1)*porPagina+1, itemsFiltrados.length) }}–
            {{ Math.min(paginaActual*porPagina, itemsFiltrados.length) }}
            de {{ itemsFiltrados.length }}
          </div>
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: paginaActual === 1 }">
                <button class="page-link" @click="paginaActual--" type="button">‹</button>
              </li>
              <li v-for="p in totalPaginas" :key="p" class="page-item" :class="{ active: p === paginaActual }">
                <button class="page-link" @click="paginaActual = p" type="button">{{ p }}</button>
              </li>
              <li class="page-item" :class="{ disabled: paginaActual === totalPaginas }">
                <button class="page-link" @click="paginaActual++" type="button">›</button>
              </li>
            </ul>
          </nav>
          <select v-model.number="porPagina" class="form-select form-select-sm" style="width:auto">
            <option :value="10">10</option>
            <option :value="15">15</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Modal de Vista -->
    <div class="modal fade" id="viewModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-bottom bg-light">
            <h5 class="modal-title"><span style="font-size: 1.5rem; margin-right: 8px;">📄</span> Detalles del Documento</h5>
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
                  <label class="fw-bold text-muted small">Tipo Documento</label>
                  <p class="fs-6">{{ viewItem.tipo_documento }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Nro. Trámite</label>
                  <p class="fs-6">{{ viewItem.numero_tramite }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Fecha Documento</label>
                  <p class="fs-6">{{ viewItem.fecha_documento }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Fecha Reasignación</label>
                  <p class="fs-6">{{ viewItem.fecha_reasignacion }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Fecha Máx. Respuesta</label>
                  <p class="fs-6">{{ formatDate(getDeadline(viewItem)) }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Reasignado a</label>
                  <p class="fs-6"><span>👤</span> {{ viewItem.reasignado_a }}</p>
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
                  <label class="fw-bold text-muted small">Destinatario</label>
                  <p class="fs-6">{{ viewItem.destinatario }}</p>
                </div>
              </div>
              <div class="col-md-12 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Asunto</label>
                  <p class="fs-6">{{ viewItem.asunto }}</p>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Estado</label>
                  <p class="fs-6"><span class="badge bg-info">{{ viewItem.estado }}</span></p>
                </div>
              </div>
              <div class="col-md-12 mb-0">
                <div class="info-group">
                  <label class="fw-bold text-muted small">Comentario</label>
                  <p class="fs-6">{{ viewItem.comentario || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Componente de comentarios -->
            <comentarios-reasignados 
              :key="viewItem.id"
              :reasignado-id="viewItem.id"
              :usuario-actual="usuarioActual"
              @actualizar="load"
            />
          </div>
          <div class="modal-footer border-top bg-light">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <button v-if="!esSoloLectura" type="button" class="btn btn-primary" @click="openEditFromView(viewItem)">✏️ Editar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición Completa -->
    <div class="modal fade" id="reasignModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-bottom bg-light">
            <h5 class="modal-title"><span style="font-size: 1.5rem; margin-right: 8px;">✏️</span> {{ editingId ? 'Editar' : 'Nuevo' }} Reasignado</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="save">
              <!-- Sección de importación de datos tabulados -->
              <div class="row mb-4 p-3" style="background: #f8f9fa; border-radius: 8px; border-left: 4px solid #34446C;">
                <div class="col-12">
                  <label class="form-label fw-bold mb-2">📋 Llenar datos desde información tabulada</label>
                  <textarea
                    v-model="pastedData"
                    class="form-control mb-2"
                    rows="2"
                    placeholder="Pega aquí los 12 valores separados por tabulaciones (copy-paste desde Excel o similar)"
                    style="font-size: 0.9rem; font-family: monospace;">
                  </textarea>
                  <button type="button" @click="procesarDatosTabla" class="btn btn-sm btn-outline-primary">
                    🔄 Llenar campos automáticamente
                  </button>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Fecha Documento</label>
                  <input v-model="form.fecha_documento" type="datetime-local" class="form-control" />
                </div>
                <div class="col-md-6 mb-3">
                  <UsuarioSelector
                    v-model="form.reasignado_a"
                    :selected-user-id="form.usuario_id"
                    label="Reasignado a"
                    placeholder="Buscar usuario por nombre..."
                    required
                    @usuarioSeleccionado="onUsuarioSeleccionado"
                  />
                </div>
                <div class="col-md-12 mb-3">
                  <label class="form-label fw-bold">Comentario</label>
                  <textarea v-model="form.comentario" class="form-control" rows="3" placeholder="Observaciones adicionales..."></textarea>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Fecha Reasignación</label>
                  <input v-model="form.fecha_reasignacion" type="datetime-local" class="form-control" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Fecha Máx. Respuesta</label>
                  <input v-model="form.fecha_max_respuesta" type="datetime-local" class="form-control" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">De (Remitente)</label>
                  <input v-model="form.remitente" class="form-control" placeholder="Quien envía" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Para (Destinatario)</label>
                  <input v-model="form.destinatario" class="form-control" placeholder="Quien recibe" />
                </div>
                <div class="col-md-12 mb-3">
                  <label class="form-label fw-bold">Asunto</label>
                  <input v-model="form.asunto" class="form-control" placeholder="Asunto del documento" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Número Documento *</label>
                  <input v-model="form.numero_documento" class="form-control" placeholder="Ej: DOC-2026-001" required />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Tipo Documento *</label>
                  <select v-model="form.tipo_documento" class="form-select" required>
                    <option value="">-- Seleccionar tipo --</option>
                    <option value="Memorando">📝 Memorando</option>
                    <option value="Circular">📢 Circular</option>
                    <option value="Oficio">📋 Oficio</option>
                    <option value="Otro">📄 Otro</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Nro. Trámite</label>
                  <input v-model="form.numero_tramite" class="form-control" placeholder="Ej: TRAM-2026-001" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Estado</label>
                  <select v-model="form.estado" class="form-select">
                    <option value="">-- Seleccionar estado --</option>
                    <option value="en elaboracion">en elaboracion</option>
                    <option value="en tramite">en tramite</option>
                    <option value="eliminado">eliminado</option>
                    <option value="archivado">archivado</option>
                    <option value="enviado">enviado</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Importancia</label>
                  <select v-model="form.importancia" class="form-select">
                    <option value="">-- Seleccionar --</option>
                    <option value="Baja">🟢 Baja</option>
                    <option value="Media">🟡 Media</option>
                    <option value="Alta">🔴 Alta</option>
                    <option value="Urgente">⚠️ Urgente</option>
                  </select>
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
import ComentariosReasignados from '../components/ComentariosReasignados.vue'
import { showToast, confirmAction } from '../utils/feedback'
import { normalizarTexto } from '../utils/texto'

export default {
  components: {
    UsuarioSelector,
    ComentariosReasignados
  },
  data() {
    return {
      items: [],
      form: {},
      editingId: null,
      viewItem: null,
      isSaving: false,
      usuarioActual: {},
      usuarioSeleccionado: null,
      refreshHandler: null,
      pastedData: '',
      busqueda: '',
      paginaActual: 1,
      porPagina: 15,
      filtroTipo: null,
      filtroActivo: null
    }
  },
  mounted() {
    this.refreshHandler = () => this.load();
    window.addEventListener('sistra:data-updated', this.refreshHandler);
    this.cargarUsuarioActual()
    this.load().then(() => {
      // Aplicar filtro si viene en query params
      const filtro = this.$route.query.filtro
      if (filtro) {
        this.aplicarFiltro(filtro)
      }
      // Auto-abrir documento si viene de notificación
      const docId = this.$route.query.doc
      if (docId) {
        this.abrirDocumentoPorId(docId)
      }
    })
  },
  beforeUnmount() {
    if (this.refreshHandler) {
      window.removeEventListener('sistra:data-updated', this.refreshHandler);
    }
  },
  watch: {
    '$route.query.doc'(newDocId) {
      if (newDocId) {
        this.abrirDocumentoPorId(newDocId)
      }
    },
    '$route.query.filtro'(newFiltro) {
      if (newFiltro) {
        this.aplicarFiltro(newFiltro)
      } else {
        this.filtroTipo = null
        this.filtroActivo = null
      }
    },
    busqueda() {
      this.paginaActual = 1
    }
  },
  computed: {
    esSoloLectura() {
      const rol = (this.usuarioActual?.rol || '').toLowerCase()
      return rol === 'solo_vista' || rol === 'solo lectura' || rol === 'lectura'
    },
    expiredItems() { return this.items.filter(i => this.isExpired(i)); },
    itemsFiltrados() {
      let result = this.items

      // Aplicar filtro por tipo (vencidos, pendientes, etc)
      if (this.filtroTipo) {
        result = result.filter(item => {
          const now = new Date()
          const estado = (item.estado || '').toString().toLowerCase().trim()
          const isExcluded = ['archivado', 'eliminado', 'enviado', 'completado', 'resuelto', 'cancelado'].includes(estado)

          switch (this.filtroTipo) {
            case 'vencidos':
              if (!item.fecha_max_respuesta) return false
              const isExpired = new Date(item.fecha_max_respuesta) < now
              return isExpired && !isExcluded && (estado === 'pendiente' || estado === 'en_proceso')
            case 'proximosvencer':
              if (!item.fecha_max_respuesta) return false
              const timeLeft = new Date(item.fecha_max_respuesta) - now
              const hoursLeft = timeLeft / (1000 * 60 * 60)
              return hoursLeft > 0 && hoursLeft <= 24 && !isExcluded && (estado === 'pendiente' || estado === 'en_proceso')
            case 'pendientes':
              return estado === 'pendiente'
            case 'en_proceso':
              return estado === 'en_proceso'
            case 'resuelto':
              return estado === 'resuelto'
            case 'archivado':
              return estado === 'archivado'
            default:
              return true
          }
        })
      }

      // Aplicar filtro de búsqueda de texto
      if (!this.busqueda.trim()) return result
      const t = normalizarTexto(this.busqueda)
      return result.filter(item => {
        const texto = [
          item.numero_documento,
          item.tipo_documento,
          item.reasignado_a,
          item.correo,
          item.estado,
          item.asunto,
          item.remitente,
          item.destinatario,
          item.comentario,
          item.numero_tramite
        ].join(' ')
        return normalizarTexto(texto).includes(t)
      })
    },
    totalPaginas() {
      return Math.ceil(this.itemsFiltrados.length / this.porPagina) || 1
    },
    itemsPaginados() {
      const inicio = (this.paginaActual - 1) * this.porPagina
      return this.itemsFiltrados.slice(inicio, inicio + this.porPagina)
    }
  },
  methods: {
    async cargarUsuarioActual() {
      try {
        const response = await api.get('/auth/usuario');
        if (response.data && response.data.usuario) {
          this.usuarioActual = response.data.usuario;
        }
      } catch (error) {
        console.error('Error cargando usuario actual:', error);
      }
    },
    async load() {
      try {
        const r = await api.get('/reasignados');
        this.items = r.data;
      } catch (e) {
        this.items = []
      }
      this.paginaActual = 1
    },
    async onFile(e) { 
      if (this.esSoloLectura) return;
      const f = e.target.files[0]; 
      if (!f) return; 
      const fd = new FormData(); 
      fd.append('file', f); 
      try { 
        const r = await api.post('/upload', fd); 
        showToast('Archivo procesado correctamente', 'success');
        this.load(); 
      } catch (err) { 
        showToast('Error al cargar archivo', 'error');
      } 
    },
    openCreate() {
      if (this.esSoloLectura) return;
      this.form = {};
      this.pastedData = '';
      this.usuarioSeleccionado = null;
      this.editingId = null;
      const m = new bootstrap.Modal(document.getElementById('reasignModal'));
      m.show();
    },
    openEdit(item) {
      if (this.esSoloLectura) return;
      this.form = Object.assign({}, item);
      // Asegurar que las fechas estén en formato correcto para datetime-local
      const formatDate = (dateStr) => {
        if (!dateStr || typeof dateStr !== 'string') return dateStr;

        // Remover timezone UTC (Z) y milisegundos si están presentes (formato ISO)
        dateStr = dateStr.replace('Z', '').replace(/\.\d{3}$/, '');

        // Si es solo una fecha (YYYY-MM-DD), agregar hora por defecto
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr + 'T00:00:00';
        }
        // Si tiene espacio, reemplazarlo con T
        return dateStr.replace(' ', 'T');
      };

      this.form.fecha_documento = formatDate(this.form.fecha_documento);
      this.form.fecha_reasignacion = formatDate(this.form.fecha_reasignacion);
      this.form.fecha_max_respuesta = formatDate(this.form.fecha_max_respuesta);

      console.log('📋 Item cargado para edición:', item);
      console.log('📋 Fecha máx. respuesta formateada:', this.form.fecha_max_respuesta);
      this.pastedData = '';
      this.usuarioSeleccionado = null;
      this.editingId = item.id;
      const m = new bootstrap.Modal(document.getElementById('reasignModal'));
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
        showToast('No tienes permisos para guardar cambios', 'warning');
        return;
      }
      if (!this.form.numero_documento || !this.form.reasignado_a) {
        showToast('Por favor completa los campos requeridos (*)', 'warning');
        return;
      }
      if (!this.form.usuario_id) {
        showToast('Debes seleccionar un usuario registrado en "Reasignado a"', 'warning');
        return;
      }
      this.isSaving = true;
      try {
        if (this.editingId) {
          await api.put(`/reasignados/${this.editingId}`, this.form);
        } else {
          await api.post('/reasignados', this.form);
        }
        showToast('Documento guardado correctamente', 'success');

        // Cerrar modal y limpiar formulario
        const mod = bootstrap.Modal.getInstance(document.getElementById('reasignModal'));
        if (mod) mod.hide();
        this.resetForm();

        // Recargar datos en background (no bloquea el modal)
        this.load().catch(err => console.error('Error cargando datos:', err));
      } catch (err) {
        showToast('Error guardando: ' + (err.response?.data?.message || err.message), 'error');
      } finally {
        this.isSaving = false;
      }
    },

    resetForm() {
      this.form = {};
      this.pastedData = '';
      this.usuarioSeleccionado = null;
      this.editingId = null;
    },
    async remove(id) { 
      if (this.esSoloLectura) {
        showToast('No tienes permisos para eliminar documentos', 'warning');
        return;
      }
      const confirmado = await confirmAction('¿Estás seguro de que deseas eliminar este documento?', 'Eliminar documento');
      if (!confirmado) return;
      try { 
        await api.delete(`/reasignados/${id}`);
        // Recargar todos los datos desde el servidor
        await this.load(); 
        showToast('Documento eliminado correctamente', 'success');
      } catch (err) { 
        showToast('Error al eliminar', 'error');
      } 
    },
    onUsuarioSeleccionado(usuario) {
      if (usuario) {
        // Datos adicionales del usuario si es necesario
        this.form.usuario_id = usuario.id;
        this.form.reasignado_a = usuario.nombre;
        this.usuarioSeleccionado = usuario;
      } else {
        this.form.usuario_id = null;
        this.usuarioSeleccionado = null;
      }
    },
    async procesarDatosTabla() {
      if (!this.pastedData.trim()) {
        showToast('Por favor pega los datos tabulados', 'warning');
        return;
      }

      const values = this.pastedData.trim().split('\t').map(v => v.trim());

      if (values.length !== 12) {
        showToast(`Se esperaban 12 valores, se encontraron ${values.length}. Asegúrate de que los datos estén separados por tabulaciones.`, 'warning');
        return;
      }

      try {
        // Mapear los valores al formulario según el orden especificado
        const fecha_doc_raw = values[0].replace(/\s*\(GMT[^\)]*\)/, '').trim();
        this.form.fecha_documento = this.formatearFechaAlInput(fecha_doc_raw);

        // Extraer nombre sin departamento/gerencia (texto entre paréntesis)
        const nombreReasignado = values[1].trim().replace(/\s*\([^\)]*\)/g, '').trim();
        this.form.reasignado_a = nombreReasignado;

        this.form.comentario = values[2].trim();

        const fecha_reasig_raw = values[3].replace(/\s*\(GMT[^\)]*\)/, '').trim();
        this.form.fecha_reasignacion = this.formatearFechaAlInput(fecha_reasig_raw);

        const fecha_max_raw = values[4].trim();
        this.form.fecha_max_respuesta = this.formatearFechaAlInput(fecha_max_raw);

        // Extraer nombre sin departamento (texto entre paréntesis)
        const de = values[5].trim().replace(/\s*\([^\)]*\)/g, '').trim();
        this.form.remitente = de;

        const para = values[6].trim().replace(/\s*\([^\)]*\)/g, '').trim();
        this.form.destinatario = para;

        this.form.asunto = values[7].trim();
        this.form.numero_documento = values[8].trim();
        this.form.tipo_documento = values[9].trim();
        this.form.numero_tramite = values[10].trim();
        this.form.estado = values[11].trim();

        // Buscar y seleccionar usuario automáticamente
        await this.buscarYSeleccionarUsuario(nombreReasignado);

        // Limpiar el campo de entrada
        this.pastedData = '';

        showToast('✓ Datos cargados correctamente', 'success');
      } catch (err) {
        console.error('Error procesando datos:', err);
        showToast('Error al procesar los datos: ' + err.message, 'error');
      }
    },

    async buscarYSeleccionarUsuario(nombreUsuario) {
      try {
        console.log(`🔍 Buscando usuario: "${nombreUsuario}"`);
        const response = await api.get(`/usuarios/buscar/${encodeURIComponent(nombreUsuario)}`);
        const usuarios = response.data || [];

        console.log(`📋 Usuarios encontrados:`, usuarios);

        if (usuarios.length > 0) {
          // Buscar coincidencia exacta
          let usuarioEncontrado = usuarios.find(u =>
            (u.nombre || '').toLowerCase().trim() === nombreUsuario.toLowerCase().trim()
          );

          if (usuarioEncontrado) {
            console.log(`✅ Coincidencia exacta encontrada:`, usuarioEncontrado);
          } else {
            console.warn(`⚠️ No hay coincidencia exacta. Mostrando resultados encontrados:`, usuarios);
            // Si no hay coincidencia exacta, mostrar un aviso
            showToast(`Se encontraron ${usuarios.length} usuarios similares a "${nombreUsuario}". Selecciona el correcto manualmente.`, 'warning');
            return;
          }

          // Seleccionar el usuario encontrado
          this.onUsuarioSeleccionado(usuarioEncontrado);
        } else {
          console.warn(`❌ No se encontró usuario: ${nombreUsuario}`);
          showToast(`No se encontró usuario con nombre "${nombreUsuario}"`, 'warning');
        }
      } catch (error) {
        console.error('Error buscando usuario:', error);
        showToast('Error al buscar usuario', 'error');
      }
    },
    formatearFechaAlInput(fecha) {
      // Convierte "2026-03-16 17:28:45" o ISO "2026-03-16T17:28:45.000Z" a formato datetime-local
      if (!fecha) return '';

      // Remover timezone UTC (Z) y milisegundos si están presentes (formato ISO)
      fecha = fecha.replace('Z', '').replace(/\.\d{3}$/, '');

      // Si es solo una fecha (YYYY-MM-DD), agregar hora por defecto
      if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return fecha + 'T00:00:00';
      }
      // Si tiene espacio, reemplazarlo con T
      return fecha.replace(' ', 'T');
    },
    // Deadline helpers
    hasDeadline(item) {
      const st = (item.estado || item.status || '').toString().toLowerCase();
      if (['archivado', 'eliminado', 'enviado'].includes(st)) return false;
      return !!this.getDeadline(item);
    },
    getDeadline(item) {
      const v = item.fecha_max_respuesta;
      if (v) {
        const d = this.parseDateValue(v);
        if (d) return d;
      }
      try {
        const extra = typeof item.extra === 'string' ? JSON.parse(item.extra) : item.extra || {};
        for (const k of Object.keys(extra)) {
          if (/fecha\s*max|max.*respuesta|máx/i.test(k)) {
            const dv = extra[k];
            const d2 = this.parseDateValue(dv);
            if (d2) return d2;
          }
        }
      } catch (e) { /* ignore */ }
      return null;
    },
    parseDateValue(v) {
      if (!v) return null;
      if (typeof v === 'number') {
        const ts = (v - 25569) * 86400 * 1000;
        return new Date(ts);
      }
      const s = String(v).trim();
      const match1 = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})[\s]+(\d{1,2}):(\d{1,2}):(\d{1,2})/);
      if (match1) {
        const year = parseInt(match1[1], 10);
        const month = parseInt(match1[2], 10) - 1;
        const day = parseInt(match1[3], 10);
        const hour = parseInt(match1[4], 10);
        const min = parseInt(match1[5], 10);
        const sec = parseInt(match1[6], 10);
        return new Date(year, month, day, hour, min, sec);
      }
      const match2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})[\s]+(\d{1,2}):(\d{1,2}):(\d{1,2})/);
      if (match2) {
        const day = parseInt(match2[1], 10);
        const month = parseInt(match2[2], 10) - 1;
        const year = parseInt(match2[3], 10);
        const hour = parseInt(match2[4], 10);
        const min = parseInt(match2[5], 10);
        const sec = parseInt(match2[6], 10);
        return new Date(year, month, day, hour, min, sec);
      }
      const cleaned = s.replace(/\(.+\)/, '').replace(/\s+GMT.*$/, '').trim();
      const parsed = Date.parse(cleaned);
      if (!isNaN(parsed)) return new Date(parsed);
      const match3 = cleaned.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (match3) {
        const day = parseInt(match3[1], 10), month = parseInt(match3[2], 10) - 1, year = parseInt(match3[3], 10);
        return new Date(year, month, day);
      }
      return null;
    },
    isExpired(item) {
      const st = (item.estado || item.status || '').toString().toLowerCase();
      if (['archivado', 'eliminado', 'enviado'].includes(st)) return false;
      const dl = this.getDeadline(item);
      if (!dl) return false;
      const dlEnd = new Date(dl.getFullYear(), dl.getMonth(), dl.getDate(), 23, 59, 59, 999);
      const nowTs = Date.now();
      return nowTs > dlEnd.getTime();
    },
    getDaysExpiredOrRemaining(item) {
      const dl = this.getDeadline(item);
      if (!dl) return '-';
      
      const today = new Date();
      const dlDate = new Date(dl.getFullYear(), dl.getMonth(), dl.getDate());
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const diffTime = todayDate - dlDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Hoy';
      if (diffDays > 0) {
        return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
      } else {
        const remaining = Math.abs(diffDays);
        return `En ${remaining} día${remaining !== 1 ? 's' : ''}`;
      }
    },
    getImportanceClass(importance) {
      const classes = {
        'Baja': 'bg-success',
        'Media': 'bg-warning text-dark',
        'Alta': 'bg-danger',
        'Urgente': 'bg-dark'
      };
      return classes[importance] || 'bg-secondary';
    },
    formatDate(d) {
      if (!d) return '';
      if (typeof d === 'string') d = new Date(d);
      if (!(d instanceof Date)) return '';
      return d.toLocaleString();
    },
    async abrirDocumentoPorId(docId) {
      // Buscar el documento en items
      const doc = this.items.find(item => item.id == docId)
      if (doc) {
        this.openView(doc)
        // Limpiar query param para evitar re-abrir
        this.$router.replace({ query: {} })
      } else {
        // Si no está en la lista, hacer fetch directo
        try {
          const response = await api.get(`/reasignados/${docId}`)
          if (response.data) {
            this.openView(response.data)
            this.$router.replace({ query: {} })
          }
        } catch (error) {
          console.error('Error cargando documento:', error)
        }
      }
    },

    aplicarFiltro(tipo) {
      this.filtroTipo = tipo
      this.paginaActual = 1

      const etiquetas = {
        'vencidos': '⛔ Vencidos',
        'proximosvencer': '⚠️ Próximos a Vencer',
        'pendientes': '⏳ Pendientes',
        'en_proceso': '🔄 En Proceso',
        'resuelto': '✓ Resueltos',
        'archivado': '📦 Archivados'
      }

      this.filtroActivo = etiquetas[tipo] || tipo
    },

    limpiarFiltro() {
      this.filtroTipo = null
      this.filtroActivo = null
      this.paginaActual = 1
      this.$router.replace({ query: {} })
    }
  }
}
</script>
