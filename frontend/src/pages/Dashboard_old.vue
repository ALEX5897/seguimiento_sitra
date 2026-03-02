<template>
  <div class="p-4">
    <!-- Encabezado -->
    <div class="mb-5">
      <h1 class="page-title">📊 Dashboard de Documentos</h1>
      <p class="text-muted">Panel de control de reasignados, tareas y documentos enviados</p>
    </div>

    <!-- Tarjetas KPI -->
    <div class="row">
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="kpi-card reasignados">
          <div class="kpi-icon">📋</div>
          <div class="kpi-title">Reasignados</div>
          <div class="kpi-number">{{ counts.reasignados }}</div>
          <a class="kpi-button" href="/reasignados">Ir a Reasignados →</a>
        </div>
      </div>
            <div class="col-lg-4 col-md-6 mb-4">
        <div class="kpi-card enviados">
          <div class="kpi-icon">📤</div>
          <div class="kpi-title">Enviados</div>
          <div class="kpi-number">{{ counts.enviados }}</div>
          <a class="kpi-button" href="/enviados">Ir a Enviados →</a>
        </div>
      </div>
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="kpi-card tareas">
          <div class="kpi-icon">✓</div>
          <div class="kpi-title">Tareas</div>
          <div class="kpi-number">{{ counts.tareas }}</div>
          <a class="kpi-button" href="/tareas">Ir a Tareas →</a>
        </div>
      </div>

    </div>

    <!-- Sección de estadísticas -->
    <div class="mt-5 row">
      <div class="col-lg-8 mb-4">
        <div class="card">
          <div class="card-header">
            <span>👥</span> Usuarios con Trámites Expirados
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Reasignado a</th>
                    <th>Cantidad</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in expiredStats" :key="row.name">
                    <td>
                      <span>👤</span> {{ row.name }}
                    </td>
                    <td>
                      <span class="badge bg-danger">{{ row.count }}</span>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-primary" @click="viewUserExpired(row.name)">Ver Detalles</button>
                    </td>
                  </tr>
                  <tr v-if="expiredStats.length===0">
                    <td colspan="3" class="text-center text-muted py-4">
                      <span>✓</span> No hay documentos expirados
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

   <!-- <div class="mt-2">
      <h4>Documentos expirados</h4>
      <div class="table-responsive">
        <table class="table table-sm table-bordered">
          <thead>
            <tr>
              <th>#</th>
              <th>Número Documento</th>
              <th>Reasignado a</th>
              <th>Fecha Máx. Respuesta</th>
              <th>Días Expirados</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in expired" :key="d.id">
              <td>{{ d.id }}</td>
              <td>{{ d.numero_documento }}</td>
              <td>{{ d.reasignado_a || d.destinatario || d.recipiente }}</td>
              <td>{{ formatDate(getDeadline(d)) }}</td>
              <td><span class="badge bg-danger">{{ getDaysExpired(d) }}</span></td>
              <td><button class="btn btn-sm btn-primary" @click="openExpired(d)">Ver documento</button></td>
            </tr>
            <tr v-if="expired.length === 0"><td colspan="6" class="text-center">No hay documentos expirados</td></tr>
          </tbody>
        </table>
      </div>
    </div> -->

    <div class="mt-5">
      <div class="card">
        <div class="card-header">
          <span style="font-size: 1.25rem; margin-right: 8px;">⏰</span> Documentos a Punto de Expirar (Próximas 24 horas)
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Número Documento</th>
                  <th>Reasignado a</th>
                  <th>Fecha Máx. Respuesta</th>
                  <th>Días Restantes</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in expiringDocuments" :key="d.id">
                  <td><strong>#{{ d.id }}</strong></td>
                  <td>{{ d.numero_documento }}</td>
                  <td><span>👤</span> {{ d.reasignado_a || d.asignado_para || d.destinatario || d.recipiente }}</td>
                  <td>{{ formatDate(getDeadline(d)) }}</td>
                  <td><span class="badge bg-warning">⏱️ {{ getDaysUntilExpiry(d) }} día(s)</span></td>
                  <td><button class="btn btn-sm btn-primary" @click="openExpired(d)">📄 Ver</button></td>
                </tr>
                <tr v-if="expiringDocuments.length === 0">
                  <td colspan="6" class="text-center text-muted py-4">
                    <span>✓</span> No hay documentos próximos a expirar
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección de Gráficos -->
    <div class="mt-5 row">
      <div class="col-lg-6 mb-4">
        <div class="card">
          <div class="card-header">
            <span>📊</span> Documentos por Fecha de Vencimiento
          </div>
          <div class="card-body">
            <div style="position: relative; height: 350px; width: 100%;">
              <canvas ref="expiredChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6 mb-4">
        <div class="card">
          <div class="card-header">
            <span>📈</span> Estadísticas por Mes
          </div>
          <div class="card-body">
            <div style="position: relative; height: 350px; width: 100%;">
              <canvas ref="monthlyChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for expired document -->
    <div class="modal fade" id="expiredModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-bottom bg-light">
            <h5 class="modal-title"><span style="font-size: 1.5rem; margin-right: 8px;">📄</span> Detalles del Documento</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="selectedExpired">
            <div class="info-group mb-3">
              <label class="fw-bold text-muted small">Número de Documento</label>
              <p class="fs-6">{{ selectedExpired.numero_documento }}</p>
            </div>
            <div class="info-group mb-3">
              <label class="fw-bold text-muted small">Reasignado a</label>
              <p class="fs-6"><span>👤</span> {{ selectedExpired.reasignado_a || selectedExpired.asignado_para || selectedExpired.destinatario }}</p>
            </div>
            <div class="info-group mb-3">
              <label class="fw-bold text-muted small">Fecha Máxima de Respuesta</label>
              <p class="fs-6">{{ formatDate(getDeadline(selectedExpired)) }}</p>
            </div>
            <div class="info-group mb-0">
              <label class="fw-bold text-muted small">Estado</label>
              <p class="fs-6"><span class="badge bg-danger">{{ selectedExpired.estado }}</span></p>
            </div>
          </div>
          <div class="modal-footer border-top bg-light">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <a :href="`/reasignados`" class="btn btn-primary">📋 Ir a Reasignados</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for editing document status -->
    <div class="modal fade" id="editStatusModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-bottom bg-light">
            <h5 class="modal-title"><span style="font-size: 1.5rem; margin-right: 8px;">✏️</span> Cambiar Estado</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="documentToEdit">
            <div class="info-group mb-3">
              <label class="fw-bold text-muted small">Número de Documento</label>
              <p class="fs-6">{{ documentToEdit.numero_documento }}</p>
            </div>
            <div class="info-group mb-3">
              <label class="fw-bold text-muted small">Reasignado a</label>
              <p class="fs-6"><span>👤</span> {{ documentToEdit.reasignado_a || documentToEdit.destinatario }}</p>
            </div>
            <div class="info-group mb-3">
              <label class="fw-bold text-muted small">Estado Actual</label>
              <p class="fs-6"><span class="badge bg-info">{{ documentToEdit.estado }}</span></p>
            </div>
            <div class="mb-4">
              <label for="newState" class="form-label fw-bold">Selecciona nuevo estado:</label>
              <select v-model="editingState" id="newState" class="form-select form-select-lg">
                <option value="en tramite">📋 En Trámite</option>
                <option value="en elaboracion">✍️ En Elaboración</option>
                <option value="enviado">📤 Enviado</option>
                <option value="archivado">📦 Archivado</option>
              </select>
            </div>
          </div>
          <div class="modal-footer border-top bg-light">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" @click="saveStatusChange" :disabled="savingStatus">
              <span v-if="savingStatus" class="spinner-border spinner-border-sm me-2"></span>
              <span v-else>💾</span> Guardar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for user expired documents -->
    <div class="modal fade" id="userExpiredModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-bottom bg-light">
            <h5 class="modal-title"><span style="font-size: 1.5rem; margin-right: 8px;">👤</span> Documentos Expirados de {{ selectedUserExpired }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Número Documento</th>
                    <th>Fecha Máx. Respuesta</th>
                    <th>Días Expirados</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in getUserExpiredDocs(selectedUserExpired)" :key="d.id">
                    <td><strong>#{{ d.id }}</strong></td>
                    <td>{{ d.numero_documento }}</td>
                    <td>{{ formatDate(getDeadline(d)) }}</td>
                    <td><span class="badge bg-danger">❌ {{ getDaysExpired(d) }}</span></td>
                    <td>
                      <select v-if="editingDocId === d.id" v-model="tempEditState" class="form-select form-select-sm">
                        <option value="en tramite">📋 En Trámite</option>
                        <option value="en elaboracion">✍️ En Elaboración</option>
                        <option value="enviado">📤 Enviado</option>
                        <option value="archivado">📦 Archivado</option>
                      </select>
                      <span v-else><span class="badge bg-secondary">{{ d.estado }}</span></span>
                    </td>
                    <td>
                      <button v-if="editingDocId !== d.id" class="btn btn-sm btn-warning" @click="startEditingStatus(d)">✏️ Editar</button>
                      <div v-else class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-success" @click="saveStatusChangeInline(d)" :disabled="savingStatus">
                          <span v-if="savingStatus" class="spinner-border spinner-border-sm me-1"></span><span v-else>✓</span> Guardar
                        </button>
                        <button class="btn btn-secondary" @click="cancelEditingStatus">✕ Cancelar</button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="getUserExpiredDocs(selectedUserExpired).length === 0">
                    <td colspan="6" class="text-center text-muted py-4">
                      <span>✓</span> No hay documentos expirados para este usuario
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer border-top bg-light">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api'
import Chart from 'chart.js/auto'

export default {
  data() { return { counts: { reasignados: 0, tareas: 0, enviados: 0 }, expired: [], expiringDocuments: [], expiredStats: [], topExpired: null, selectedExpired: null, selectedUserExpired: null, chartInstance: null, monthlyChartInstance: null, allItems: [], enviadosItems: [], documentToEdit: null, editingState: '', savingStatus: false, editingDocId: null, tempEditState: '' } },
  async mounted() {
    await this.loadData();
    this.$nextTick(() => {
      this.initChart();
      this.initMonthlyChart();
    });
  },
  beforeUnmount() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    if (this.monthlyChartInstance) {
      this.monthlyChartInstance.destroy();
    }
  },
  methods: {
    async loadData() {
      try {
        const r1 = await api.get('/reasignados'); this.counts.reasignados = r1.data.length;
        const r2 = await api.get('/tareas'); this.counts.tareas = r2.data.length;
        const r3 = await api.get('/enviados'); this.counts.enviados = r3.data.length;
        
        // compute expired and expiring documents ONLY from reasignados table
        const reasignados = r1.data || [];
        const tareas = r2.data || [];
        const enviados = r3.data || [];
        
        this.allItems = reasignados;
        this.enviadosItems = enviados;
        
        // Usar SOLO la tabla reasignados para documentos expirados y próximos a expirar
        this.expired = reasignados.filter(i => this.isExpired(i));
        this.expiringDocuments = reasignados.filter(i => this.isExpiringInOneDay(i));
        
        // compute stats by reasignado
        const map = {};
        for (const it of this.expired) {
          const name = it.reasignado_a || it.asignado_para || it.destinatario || 'Sin asignar';
          map[name] = (map[name] || 0) + 1;
        }
        const arr = Object.keys(map).map(k => ({ name: k, count: map[k] }));
        arr.sort((a,b) => b.count - a.count);
        this.expiredStats = arr;
        this.topExpired = arr[0] || null;
      } catch (e) { /* ignore */ }
    },
    viewUserExpired(userName) {
      this.selectedUserExpired = userName;
      this.$nextTick(() => {
        const m = new bootstrap.Modal(document.getElementById('userExpiredModal'));
        m.show();
      });
    },
    getUserExpiredDocs(userName) {
      return this.expired.filter(d => {
        const docUser = d.reasignado_a || d.destinatario || 'Sin asignar';
        return docUser === userName;
      });
    },
    isExpiringInOneDay(item) {
      const st = (item.estado || item.status || item.avance || '').toString().toLowerCase().trim();
      
      // Solo excluir si está explícitamente archivado/eliminado/enviado/completado
      if (st && ['archivado', 'eliminado', 'enviado', 'completado'].includes(st)) {
        return false;
      }
      
      const dl = this.getDeadline(item);
      if (!dl) return false;
      
      // Obtener fecha de hoy en zona horaria local (sin horas)
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDay = today.getDate();
      
      // Obtener fecha de mañana
      const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const tomorrowYear = tomorrow.getFullYear();
      const tomorrowMonth = tomorrow.getMonth();
      const tomorrowDay = tomorrow.getDate();
      
      // Obtener fecha del deadline en zona horaria local (sin horas)
      const dlYear = dl.getFullYear();
      const dlMonth = dl.getMonth();
      const dlDay = dl.getDate();
      
      // Comparar solo year, month, day - NO considerar horas
      const isToday = (dlYear === todayYear && dlMonth === todayMonth && dlDay === todayDay);
      const isTomorrow = (dlYear === tomorrowYear && dlMonth === tomorrowMonth && dlDay === tomorrowDay);
      
      return isToday || isTomorrow;
    },
    getDaysUntilExpiry(item) {
      const deadline = this.getDeadline(item);
      if (!deadline) return 0;
      
      // Obtener solo la fecha, sin considerar horas
      const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Calcular la diferencia en días
      const diffMs = deadlineDate.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      return diffDays;
    },
    initChart() {
      const ctx = this.$refs.expiredChart;
      if (!ctx) return;
      
      // Agrupar documentos por fecha
      const dateMap = {};
      for (const doc of this.expired) {
        const deadline = this.getDeadline(doc);
        if (deadline) {
          const dateStr = this.formatDateShort(deadline);
          dateMap[dateStr] = (dateMap[dateStr] || 0) + 1;
        }
      }
      
      // Ordenar fechas
      const dates = Object.keys(dateMap).sort();
      const counts = dates.map(d => dateMap[d]);
      
      // Destruir gráfico anterior si existe
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }
      
      this.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dates,
          datasets: [{
            label: 'Documentos expirados',
            data: counts,
            backgroundColor: '#356DDC',
            borderColor: '#c82333',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    },
    getDaysExpired(item) {
      const deadline = this.getDeadline(item);
      if (!deadline) return 0;
      
      // Obtener solo la fecha, sin considerar horas
      const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Calcular diferencia en días (números positivos = ya expiró)
      const diffMs = todayDate.getTime() - deadlineDate.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      return diffDays;
    },
    formatDateShort(d) {
      if (!d) return '';
      if (typeof d === 'string') d = new Date(d);
      if (!(d instanceof Date)) return '';
      const ye = new Intl.DateTimeFormat('es', { year: 'numeric' }).format(d);
      const mo = new Intl.DateTimeFormat('es', { month: '2-digit' }).format(d);
      const da = new Intl.DateTimeFormat('es', { day: '2-digit' }).format(d);
      return `${da}/${mo}/${ye}`;
    },
    initMonthlyChart() {
      const ctx = this.$refs.monthlyChart;
      if (!ctx) return;
      
      // Get monthly stats for each document type
      // For reasignados: use fecha_reasignacion
      const reasignadosStats = this.getMonthlyStats(this.allItems, ['fecha_reasignacion', 'fecha_documento']);
      
      // For enviados: use fecha_documento or created_at
      const enviadosStats = this.getMonthlyStats(this.enviadosItems, ['fecha_documento', 'created_at']);
      
      // For vencidos (expired): use the deadline date
      const vencidosStats = {};
      for (const item of this.expired) {
        const deadline = this.getDeadline(item);
        if (deadline) {
          const monthKey = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}`;
          vencidosStats[monthKey] = (vencidosStats[monthKey] || 0) + 1;
        }
      }
      
      // Get all unique months
      const months = new Set();
      Object.keys(reasignadosStats).forEach(m => months.add(m));
      Object.keys(enviadosStats).forEach(m => months.add(m));
      Object.keys(vencidosStats).forEach(m => months.add(m));
      
      const sortedMonths = Array.from(months).sort();
      
      // Map data for each dataset
      const reasignadosData = sortedMonths.map(m => reasignadosStats[m] || 0);
      const enviadosData = sortedMonths.map(m => enviadosStats[m] || 0);
      const vencidosData = sortedMonths.map(m => vencidosStats[m] || 0);
      
      // Destroy previous chart if exists
      if (this.monthlyChartInstance) {
        this.monthlyChartInstance.destroy();
      }
      
      this.monthlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: sortedMonths,
          datasets: [
            {
              label: 'Reasignados',
              data: reasignadosData,
              borderColor: '#0d6efd',
              backgroundColor: 'rgba(13, 110, 253, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Enviados',
              data: enviadosData,
              borderColor: '#198754',
              backgroundColor: 'rgba(25, 135, 84, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Vencidos',
              data: vencidosData,
              borderColor: '#dc3545',
              backgroundColor: 'rgba(220, 53, 69, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    },
    getMonthlyStats(items, dateFieldPriority) {
      const monthMap = {};
      for (const item of items) {
        let dateField = null;
        // Try to find a date field using the priority list
        for (const fieldName of dateFieldPriority) {
          if (item[fieldName]) {
            dateField = item[fieldName];
            break;
          }
        }
        
        // If not found in priority, try any date field
        if (!dateField) {
          dateField = item.fecha_reasignacion || 
                     item.fecha_maxima || 
                     item.fecha_max_respuesta || 
                     item.fecha_documento || 
                     item.fecha_asignacion;
        }
        
        if (dateField) {
          const date = this.parseDateValue(dateField);
          if (date) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
          }
        }
      }
      return monthMap;
    },
    openExpired(d) { this.selectedExpired = d; const m = new bootstrap.Modal(document.getElementById('expiredModal')); m.show(); },
    startEditingStatus(d) {
      this.editingDocId = d.id;
      this.tempEditState = d.estado || 'en tramite';
    },
    cancelEditingStatus() {
      this.editingDocId = null;
      this.tempEditState = '';
    },
    async saveStatusChangeInline(d) {
      this.savingStatus = true;
      try {
        const updatedDoc = { ...d, estado: this.tempEditState };
        await api.put(`/reasignados/${d.id}`, updatedDoc);
        // Recargar todos los datos desde el servidor (Excel)
        await this.loadData();
        // Recargar el gráfico
        this.$nextTick(() => {
          this.initChart();
          this.initMonthlyChart();
        });
        // Clear editing state
        this.editingDocId = null;
        this.tempEditState = '';
      } catch (e) {
        alert('Error al guardar: ' + (e.response?.data?.message || e.message));
      } finally {
        this.savingStatus = false;
      }
    },
    openEditModal(d) {
      this.documentToEdit = { ...d };
      this.editingState = d.estado || 'en tramite';
      const m = new bootstrap.Modal(document.getElementById('editStatusModal'));
      m.show();
    },
    async saveStatusChange() {
      if (!this.documentToEdit) return;
      this.savingStatus = true;
      try {
        const updatedDoc = { ...this.documentToEdit, estado: this.editingState };
        await api.put(`/reasignados/${this.documentToEdit.id}`, updatedDoc);
        // Recargar todos los datos desde el servidor (Excel)
        await this.loadData();
        // Recargar el gráfico
        this.$nextTick(() => {
          this.initChart();
          this.initMonthlyChart();
        });
        // Close modal
        const modalEl = document.getElementById('editStatusModal');
        const m = bootstrap.Modal.getInstance(modalEl);
        if (m) m.hide();
        this.documentToEdit = null;
        this.editingState = '';
      } catch (e) {
        alert('Error al guardar: ' + (e.response?.data?.message || e.message));
      } finally {
        this.savingStatus = false;
      }
    },
    // helpers: copy parsing/isExpired logic from Reasignados page
    getDeadline(item) {
      // Usar SOLO fecha_max_respuesta de la tabla reasignados
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
      } catch (e) {}
      return null;
    },
    parseDateValue(v) {
      if (!v) return null;
      
      // Si es número (timestamp de Excel)
      if (typeof v === 'number') {
        const ts = (v - 25569) * 86400 * 1000;
        return new Date(ts);
      }
      
      const s = String(v).trim();
      
      // Intentar parsear formato YYYY-MM-DD HH:MM:SS
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
      
      // Intentar parsear formato DD/MM/YYYY HH:MM:SS
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
      
      // Limpiar y usar Date.parse como fallback
      const cleaned = s.replace(/\(.+\)/, '').replace(/\s+GMT.*$/, '').trim();
      const parsed = Date.parse(cleaned);
      if (!isNaN(parsed)) return new Date(parsed);
      
      // Intentar parsear formato simple DD/MM/YYYY o YYYY-MM-DD
      const match3 = cleaned.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (match3) {
        const day = parseInt(match3[1], 10);
        const month = parseInt(match3[2], 10) - 1;
        const year = parseInt(match3[3], 10);
        return new Date(year, month, day);
      }
      
      return null;
    },
    isExpired(item) {
      const st = (item.estado || item.status || item.avance || '').toString().toLowerCase();
      // Solo excluir si está explícitamente completado/archivado/eliminado/enviado
      if (['archivado', 'eliminado', 'enviado', 'completado'].includes(st)) return false;
      
      const dl = this.getDeadline(item);
      if (!dl) return false;
      
      // Obtener solo la fecha, sin considerar horas
      const deadlineDate = new Date(dl.getFullYear(), dl.getMonth(), dl.getDate());
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Documento está expirado si hoy es DESPUÉS de la fecha de vencimiento
      return todayDate.getTime() > deadlineDate.getTime();
    },
    formatDate(d) { if (!d) return ''; if (typeof d === 'string') d = new Date(d); if (!(d instanceof Date)) return ''; return d.toLocaleString(); }
  }
}
</script>
