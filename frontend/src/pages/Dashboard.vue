<template>
  <div class="p-4">
    <!-- Encabezado -->
    <div class="mb-5">
      <h1 class="page-title">📊 Dashboard de Documentos</h1>
      <p class="text-muted">Panel de control con estadísticas en tiempo real</p>
    </div>

    <!-- Tarjetas KPI -->
    <div class="row mb-5">
      <div class="col-lg-3 col-md-6 mb-4">
        <div class="kpi-card reasignados">
          <div class="kpi-icon">📋</div>
          <div class="kpi-title">Reasignados</div>
          <div class="kpi-number">{{ counts.reasignados }}</div>
          <a class="kpi-button" href="/reasignados">Ver →</a>
        </div>
      </div>
      <div class="col-lg-3 col-md-6 mb-4">
        <div class="kpi-card expirados">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-title">Expirados</div>
          <div class="kpi-number">{{ counts.expirados }}</div>
          <small class="text-muted">Requieren atención</small>
        </div>
      </div>
      <div class="col-lg-3 col-md-6 mb-4">
        <div class="kpi-card enviados">
          <div class="kpi-icon">📤</div>
          <div class="kpi-title">Enviados</div>
          <div class="kpi-number">{{ counts.enviados }}</div>
          <a class="kpi-button" href="/enviados">Ver →</a>
        </div>
      </div>
      <div class="col-lg-3 col-md-6 mb-4">
        <div class="kpi-card tareas">
          <div class="kpi-icon">✓</div>
          <div class="kpi-title">Tareas</div>
          <div class="kpi-number">{{ counts.tareas }}</div>
          <a class="kpi-button" href="/tareas">Ver →</a>
        </div>
      </div>
    </div>

    <!-- Tabla de Usuarios con Expirados -->
    <div class="row mb-5">
      <div class="col-lg-6 mb-4">
        <div class="card h-100">
          <div class="card-header">
            <span>👥</span> Documentos Expirados (por Usuario)
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover mb-0" v-if="expiredByUser.length > 0">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Área</th>
                    <th>Expirados</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in expiredByUser" :key="row.usuario_id">
                    <td><strong>👤 {{ row.nombre }}</strong></td>
                    <td>{{ row.gerencia || '-' }}</td>
                    <td><span class="badge bg-danger">{{ row.count }}</span></td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="text-center py-4 text-muted">
                <span>✓</span> Sin expirados
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6 mb-4">
        <div class="card h-100">
          <div class="card-header">
            <span>⏰</span> Próximos a Expirar (1 día)
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover mb-0" v-if="upcomingExpiry.length > 0">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Asignado a</th>
                    <th>Vence en</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="doc in upcomingExpiry" :key="doc.id" class="table-warning">
                    <td><strong>{{ doc.numero_documento }}</strong></td>
                    <td>{{ doc.reasignado_a }}</td>
                    <td>
                      <span class="badge bg-warning text-dark">{{ getDaysUntilExpiry(doc.fecha_max_respuesta) }}h</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="text-center py-4 text-muted">
                <span>✓</span> Sin próximos vencimientos
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 1: Gráficos principales -->
    <div class="row mb-5">
      <!-- Progreso de Tareas por Área -->
      <div v-if="!esSoloLectura" class="col-lg-6 mb-4">
        <div class="card h-100">
          <div class="card-header">
            <span>📈</span> Progreso de Tareas por Área
          </div>
          <div class="card-body">
            <canvas id="tareasAreaChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Documentos Expirados por Área -->
      <div v-if="!esSoloLectura" class="col-lg-6 mb-4">
        <div class="card h-100">
          <div class="card-header">
            <span>🔴</span> Documentos Expirados por Área
          </div>
          <div class="card-body">
            <canvas id="expiradosAreaChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 2: Más gráficos -->
    <div class="row mb-5">
      <!-- Distribución de Tipos de Documento -->
      <div v-if="!esSoloLectura" class="col-lg-4 mb-4">
        <div class="card h-100">
          <div class="card-header">
            <span>📄</span> Tipos de Documento
          </div>
          <div class="card-body">
            <canvas id="tiposDocumentoChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Estado de Tareas -->
      <div :class="esSoloLectura ? 'col-lg-6 mb-4' : 'col-lg-4 mb-4'">
        <div class="card h-100">
          <div class="card-header">
            <span>⚙️</span> Estado de Tareas
          </div>
          <div class="card-body">
            <canvas id="estadoTareasChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Distribución de Importancia -->
      <div :class="esSoloLectura ? 'col-lg-6 mb-4' : 'col-lg-4 mb-4'">
        <div class="card h-100">
          <div class="card-header">
            <span>📊</span> Importancia de Documentos
          </div>
          <div class="card-body">
            <canvas id="importanciaChart"></canvas>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
