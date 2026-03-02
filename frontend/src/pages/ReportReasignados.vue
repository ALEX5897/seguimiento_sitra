<template>
  <div class="p-4">
    <!-- Encabezado -->
    <div class="mb-5">
      <h1 class="page-title">📋 Reporte de Documentos Reasignados</h1>
      <p class="text-muted">Genere reportes con filtros por rango de fechas</p>
    </div>

    <!-- Filtros -->
    <div class="card mb-4">
      <div class="card-header">
        <span>🔍</span> Filtros de Búsqueda
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-4 mb-3">
            <label class="form-label">📅 Fecha Inicio</label>
            <input v-model="filterDate.desde" type="date" class="form-control" />
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label">📅 Fecha Fin</label>
            <input v-model="filterDate.hasta" type="date" class="form-control" />
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label">⚖️ Estado</label>
            <select v-model="filterStatus" class="form-select">
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completado">Completado</option>
              <option value="archivado">Archivado</option>
            </select>
          </div>
        </div>
        <div class="row">
          <div class="col-md-4 mb-3">
            <label class="form-label">📄 Tipo Documento</label>
            <select v-model="filterTipo" class="form-select">
              <option value="">Todos los tipos</option>
              <option value="Memorando">Memorando</option>
              <option value="Circular">Circular</option>
              <option value="Oficio">Oficio</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label">📊 Importancia</label>
            <select v-model="filterImportancia" class="form-select">
              <option value="">Todos los niveles</option>
              <option value="Urgente">Urgente</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label">&nbsp;</label>
            <div>
              <button @click="generateReport" class="btn btn-primary me-2">
                🔍 Generar Reporte
              </button>
              <button @click="exportToExcel" class="btn btn-success" :disabled="!filteredItems.length">
                📊 Descargar Excel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumen -->
    <div class="row mb-4" v-if="filteredItems.length > 0">
      <div class="col-md-3 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Total Documentos</h5>
            <p class="card-text fs-4 fw-bold">{{ filteredItems.length }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Completados</h5>
            <p class="card-text fs-4 fw-bold text-success">{{ countStatus('completado') }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">En Proceso</h5>
            <p class="card-text fs-4 fw-bold text-warning">{{ countStatus('en_proceso') }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Expirados</h5>
            <p class="card-text fs-4 fw-bold text-danger">{{ countExpired }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de Resultados -->
    <div class="card">
      <div class="card-header">
        <span>📊</span> Resultados del Reporte
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover" v-if="filteredItems.length > 0">
            <thead>
              <tr>
                <th>#</th>
                <th>Número Doc.</th>
                <th>Tipo</th>
                <th>Importancia</th>
                <th>Reasignado a</th>
                <th>Fecha Reasignación</th>
                <th>Fecha Máx. Respuesta</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredItems" :key="item.id">
                <td><strong>#{{ item.id }}</strong></td>
                <td>{{ item.numero_documento }}</td>
                <td>{{ item.tipo_documento }}</td>
                <td>
                  <span v-if="item.importancia" :class="getImportanceClass(item.importancia)" class="badge">
                    {{ item.importancia }}
                  </span>
                </td>
                <td>{{ item.reasignado_a }}</td>
                <td>{{ formatDate(item.fecha_reasignacion) }}</td>
                <td :class="{ 'text-danger fw-bold': isExpired(item) }">
                  {{ formatDate(item.fecha_max_respuesta) }}
                </td>
                <td>
                  <span :class="getStatusClass(item.estado)" class="badge">
                    {{ item.estado }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm btn-primary" @click="viewDetails(item)" title="Ver detalles">📄</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="text-center py-5 text-muted">
            <p>No hay documentos que cumplan con los filtros especificados</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Detalles -->
    <div class="modal fade" id="detailsModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">📋 Detalles del Documento</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" v-if="selectedItem">
            <div class="row mb-3">
              <div class="col-md-6">
                <h6>Número Documento:</h6>
                <p>{{ selectedItem.numero_documento }}</p>
              </div>
              <div class="col-md-6">
                <h6>Tipo Documento:</h6>
                <p>{{ selectedItem.tipo_documento }}</p>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <h6>Importancia:</h6>
                <p>
                  <span :class="getImportanceClass(selectedItem.importancia)" class="badge">
                    {{ selectedItem.importancia || 'No especificada' }}
                  </span>
                </p>
              </div>
              <div class="col-md-6">
                <h6>Estado:</h6>
                <p>
                  <span :class="getStatusClass(selectedItem.estado)" class="badge">
                    {{ selectedItem.estado }}
                  </span>
                </p>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <h6>Reasignado a:</h6>
                <p>{{ selectedItem.reasignado_a }}</p>
              </div>
              <div class="col-md-6">
                <h6>Remitente:</h6>
                <p>{{ selectedItem.remitente }}</p>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <h6>Fecha Reasignación:</h6>
                <p>{{ formatDate(selectedItem.fecha_reasignacion) }}</p>
              </div>
              <div class="col-md-6">
                <h6>Fecha Máx. Respuesta:</h6>
                <p :class="{ 'text-danger fw-bold': isExpired(selectedItem) }">
                  {{ formatDate(selectedItem.fecha_max_respuesta) }}
                </p>
              </div>
            </div>
            <div class="mb-3">
              <h6>Asunto:</h6>
              <p>{{ selectedItem.asunto }}</p>
            </div>
            <div class="mb-3">
              <h6>Comentario:</h6>
              <p>{{ selectedItem.comentario || 'Sin comentarios' }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';
import { exportToExcel } from '../utils/excelExport';
import { showToast } from '../utils/feedback';

export default {
  name: 'ReportReasignados',
  data() {
    return {
      items: [],
      filteredItems: [],
      filterDate: {
        desde: null,
        hasta: null
      },
      filterStatus: '',
      filterTipo: '',
      filterImportancia: '',
      selectedItem: null,
      refreshInterval: null,
      autoRefreshEnabled: true
    };
  },
  computed: {
    countExpired() {
      return this.filteredItems.filter(item => this.isExpired(item)).length;
    }
  },
  mounted() {
    this.loadData();
    // Auto-refresh cada 30 segundos
    this.refreshInterval = setInterval(() => {
      if (this.autoRefreshEnabled) {
        console.log('Auto-refreshing reports...');
        this.loadData();
      }
    }, 30000);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    async loadData() {
      try {
        const res = await api.get('/reasignados');
        this.items = res.data;
        this.generateReport();
      } catch (err) {
        console.error('Error loading data:', err);
      }
    },
    generateReport() {
      let filtered = this.items;

      // Filtrar por fecha
      if (this.filterDate.desde) {
        const desde = new Date(this.filterDate.desde);
        filtered = filtered.filter(item => {
          const fecha = new Date(item.fecha_reasignacion);
          return fecha >= desde;
        });
      }

      if (this.filterDate.hasta) {
        const hasta = new Date(this.filterDate.hasta);
        hasta.setHours(23, 59, 59, 999);
        filtered = filtered.filter(item => {
          const fecha = new Date(item.fecha_reasignacion);
          return fecha <= hasta;
        });
      }

      // Filtrar por estado
      if (this.filterStatus) {
        filtered = filtered.filter(item => item.estado === this.filterStatus);
      }

      // Filtrar por tipo
      if (this.filterTipo) {
        filtered = filtered.filter(item => item.tipo_documento === this.filterTipo);
      }

      // Filtrar por importancia
      if (this.filterImportancia) {
        filtered = filtered.filter(item => item.importancia === this.filterImportancia);
      }

      this.filteredItems = filtered;
    },
    countStatus(status) {
      return this.filteredItems.filter(item => item.estado === status).length;
    },
    isExpired(item) {
      if (!item.fecha_max_respuesta) return false;
      const fecha = new Date(item.fecha_max_respuesta);
      const hoy = new Date();
      return fecha < hoy && !['archivado', 'eliminado', 'completado'].includes(item.estado);
    },
    formatDate(d) {
      if (!d) return '';
      const date = new Date(d);
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    getStatusClass(status) {
      const classes = {
        'completado': 'bg-success',
        'en_proceso': 'bg-info',
        'pendiente': 'bg-warning text-dark',
        'archivado': 'bg-secondary'
      };
      return classes[status] || 'bg-secondary';
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
    viewDetails(item) {
      this.selectedItem = item;
      const modal = new (window.bootstrap.Modal)(document.getElementById('detailsModal'));
      modal.show();
    },
    async exportToExcel() {
      if (!this.filteredItems || !this.filteredItems.length) {
        showToast('No hay datos para exportar', 'warning');
        return;
      }

      try {
        console.log('Starting Excel export with', this.filteredItems.length, 'items');
        
        const columns = ['#', 'Número Doc.', 'Tipo', 'Importancia', 'Reasignado a', 'Fecha Reasignación', 'Fecha Máx. Respuesta', 'Estado', 'Asunto'];
        const rows = this.filteredItems.map(item => [
          item.id,
          item.numero_documento,
          item.tipo_documento,
          item.importancia || 'N/A',
          item.reasignado_a,
          this.formatDate(item.fecha_reasignacion),
          this.formatDate(item.fecha_max_respuesta),
          item.estado,
          item.asunto || ''
        ]);

        const stats = [
          { label: 'Total de Documentos', value: this.filteredItems.length },
          { label: 'Completados', value: this.countStatus('completado') },
          { label: 'En Proceso', value: this.countStatus('en_proceso') },
          { label: 'Expirados', value: this.countExpired }
        ];

        console.log('Calling exportToExcel with rows:', rows.length);
        
        await exportToExcel({
          filename: `reporte_reasignados_${new Date().toISOString().split('T')[0]}.xlsx`,
          sheetName: 'Reasignados',
          title: '📋 REPORTE DE DOCUMENTOS REASIGNADOS',
          columns,
          rows,
          stats
        });
      } catch (err) {
        console.error('Excel export error:', err);
        showToast('Error al exportar Excel: ' + err.message, 'error');
      }
    },
    exportToCSV() {
      if (!this.filteredItems.length) return;

      const headers = ['#', 'Número Doc.', 'Tipo', 'Importancia', 'Reasignado a', 'Fecha Reasignación', 'Fecha Máx. Respuesta', 'Estado', 'Asunto'];
      const rows = this.filteredItems.map(item => [
        item.id,
        item.numero_documento,
        item.tipo_documento,
        item.importancia || 'N/A',
        item.reasignado_a,
        this.formatDate(item.fecha_reasignacion),
        this.formatDate(item.fecha_max_respuesta),
        item.estado,
        item.asunto
      ]);

      let csv = headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_reasignados_${new Date().toISOString().split('T')[0]}.csv`);
      link.click();
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

.card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
  padding: 15px;
  font-weight: 500;
}

.badge {
  font-size: 0.9rem;
  padding: 5px 10px;
}

.table-hover tbody tr:hover {
  background-color: #f5f5f5;
}

.form-label {
  font-weight: 500;
  color: #333;
}

.btn {
  border-radius: 5px;
}
</style>
