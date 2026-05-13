<template>
  <div class="p-4">
    <!-- All KPI Cards - Clickeable para filtros -->
    <div class="row mb-5">
      <div class="col-lg-2-4 col-md-4 mb-4">
        <div class="kpi-card reasignados kpi-clickable" @click="goToReasignados()">
          <div class="kpi-icon">📋</div>
          <div class="kpi-title">Reasignados</div>
          <div class="kpi-number">{{ counts.reasignados }}</div>
          <small class="kpi-subtitle">Total de documentos</small>
        </div>
      </div>
      <div class="col-lg-2-4 col-md-4 mb-4">
        <div class="kpi-card pendientes kpi-clickable" @click="goToReasignados('pendientes')">
          <div class="kpi-icon">⏳</div>
          <div class="kpi-title">Pendientes</div>
          <div class="kpi-number">{{ counts.pendientes }}</div>
          <small class="kpi-subtitle">En estado pendiente</small>
        </div>
      </div>
      <div class="col-lg-2-4 col-md-4 mb-4">
        <div class="kpi-card vencidos kpi-clickable" @click="goToReasignados('vencidos')">
          <div class="kpi-icon">⛔</div>
          <div class="kpi-title">Vencidos</div>
          <div class="kpi-number">{{ counts.vencidos }}</div>
          <small class="kpi-subtitle">Plazo vencido</small>
        </div>
      </div>
      <div class="col-lg-2-4 col-md-4 mb-4">
        <div class="kpi-card proximosvencer kpi-clickable" @click="goToReasignados('proximosvencer')">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-title">Próximos a Vencer</div>
          <div class="kpi-number">{{ counts.proximosVencer }}</div>
          <small class="kpi-subtitle">En 24 horas</small>
        </div>
      </div>
      <div class="col-lg-2-4 col-md-4 mb-4">
        <div class="kpi-card completos kpi-clickable" @click="goToReasignados('completos')">
          <div class="kpi-icon">✓</div>
          <div class="kpi-title">Completos</div>
          <div class="kpi-number">{{ counts.completos }}</div>
          <small class="kpi-subtitle">Documentos completados</small>
        </div>
      </div>
      <div class="col-lg-2-4 col-md-4 mb-4">
        <div class="kpi-card otros kpi-clickable" @click="mostrarEstadosOtros">
          <div class="kpi-icon">❓</div>
          <div class="kpi-title">Otros</div>
          <div class="kpi-number">{{ counts.otros }}</div>
          <small class="kpi-subtitle" v-if="estadosDistintos.length > 0">{{ estadosDistintos.join(', ') }}</small>
          <small class="kpi-subtitle" v-else>Sin otros estados</small>
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


    <!-- Row 3: Gráficos de Reasignados -->
    <div class="row mb-5">
      <!-- Reasignados por Usuario -->
      <div class="col-lg-6 mb-4">
        <div class="card h-100">
          <div class="card-header">
            <span>👥</span> Reasignados por Persona
          </div>
          <div class="card-body">
            <canvas id="reasignadosPorUsuarioChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Reasignados por Importancia con detalles -->
      <div class="col-lg-6 mb-4">
        <div class="card h-100">
          <div class="card-header">
            <span>🎯</span> Reasignados por Importancia
          </div>
          <div class="card-body">
            <canvas id="reasignadosPorImportanciaChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de Reasignados por Usuario -->
    <div class="row mb-5">
      <div class="col-12 mb-4">
        <div class="card">
          <div class="card-header">
            <span>📊</span> Carga de Trabajo por Persona
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover mb-0" v-if="reasignadosPorUsuario.length > 0">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Total</th>
                    <th>Pendientes</th>
                    <th>Resueltos</th>
                    <th>Vencidos</th>
                    <th>% Cumplimiento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="usuario in reasignadosPorUsuario" :key="usuario.persona">
                    <td><strong>{{ usuario.persona }}</strong></td>
                    <td><span class="badge bg-primary">{{ usuario.total }}</span></td>
                    <td><span class="badge" :class="usuario.pendientes > 5 ? 'bg-danger' : 'bg-warning'">{{ usuario.pendientes }}</span></td>
                    <td><span class="badge bg-success">{{ usuario.resueltos }}</span></td>
                    <td><span class="badge" :class="usuario.vencidos > 0 ? 'bg-danger' : 'bg-secondary'">{{ usuario.vencidos }}</span></td>
                    <td>
                      <div class="progress" style="height: 20px;">
                        <div class="progress-bar" :class="usuario.total > 0 && (usuario.resueltos/usuario.total) >= 0.8 ? 'bg-success' : 'bg-warning'"
                             :style="{width: usuario.total > 0 ? ((usuario.resueltos/usuario.total)*100) + '%' : '0%'}">
                          {{ usuario.total > 0 ? Math.round((usuario.resueltos/usuario.total)*100) : 0 }}%
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="text-center py-4 text-muted">
                <span>✓</span> Sin datos
              </div>
            </div>
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
        pendientes: 0,
        vencidos: 0,
        proximosVencer: 0,
        completos: 0,
        otros: 0
      },
      estadosDistintos: [],
      kpiReasignados: {
        total: 0,
        pendientes: 0,
        resueltos: 0,
        vencidos: 0,
        proximosVencer: 0,
        tasa_cumplimiento: 0,
        tiempoPromedioRespuesta: 0,
        documentosResueltos: 0
      },
      reasignadosPorUsuario: [],
      reasignadosPorImportancia: [],
      charts: {},
      usuarioActual: null,
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
        const docs = reasRes.data || [];

        // Establecer fechas de referencia
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Contar todos los reasignados
        this.counts.reasignados = docs.length;

        // Contar pendientes: estado = 'pendiente' sin retraso y no próximos a vencer
        // fecha_max_respuesta > tomorrow (después de mañana)
        this.counts.pendientes = docs.filter(r => {
          if (!r.fecha_max_respuesta) return false;
          const estado = (r.estado || '').toString().toLowerCase().trim();
          const fechaMax = new Date(r.fecha_max_respuesta);
          fechaMax.setHours(0, 0, 0, 0);
          return estado === 'pendiente' && fechaMax > tomorrow;
        }).length;

        // Contar vencidos: estado = 'pendiente' con más de 1 día de retraso
        // fecha_max_respuesta < yesterday (antes de ayer)
        this.counts.vencidos = docs.filter(r => {
          if (!r.fecha_max_respuesta) return false;
          const estado = (r.estado || '').toString().toLowerCase().trim();
          const fechaMax = new Date(r.fecha_max_respuesta);
          fechaMax.setHours(0, 0, 0, 0);
          return estado === 'pendiente' && fechaMax < yesterday;
        }).length;

        // Contar próximos a vencer: estado = 'pendiente' a 1 día de vencer
        // fecha_max_respuesta está entre hoy y mañana (inclusive)
        this.counts.proximosVencer = docs.filter(r => {
          if (!r.fecha_max_respuesta) return false;
          const estado = (r.estado || '').toString().toLowerCase().trim();
          const fechaMax = new Date(r.fecha_max_respuesta);
          fechaMax.setHours(0, 0, 0, 0);
          return estado === 'pendiente' && fechaMax >= now && fechaMax <= tomorrow;
        }).length;

        // Contar completos: estado = 'completo'
        this.counts.completos = docs.filter(r => {
          const estado = (r.estado || '').toString().toLowerCase().trim();
          return estado === 'completo';
        }).length;

        // Contar "otros": documentos que no encajen en las categorías anteriores
        const estadosContados = new Set();
        docs.forEach(r => {
          const estado = (r.estado || '').toString().toLowerCase().trim();
          const fechaMax = new Date(r.fecha_max_respuesta);
          fechaMax.setHours(0, 0, 0, 0);

          const esPendiente = estado === 'pendiente' && fechaMax > tomorrow;
          const esVencido = estado === 'pendiente' && fechaMax < yesterday;
          const esProximoVencer = estado === 'pendiente' && fechaMax >= now && fechaMax <= tomorrow;
          const esCompleto = estado === 'completo';

          if (!esPendiente && !esVencido && !esProximoVencer && !esCompleto) {
            estadosContados.add(estado);
          }
        });

        this.counts.otros = docs.filter(r => {
          const estado = (r.estado || '').toString().toLowerCase().trim();
          const fechaMax = new Date(r.fecha_max_respuesta);
          fechaMax.setHours(0, 0, 0, 0);

          const esPendiente = estado === 'pendiente' && fechaMax > tomorrow;
          const esVencido = estado === 'pendiente' && fechaMax < yesterday;
          const esProximoVencer = estado === 'pendiente' && fechaMax >= now && fechaMax <= tomorrow;
          const esCompleto = estado === 'completo';

          return !esPendiente && !esVencido && !esProximoVencer && !esCompleto;
        }).length;

        // Guardar estados distintos para debugging
        this.estadosDistintos = Array.from(estadosContados);
        console.log('Estados no contabilizados:', this.estadosDistintos);
        console.log('Resumen: Reasignados:', this.counts.reasignados, 'Pendientes:', this.counts.pendientes, 'Vencidos:', this.counts.vencidos, 'Próximos:', this.counts.proximosVencer, 'Completos:', this.counts.completos, 'Otros:', this.counts.otros, 'Total:', this.counts.pendientes + this.counts.vencidos + this.counts.proximosVencer + this.counts.completos + this.counts.otros);

        // Load statistics (only reasignados-related)
        console.log('Loading reasignados statistics...');
        const [kpiReas, reasxUsuario, reasxImportancia, tiempoPromedio] = await Promise.all([
          api.get('/estadisticas/kpi/reasignados').catch(e => { console.error('kpiReasignados error:', e); return {data: {}}; }),
          api.get('/estadisticas/kpi/reasignados-por-usuario').catch(e => { console.error('reasignadosPorUsuario error:', e); return {data: []}; }),
          api.get('/estadisticas/kpi/reasignados-por-importancia').catch(e => { console.error('reasignadosPorImportancia error:', e); return {data: []}; }),
          api.get('/estadisticas/kpi/tiempo-promedio-respuesta').catch(e => { console.error('tiempoPromedio error:', e); return {data: {}}; })
        ]);

        this.kpiReasignados = { ...kpiReas.data };
        this.kpiReasignados.tiempoPromedioRespuesta = tiempoPromedio.data?.tiempo_promedio_dias || 0;
        this.kpiReasignados.documentosResueltos = tiempoPromedio.data?.documentos_resueltos || 0;
        this.reasignadosPorUsuario = reasxUsuario.data;
        this.reasignadosPorImportancia = reasxImportancia.data;

        console.log('Reasignados statistics loaded');

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
      this.renderReasignadosPorUsuarioChart();
      this.renderReasignadosPorImportanciaChart();
    },
    renderReasignadosPorUsuarioChart() {
      const ctx = document.getElementById('reasignadosPorUsuarioChart');
      if (!ctx) return;

      if (this.charts.reasignadosPorUsuario) this.charts.reasignadosPorUsuario.destroy();

      const data = this.reasignadosPorUsuario;
      this.charts.reasignadosPorUsuario = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(d => d.persona),
          datasets: [
            {
              label: 'Pendientes',
              data: data.map(d => d.pendientes || 0),
              backgroundColor: '#dc3545'
            },
            {
              label: 'Resueltos',
              data: data.map(d => d.resueltos || 0),
              backgroundColor: '#198754'
            },
            {
              label: 'Vencidos',
              data: data.map(d => d.vencidos || 0),
              backgroundColor: '#fd7e14'
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
    renderReasignadosPorImportanciaChart() {
      const ctx = document.getElementById('reasignadosPorImportanciaChart');
      if (!ctx) return;

      if (this.charts.reasignadosPorImportancia) this.charts.reasignadosPorImportancia.destroy();

      const data = this.reasignadosPorImportancia;
      const colors = ['#dc3545', '#fd7e14', '#ffc107', '#198754', '#6c757d'];
      const colorMap = {
        'Urgente': '#dc3545',
        'Alta': '#fd7e14',
        'Media': '#ffc107',
        'Baja': '#198754',
        'No especificada': '#6c757d'
      };

      this.charts.reasignadosPorImportancia = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.map(d => d.importancia),
          datasets: [{
            data: data.map(d => d.pendientes || 0),
            backgroundColor: data.map(d => colorMap[d.importancia] || '#6c757d')
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'right' }
          }
        }
      });
    },
    goToReasignados(filtro = null) {
      const query = filtro ? { filtro } : {};
      this.$router.push({ path: '/reasignados', query });
    },
    mostrarEstadosOtros() {
      if (this.estadosDistintos.length > 0) {
        alert(`Estados no contabilizados: ${this.estadosDistintos.join(', ')}`);
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

@media (min-width: 992px) {
  .col-lg-2-4 {
    flex: 0 0 20%;
    max-width: 20%;
  }
}

.kpi-card {
  padding: 20px;
  border-radius: 10px;
  color: white;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.kpi-card:hover {
  transform: translateY(-5px);
}

.kpi-clickable {
  cursor: pointer;
}

.kpi-clickable:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  transform: translateY(-8px);
}

.kpi-card.reasignados {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.kpi-card.expirados {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.kpi-card.pendientes {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.kpi-card.vencidos {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.kpi-card.proximosvencer {
  background: linear-gradient(135deg, #f5a623 0%, #f8a100 100%);
}

.kpi-card.completos {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.kpi-card.otros {
  background: linear-gradient(135deg, #8e9296 0%, #b0b3b8 100%);
}

.kpi-subtitle {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.85rem;
}

.text-warning-kpi {
  color: #ffc107 !important;
}

.text-danger-kpi {
  color: #ff6b6b !important;
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