import api from '../api';

Chart.register(...registerables);

export default {
  name: 'Dashboard',
  data() {
    return {
      counts: {
        reasignados: 0,
        tareas: 0,
        enviados: 0,
        expirados: 0
      },
      charts: {},
      usuarioActual: null,
      estadisticas: {
        tareasArea: [],
        expiradosArea: [],
        tiposDocumento: [],
        estadoTareas: [],
        importancia: []
      },
      expiredByUser: [],
      upcomingExpiry: [],
      refreshInterval: null,
      autoRefreshEnabled: true
    };
  },
  computed: {
    esSoloLectura() {
      const rol = (this.usuarioActual?.rol || '').toLowerCase();
      return rol === 'solo_vista' || rol === 'solo lectura' || rol === 'lectura';
    }
  },
  mounted() {
    this.cargarUsuarioActual();
    this.loadData();
    // Auto-refresh cada 30 segundos
    this.refreshInterval = setInterval(() => {
      if (this.autoRefreshEnabled) {
        console.log('Auto-refreshing dashboard...');
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
    async cargarUsuarioActual() {
      try {
        const response = await api.get('/auth/usuario');
        this.usuarioActual = response.data?.usuario || null;
      } catch (error) {
        this.usuarioActual = null;
      }
    },
    async loadData() {
      try {
        console.log('Loading dashboard data...');
        
        // Load reasignados
        const reasRes = await api.get('/reasignados');
        console.log('Reasignados:', reasRes.data);
        this.counts.reasignados = reasRes.data.length;
        this.counts.expirados = reasRes.data.filter(r => {
          if (!r.fecha_max_respuesta) return false;
          const estado = (r.estado || '').toString().toLowerCase().trim();
          const isExpired = new Date(r.fecha_max_respuesta) < new Date();
          const isExcluded = ['archivado', 'eliminado', 'enviado', 'completado', 'resuelto', 'cancelado'].includes(estado);
          return isExpired && !isExcluded;
        }).length;

        // Load tareas
        const tareasRes = await api.get('/tareas');
        console.log('Tareas:', tareasRes.data);
        this.counts.tareas = tareasRes.data.length;

        // Load enviados
        const enviRes = await api.get('/enviados');
        console.log('Enviados:', enviRes.data);
        this.counts.enviados = enviRes.data.length;

        // Load statistics
        console.log('Loading statistics...');
        const [tareasArea, expirados, tipos, estado, importancia] = await Promise.all([
          api.get('/estadisticas/tareas-por-area').catch(e => { console.error('tareasArea error:', e); return {data: []}; }),
          api.get('/estadisticas/documentos-expirados-por-area').catch(e => { console.error('expirados error:', e); return {data: []}; }),
          api.get('/estadisticas/tipos-documento').catch(e => { console.error('tipos error:', e); return {data: []}; }),
          api.get('/estadisticas/estado-tareas').catch(e => { console.error('estado error:', e); return {data: []}; }),
          api.get('/estadisticas/importancia-reasignados').catch(e => { console.error('importancia error:', e); return {data: []}; })
        ]);

        this.estadisticas.tareasArea = tareasArea.data;
        this.estadisticas.expiradosArea = expirados.data;
        this.estadisticas.tiposDocumento = tipos.data;
        this.estadisticas.estadoTareas = estado.data;
        this.estadisticas.importancia = importancia.data;

        console.log('All statistics loaded:', this.estadisticas);

        // Load expired and upcoming data
        await Promise.all([
          this.loadExpiredByUser(),
          this.loadUpcomingExpiry()
        ]);

        // Render charts
        this.$nextTick(() => {
          this.renderCharts();
        });
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    },
    async loadReasignados() {
      try {
        const res = await api.get('/reasignados');
        this.counts.reasignados = res.data.length;
      } catch (err) {
        console.error('Error loading reasignados:', err);
      }
    },
    async loadTareas() {
      try {
        const res = await api.get('/tareas');
        this.counts.tareas = res.data.length;
      } catch (err) {
        console.error('Error loading tareas:', err);
      }
    },
    async loadEnviados() {
      try {
        const res = await api.get('/enviados');
        this.counts.enviados = res.data.length;
      } catch (err) {
        console.error('Error loading enviados:', err);
      }
    },
    async loadExpiredByUser() {
      try {
        console.log('Loading expired by user...');
        const res = await api.get('/reasignados');
        const now = new Date();
        const expiredByUser = {};
        
        console.log('Reasignados for expired check:', res.data.length);
        
        res.data.forEach(item => {
          if (item.fecha_max_respuesta) {
            const fecha = new Date(item.fecha_max_respuesta);
            const estado = (item.estado || '').toString().toLowerCase().trim();
            const isExcluded = ['archivado', 'eliminado', 'enviado', 'completado', 'resuelto', 'cancelado'].includes(estado);
            const isExpired = fecha < now && !isExcluded;
            
            if (isExpired) {
              const userId = item.usuario_id || 'sin_asignar';
              if (!expiredByUser[userId]) {
                expiredByUser[userId] = {
                  usuario_id: userId,
                  nombre: item.reasignado_a || 'Sin asignar',
                  gerencia: '',
                  count: 0
                };
              }
              expiredByUser[userId].count++;
              console.log('Found expired:', item.numero_documento, 'Fecha max:', item.fecha_max_respuesta, 'Estado:', item.estado);
            }
          }
        });

        // Obtener información de usuarios
        try {
          const usuariosRes = await api.get('/usuarios/activos/lista');
          Object.keys(expiredByUser).forEach(userId => {
            const usuario = usuariosRes.data.find(u => u.id == userId);
            if (usuario) {
              expiredByUser[userId].nombre = usuario.nombre;
              expiredByUser[userId].gerencia = usuario.gerencia;
            }
          });
        } catch (err) {
          console.warn('Error loading usuarios info');
        }

        this.expiredByUser = Object.values(expiredByUser).sort((a, b) => b.count - a.count);
        console.log('Expired by user:', this.expiredByUser);
      } catch (err) {
        console.error('Error loading expired by user:', err);
      }
    },
    async loadUpcomingExpiry() {
      try {
        console.log('Loading upcoming expiry...');
        const res = await api.get('/reasignados');
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        console.log('Now:', now, 'Tomorrow:', tomorrow);

        this.upcomingExpiry = res.data.filter(item => {
          if (!item.fecha_max_respuesta) return false;
          const fecha = new Date(item.fecha_max_respuesta);
          fecha.setHours(0, 0, 0, 0);
          const estado = (item.estado || '').toString().toLowerCase().trim();
          const isExcluded = ['archivado', 'eliminado', 'enviado', 'completado', 'resuelto', 'cancelado'].includes(estado);
          const isInRange = fecha >= now && fecha <= tomorrow && !isExcluded;
          if (isInRange) {
            console.log('Upcoming:', item.numero_documento, 'Fecha:', item.fecha_max_respuesta, 'Estado:', item.estado);
          }
          return isInRange;
        }).sort((a, b) => new Date(a.fecha_max_respuesta) - new Date(b.fecha_max_respuesta));
        console.log('Upcoming expiry items:', this.upcomingExpiry.length);
      } catch (err) {
        console.error('Error loading upcoming expiry:', err);
      }
    },
    getDaysUntilExpiry(date) {
      if (!date) return 'N/A';
      const exp = new Date(date);
      const now = new Date();
      const diffTime = exp.getTime() - now.getTime();
      const diffHours = Math.round(diffTime / (1000 * 60 * 60));
      return Math.max(0, diffHours);
    },
    renderCharts() {
      if (!this.esSoloLectura) {
        this.renderTareasAreaChart();
        this.renderExpiradosAreaChart();
        this.renderTiposDocumentoChart();
      }
      this.renderEstadoTareasChart();
      this.renderImportanciaChart();
    },
    renderTareasAreaChart() {
      const ctx = document.getElementById('tareasAreaChart');
      if (!ctx) return;

      if (this.charts.tareasArea) this.charts.tareasArea.destroy();

      const data = this.estadisticas.tareasArea;
      this.charts.tareasArea = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(d => d.area),
          datasets: [
            {
              label: 'Completadas',
              data: data.map(d => d.completadas || 0),
              backgroundColor: '#198754'
            },
            {
              label: 'En Proceso',
              data: data.map(d => d.en_proceso || 0),
              backgroundColor: '#ffc107'
            },
            {
              label: 'Pendientes',
              data: data.map(d => d.pendientes || 0),
              backgroundColor: '#dc3545'
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            x: { stacked: false },
            y: { beginAtZero: true }
          },
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    },
    renderExpiradosAreaChart() {
      const ctx = document.getElementById('expiradosAreaChart');
      if (!ctx) return;

      if (this.charts.expiradosArea) this.charts.expiradosArea.destroy();

      const data = this.estadisticas.expiradosArea;
      this.charts.expiradosArea = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.map(d => `${d.area} (${d.expirados || 0}/${d.total})`),
          datasets: [{
            data: data.map(d => d.expirados || 0),
            backgroundColor: [
              '#dc3545', '#fd7e14', '#ffc107', '#198754', '#0dcaf0', '#6f42c1'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    },
    renderTiposDocumentoChart() {
      const ctx = document.getElementById('tiposDocumentoChart');
      if (!ctx) return;

      if (this.charts.tiposDocumento) this.charts.tiposDocumento.destroy();

      const data = this.estadisticas.tiposDocumento;
      this.charts.tiposDocumento = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: data.map(d => d.tipo),
          datasets: [{
            data: data.map(d => d.cantidad),
            backgroundColor: [
              '#0dcaf0', '#198754', '#ffc107', '#dc3545', '#6f42c1'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    },
    renderEstadoTareasChart() {
      const ctx = document.getElementById('estadoTareasChart');
      if (!ctx) return;

      if (this.charts.estadoTareas) this.charts.estadoTareas.destroy();

      const data = this.estadisticas.estadoTareas;
      this.charts.estadoTareas = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.map(d => `${d.estado} (${d.cantidad})`),
          datasets: [{
            data: data.map(d => d.cantidad),
            backgroundColor: [
              '#198754', '#ffc107', '#dc3545', '#0dcaf0'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    },
    renderImportanciaChart() {
      const ctx = document.getElementById('importanciaChart');
      if (!ctx) return;

      if (this.charts.importancia) this.charts.importancia.destroy();

      const data = this.estadisticas.importancia;
      const order = { 'Urgente': 0, 'Alta': 1, 'Media': 2, 'Baja': 3 };
      const sortedData = data.sort((a, b) => (order[a.importancia] || 999) - (order[b.importancia] || 999));

      this.charts.importancia = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sortedData.map(d => d.importancia),
          datasets: [{
            label: 'Cantidad',
            data: sortedData.map(d => d.cantidad),
            backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#198754']
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          scales: {
            x: { beginAtZero: true }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
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

.kpi-card {
  padding: 20px;
  border-radius: 10px;
  color: white;
  text-align: center;
  transition: transform 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.kpi-card:hover {
  transform: translateY(-5px);
}

.kpi-card.reasignados {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.kpi-card.tareas {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.kpi-card.enviados {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.kpi-card.expirados {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.kpi-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.kpi-title {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 5px;
}

.kpi-number {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.kpi-button {
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  opacity: 0.9;
  transition: opacity 0.3s;
}

.kpi-button:hover {
  opacity: 1;
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

canvas {
  max-height: 300px;
}

.table-hover tbody tr:hover {
  background-color: #f5f5f5;
}

.badge {
  font-size: 0.9rem;
  padding: 5px 10px;
}
</style>
