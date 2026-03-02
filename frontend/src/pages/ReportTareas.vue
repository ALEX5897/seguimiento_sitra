<template>
  <div class="p-4">
    <!-- Encabezado -->
    <div class="mb-5">
      <h1 class="page-title">✓ Reporte de Estado de Tareas</h1>
      <p class="text-muted">Análisis de tareas con filtros por rango de fechas</p>
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
            </select>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12 mb-3">
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

    <!-- Resumen Estadístico -->
    <div class="row mb-4" v-if="filteredItems.length > 0">
      <div class="col-md-2 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Total</h5>
            <p class="card-text fs-4 fw-bold">{{ filteredItems.length }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-2 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Completadas</h5>
            <p class="card-text fs-4 fw-bold text-success">{{ countStatus('completado') }}</p>
            <small class="text-muted">{{ getPercentage('completado') }}%</small>
          </div>
        </div>
      </div>
      <div class="col-md-2 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">En Proceso</h5>
            <p class="card-text fs-4 fw-bold text-info">{{ countStatus('en_proceso') }}</p>
            <small class="text-muted">{{ getPercentage('en_proceso') }}%</small>
          </div>
        </div>
      </div>
      <div class="col-md-2 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Pendientes</h5>
            <p class="card-text fs-4 fw-bold text-warning">{{ countStatus('pendiente') }}</p>
            <small class="text-muted">{{ getPercentage('pendiente') }}%</small>
          </div>
        </div>
      </div>
      <div class="col-md-2 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Vencidas</h5>
            <p class="card-text fs-4 fw-bold text-danger">{{ countOverdue }}</p>
            <small class="text-muted">{{ getOverduePercentage() }}%</small>
          </div>
        </div>
      </div>
      <div class="col-md-2 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h5 class="card-title">Avance Promedio</h5>
            <p class="card-text fs-4 fw-bold text-primary">{{ averageProgress }}%</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráfico de Progreso-->
    <div class="row mb-4">
      <div class="col-lg-8">
        <div class="card">
          <div class="card-header">
            <span>📊</span> Distribución de Estados
          </div>
          <div class="card-body">
            <div class="progress-container">
              <div class="progress-item" v-if="filteredItems.length > 0">
                <div class="progress-label">
                  <span>Completadas</span>
                  <span class="text-success fw-bold">{{ countStatus('completado') }} ({{ getPercentage('completado') }}%)</span>
                </div>
                <div class="progress">
                  <div class="progress-bar bg-success" :style="{ width: getPercentage('completado') + '%' }"></div>
                </div>
              </div>
              <div class="progress-item" v-if="filteredItems.length > 0">
                <div class="progress-label">
                  <span>En Proceso</span>
                  <span class="text-info fw-bold">{{ countStatus('en_proceso') }} ({{ getPercentage('en_proceso') }}%)</span>
                </div>
                <div class="progress">
                  <div class="progress-bar bg-info" :style="{ width: getPercentage('en_proceso') + '%' }"></div>
                </div>
              </div>
              <div class="progress-item" v-if="filteredItems.length > 0">
                <div class="progress-label">
                  <span>Pendientes</span>
                  <span class="text-warning fw-bold">{{ countStatus('pendiente') }} ({{ getPercentage('pendiente') }}%)</span>
                </div>
                <div class="progress">
                  <div class="progress-bar bg-warning" :style="{ width: getPercentage('pendiente') + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tareas Vencidas -->
      <div class="col-lg-4">
        <div class="card">
          <div class="card-header">
            <span>⚠️</span> Tareas Vencidas
          </div>
          <div class="card-body">
            <div v-if="overdueItems.length > 0">
              <div v-for="item in overdueItems.slice(0, 5)" :key="item.id" class="mb-3 pb-3 border-bottom">
                <h6>{{ item.asunto }}</h6>
                <small class="text-muted">Asignado: {{ item.asignado_para }}</small>
                <div class="mt-1">
                  <span class="badge bg-danger">{{ getDaysOverdue(item) }} días</span>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted py-5">
              <p>✓ No hay tareas vencidas</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de Resultados -->
    <div class="card">
      <div class="card-header">
        <span>📋</span> Listado de Tareas
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover" v-if="filteredItems.length > 0">
            <thead>
              <tr>
                <th>#</th>
                <th>Número Doc.</th>
                <th>Asignado a</th>
                <th>Asunto</th>
                <th>Avance</th>
                <th>Fecha Máxima</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredItems" :key="item.id" :class="{ 'table-danger': isOverdue(item) }">
                <td><strong>#{{ item.id }}</strong></td>
                <td>{{ item.numero_documento }}</td>
                <td>👤 {{ item.asignado_para }}</td>
                <td>{{ item.asunto }}</td>
                <td>
                  <div class="progress" style="min-width: 100px;">
                    <div class="progress-bar" :style="{ width: getProgress(item) + '%' }"></div>
                  </div>
                  <small>{{ getProgress(item) }}%</small>
                </td>
                <td :class="{ 'text-danger fw-bold': isOverdue(item) }">
                  {{ formatDate(item.fecha_maxima) }}
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
            <p>No hay tareas que cumplan con los filtros especificados</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Detalles -->
    <div class="modal fade" id="detailsModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">✓ Detalles de la Tarea</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" v-if="selectedItem">
            <div class="row mb-3">
              <div class="col-md-6">
                <h6>Número Documento:</h6>
                <p>{{ selectedItem.numero_documento }}</p>
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
                <h6>Asignado a:</h6>
                <p>{{ selectedItem.asignado_para }}</p>
              </div>
              <div class="col-md-6">
                <h6>Avance:</h6>
                <div>
                  <div class="progress" style="height: 25px;">
                    <div class="progress-bar" :style="{ width: getProgress(selectedItem) + '%' }">
                      {{ getProgress(selectedItem) }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <h6>Fecha Asignación:</h6>
                <p>{{ formatDate(selectedItem.fecha_asignacion) }}</p>
              </div>
              <div class="col-md-6">
                <h6>Fecha Máxima:</h6>
                <p :class="{ 'text-danger fw-bold': isOverdue(selectedItem) }">
                  {{ formatDate(selectedItem.fecha_maxima) }}
                </p>
              </div>
            </div>
            <div class="mb-3">
              <h6>Asunto:</h6>
              <p>{{ selectedItem.asunto }}</p>
            </div>
            <div class="mb-3">
              <h6>Descripción:</h6>
              <p>{{ selectedItem.descripcion || 'Sin descripción' }}</p>
            </div>
            <div v-if="isOverdue(selectedItem)" class="alert alert-danger">
              <strong>⚠️ Advertencia:</strong> Esta tarea está vencida hace {{ getDaysOverdue(selectedItem) }} días
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
  name: 'ReportTareas',
  data() {
    return {
      items: [],
      filteredItems: [],
      filterDate: {
        desde: null,
        hasta: null
      },
      filterStatus: '',
      selectedItem: null,
      refreshInterval: null,
      autoRefreshEnabled: true
    };
  },
  computed: {
    overdueItems() {
      return this.filteredItems.filter(item => this.isOverdue(item));
    },
    countOverdue() {
      return this.overdueItems.length;
    },
    averageProgress() {
      if (this.filteredItems.length === 0) return 0;
      const sum = this.filteredItems.reduce((acc, item) => acc + this.getProgress(item), 0);
      return Math.round(sum / this.filteredItems.length);
    }
  },
  mounted() {
    this.loadData();
    // Auto-refresh cada 30 segundos
    this.refreshInterval = setInterval(() => {
      if (this.autoRefreshEnabled) {
        console.log('Auto-refreshing report tareas...');
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
        const res = await api.get('/tareas');
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
          const fecha = new Date(item.fecha_asignacion);
          return fecha >= desde;
        });
      }

      if (this.filterDate.hasta) {
        const hasta = new Date(this.filterDate.hasta);
        hasta.setHours(23, 59, 59, 999);
        filtered = filtered.filter(item => {
          const fecha = new Date(item.fecha_asignacion);
          return fecha <= hasta;
        });
      }

      // Filtrar por estado
      if (this.filterStatus) {
        filtered = filtered.filter(item => item.estado === this.filterStatus);
      }

      this.filteredItems = filtered;
    },
    countStatus(status) {
      return this.filteredItems.filter(item => item.estado === status).length;
    },
    getPercentage(status) {
      if (this.filteredItems.length === 0) return 0;
      return Math.round((this.countStatus(status) / this.filteredItems.length) * 100);
    },
    getOverduePercentage() {
      if (this.filteredItems.length === 0) return 0;
      return Math.round((this.countOverdue / this.filteredItems.length) * 100);
    },
    getProgress(item) {
      if (!item.avance) return 0;
      const progress = parseInt(item.avance);
      return isNaN(progress) ? 0 : Math.min(100, Math.max(0, progress));
    },
    isOverdue(item) {
      if (!item.fecha_maxima) return false;
      const fecha = new Date(item.fecha_maxima);
      const hoy = new Date();
      return fecha < hoy && item.estado !== 'completado';
    },
    getDaysOverdue(item) {
      if (!this.isOverdue(item)) return 0;
      const fecha = new Date(item.fecha_maxima);
      const hoy = new Date();
      const diffTime = hoy - fecha;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
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
        'pendiente': 'bg-warning text-dark'
      };
      return classes[status] || 'bg-secondary';
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
        
        const columns = ['#', 'Número Doc.', 'Asignado a', 'Asunto', 'Avance', 'Fecha Máxima', 'Estado', 'Descripción'];
        const rows = this.filteredItems.map(item => [
          item.id,
          item.numero_documento,
          item.asignado_para,
          item.asunto,
          this.getProgress(item) + '%',
          this.formatDate(item.fecha_maxima),
          item.estado,
          item.descripcion || 'N/A'
        ]);

        const stats = [
          { label: 'Total de Tareas', value: this.filteredItems.length },
          { label: 'Completadas', value: this.countStatus('completado') },
          { label: 'En Proceso', value: this.countStatus('en_proceso') },
          { label: 'Pendientes', value: this.countStatus('pendiente') },
          { label: 'Tareas Vencidas', value: this.countOverdue },
          { label: 'Avance Promedio', value: this.averageProgress + '%' }
        ];

        console.log('Calling exportToExcel with rows:', rows.length);
        
        await exportToExcel({
          filename: `reporte_tareas_${new Date().toISOString().split('T')[0]}.xlsx`,
          sheetName: 'Tareas',
          title: '✓ REPORTE DE ESTADO DE TAREAS',
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

      const headers = ['#', 'Número Doc.', 'Asignado a', 'Asunto', 'Avance', 'Fecha Máxima', 'Estado', 'Descripción'];
      const rows = this.filteredItems.map(item => [
        item.id,
        item.numero_documento,
        item.asignado_para,
        item.asunto,
        this.getProgress(item) + '%',
        this.formatDate(item.fecha_maxima),
        item.estado,
        item.descripcion || 'N/A'
      ]);

      let csv = headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `reporte_tareas_${new Date().toISOString().split('T')[0]}.csv`;
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

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.btn {
  border-radius: 5px;
}

.table-danger {
  background-color: #ffe5e5 !important;
}
</style>
