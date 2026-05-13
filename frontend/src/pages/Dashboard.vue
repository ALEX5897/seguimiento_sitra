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
            <div class="table-responsive expired-table-container">
              <table class="table table-hover mb-0" v-if="expiredByUser.length > 0">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Número de Documento</th>
                    <th>Días Expirados</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="doc in expiredByUser" :key="doc.id" class="table-danger cursor-pointer" @click="abrirModalDocumento(doc)" style="cursor: pointer;">
                    <td><strong>👤 {{ doc.reasignado_a }}</strong></td>
                    <td><code>{{ doc.numero_documento }}</code></td>
                    <td>
                      <span class="badge bg-danger">{{ getDiasExpirados(doc.fecha_max_respuesta) }} días</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="text-center py-4 text-muted">
                <span>✓</span> Sin documentos expirados
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
            <div class="table-responsive expired-table-container">
              <table class="table table-hover mb-0" v-if="upcomingExpiry.length > 0">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Asignado a</th>
                    <th>Vence en</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="doc in upcomingExpiry" :key="doc.id" class="table-warning cursor-pointer" @click="abrirModalDocumento(doc)" style="cursor: pointer;">
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
                    <th>Completos</th>
                    <th>Vencidos</th>
                    <th>Próximos a Vencer</th>
                    <th>% Cumplimiento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="usuario in reasignadosPorUsuario" :key="usuario.persona">
                    <td><strong>{{ usuario.persona }}</strong></td>
                    <td><span class="badge bg-primary">{{ usuario.total }}</span></td>
                    <td><span class="badge" :class="usuario.pendientes > 5 ? 'bg-danger' : 'bg-warning'">{{ usuario.pendientes }}</span></td>
                    <td><span class="badge bg-success">{{ usuario.completos }}</span></td>
                    <td><span class="badge" :class="usuario.vencidos > 0 ? 'bg-danger' : 'bg-secondary'">{{ usuario.vencidos }}</span></td>
                    <td><span class="badge bg-info">{{ usuario.proximosVencer }}</span></td>
                    <td>
                      <div class="progress" style="height: 20px;">
                        <div class="progress-bar" :class="usuario.cumplimiento >= 80 ? 'bg-success' : 'bg-warning'"
                             :style="{width: usuario.cumplimiento + '%'}">
                          {{ usuario.cumplimiento }}%
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

    <!-- Modal de Detalle del Documento -->
    <div class="modal fade" id="modalDetalleDocumento" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-bottom bg-light">
            <h5 class="modal-title">
              <span style="font-size: 1.5rem; margin-right: 8px;">📄</span>
              Detalles del Documento
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" v-if="documentoSeleccionado">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label fw-bold text-muted small">Número de Documento</label>
                <p class="fs-6"><code>{{ documentoSeleccionado.numero_documento }}</code></p>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label fw-bold text-muted small">Reasignado a</label>
                <p class="fs-6">👤 {{ documentoSeleccionado.reasignado_a }}</p>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label fw-bold text-muted small">Fecha Máxima de Respuesta</label>
                <p class="fs-6">{{ new Date(documentoSeleccionado.fecha_max_respuesta).toLocaleString() }}</p>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label fw-bold text-muted small">Días Expirados</label>
                <p class="fs-6">
                  <span class="badge bg-danger">{{ getDiasExpirados(documentoSeleccionado.fecha_max_respuesta) }} días</span>
                </p>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label fw-bold text-muted small">Estado Actual</label>
                <p class="fs-6"><span class="badge bg-info">{{ documentoSeleccionado.estado }}</span></p>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">Cambiar Estado</label>
                <select v-model="documentoSeleccionado.estado" class="form-select">
                  <option value="">-- Seleccionar estado --</option>
                  <option v-for="estado in estados" :key="estado.id" :value="estado.nombre">
                    {{ estado.icono ? estado.icono + ' ' : '' }}{{ estado.nombre }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top bg-light">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" @click="guardarCambios" :disabled="isSaving">
              <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
              💾 Guardar Cambios
            </button>
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
      documentoSeleccionado: null,
      estados: [],
      isSaving: false,
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
    this.cargarEstados();
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
    calcularCargaTrabajoPorPersona(docs, now, tomorrow, yesterday) {
      const cargaPorPersona = {};

      docs.forEach(doc => {
        const persona = doc.reasignado_a || 'Sin asignar';
        const estado = (doc.estado || '').toString().toLowerCase().trim();
        const fecha = new Date(doc.fecha_max_respuesta);
        fecha.setHours(0, 0, 0, 0);

        if (!cargaPorPersona[persona]) {
          cargaPorPersona[persona] = {
            persona,
            total: 0,
            pendientes: 0,
            completos: 0,
            vencidos: 0,
            proximosVencer: 0
          };
        }

        cargaPorPersona[persona].total++;

        // Contar pendientes: estado = 'pendiente' sin retraso y no próximos a vencer
        // fecha_max_respuesta > tomorrow (después de mañana)
        if (estado === 'pendiente' && fecha > tomorrow) {
          cargaPorPersona[persona].pendientes++;
        }

        // Contar completos: estado = 'completo'
        if (estado === 'completo') {
          cargaPorPersona[persona].completos++;
        }

        // Contar vencidos: estado = 'pendiente' con más de 1 día de retraso
        // fecha_max_respuesta < yesterday (antes de ayer)
        if (estado === 'pendiente' && fecha < yesterday) {
          cargaPorPersona[persona].vencidos++;
        }

        // Contar próximos a vencer: estado = 'pendiente' a 1 día de vencer
        // fecha_max_respuesta está entre hoy y mañana (inclusive)
        if (estado === 'pendiente' && fecha >= now && fecha <= tomorrow) {
          cargaPorPersona[persona].proximosVencer++;
        }
      });

      // Convertir a array y calcular % de cumplimiento
      this.reasignadosPorUsuario = Object.values(cargaPorPersona).map(item => ({
        ...item,
        cumplimiento: item.total > 0 ? Math.round((item.completos / item.total) * 100) : 0
      })).sort((a, b) => b.total - a.total);

      console.log('Carga de trabajo por persona:', this.reasignadosPorUsuario);
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

        // Construir datos de importancia dinámicamente desde los documentos
        const conteoImportancia = {};
        docs.forEach(doc => {
          const imp = (doc.importancia || 'No especificada').trim();
          if (!conteoImportancia[imp]) {
            conteoImportancia[imp] = { importancia: imp, pendientes: 0 };
          }
          const estado = (doc.estado || '').toString().toLowerCase().trim();
          if (estado === 'pendiente') {
            conteoImportancia[imp].pendientes++;
          }
        });
        this.reasignadosPorImportancia = Object.values(conteoImportancia);
        console.log('✓ Reasignados por importancia construidos:', this.reasignadosPorImportancia);

        // Load statistics (only reasignados-related)
        console.log('Loading reasignados statistics...');
        const [kpiReas, reasxUsuario, tiempoPromedio] = await Promise.all([
          api.get('/estadisticas/kpi/reasignados').catch(e => { console.error('kpiReasignados error:', e); return {data: {}}; }),
          api.get('/estadisticas/kpi/reasignados-por-usuario').catch(e => { console.error('reasignadosPorUsuario error:', e); return {data: []}; }),
          api.get('/estadisticas/kpi/tiempo-promedio-respuesta').catch(e => { console.error('tiempoPromedio error:', e); return {data: {}}; })
        ]);

        this.kpiReasignados = { ...kpiReas.data };
        this.kpiReasignados.tiempoPromedioRespuesta = tiempoPromedio.data?.tiempo_promedio_dias || 0;
        this.kpiReasignados.documentosResueltos = tiempoPromedio.data?.documentos_resueltos || 0;

        // Calcular carga de trabajo por persona
        this.calcularCargaTrabajoPorPersona(docs, now, tomorrow, yesterday);

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
        console.log('Loading expired documents...');
        const res = await api.get('/reasignados');
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const expiredDocuments = [];

        console.log('Reasignados for expired check:', res.data.length);

        res.data.forEach(item => {
          if (item.fecha_max_respuesta) {
            const estado = (item.estado || '').toString().toLowerCase().trim();
            const fecha = new Date(item.fecha_max_respuesta);
            // Solo documentos en estado pendiente con MÁS de 1 día vencidos (fecha_max_respuesta < yesterday)
            const isExpired = estado === 'pendiente' && fecha < yesterday;

            if (isExpired) {
              expiredDocuments.push({
                ...item,
                id: item.id,
                numero_documento: item.numero_documento,
                reasignado_a: item.reasignado_a || 'Sin asignar',
                fecha_max_respuesta: item.fecha_max_respuesta,
                estado: item.estado,
                usuario_id: item.usuario_id
              });
              console.log('Found expired:', item.numero_documento, 'Fecha max:', item.fecha_max_respuesta, 'Estado:', item.estado, 'Días expirados:', this.getDiasExpirados(item.fecha_max_respuesta));
            }
          }
        });

        // Ordenar por días más expirados primero
        this.expiredByUser = expiredDocuments.sort((a, b) => {
          const diasA = this.getDiasExpirados(a.fecha_max_respuesta);
          const diasB = this.getDiasExpirados(b.fecha_max_respuesta);
          return diasB - diasA;
        });

        console.log('Expired documents (pendiente, > 1 día):', this.expiredByUser);
      } catch (err) {
        console.error('Error loading expired documents:', err);
      }
    },
    getDiasExpirados(fecha) {
      if (!fecha) return 0;
      const fechaMax = new Date(fecha);
      const now = new Date();
      const diffTime = now.getTime() - fechaMax.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
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
          // Solo documentos en estado pendiente a 1 día de expirar (entre hoy y mañana inclusivo)
          const isInRange = estado === 'pendiente' && fecha >= now && fecha <= tomorrow;
          if (isInRange) {
            console.log('Upcoming:', item.numero_documento, 'Fecha:', item.fecha_max_respuesta, 'Estado:', item.estado);
          }
          return isInRange;
        }).sort((a, b) => new Date(a.fecha_max_respuesta) - new Date(b.fecha_max_respuesta));
        console.log('Upcoming expiry items (pendiente, 1 día):', this.upcomingExpiry.length);
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

      // Construir datos dinámicamente desde los documentos
      const conteoImportancia = {};
      (this.reasignadosPorImportancia || []).forEach(item => {
        if (item.importancia) {
          conteoImportancia[item.importancia] = (conteoImportancia[item.importancia] || 0) + (item.pendientes || 0);
        }
      });

      // Si no hay datos del endpoint, usar datos vacíos pero mostrar el gráfico
      const importancias = Object.keys(conteoImportancia).length > 0 ? Object.keys(conteoImportancia) : [];
      const valores = Object.values(conteoImportancia);

      const colorMap = {
        'Urgente': '#dc3545',
        'Alta': '#fd7e14',
        'Media': '#ffc107',
        'Normal': '#0dcaf0',
        'Baja': '#198754',
        'No especificada': '#6c757d'
      };

      const backgroundColor = importancias.map(imp => colorMap[imp] || '#6c757d');

      console.log('Datos gráfico importancia:', importancias, valores);

      this.charts.reasignadosPorImportancia = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: importancias,
          datasets: [{
            data: valores,
            backgroundColor: backgroundColor,
            borderColor: '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                padding: 20,
                font: { size: 12 }
              }
            }
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
    },
    async cargarEstados() {
      try {
        const response = await api.get('/catalogos/estados-reasignados');
        this.estados = response.data || [];
        console.log('✓ Estados cargados:', this.estados.length);
      } catch (error) {
        console.error('Error cargando estados:', error);
        this.estados = [];
      }
    },
    abrirModalDocumento(documento) {
      this.documentoSeleccionado = { ...documento };
      const modal = new window.bootstrap.Modal(document.getElementById('modalDetalleDocumento'));
      modal.show();
    },
    formatearFecha(fecha) {
      if (!fecha) return null;
      const date = new Date(fecha);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    async guardarCambios() {
      if (!this.documentoSeleccionado) return;
      this.isSaving = true;
      try {
        console.log('Guardando cambios para documento:', this.documentoSeleccionado.id);
        console.log('Nuevo estado:', this.documentoSeleccionado.estado);

        const datosActualizados = {
          numero_documento: this.documentoSeleccionado.numero_documento,
          tipo_documento: this.documentoSeleccionado.tipo_documento || null,
          importancia: this.documentoSeleccionado.importancia || null,
          numero_tramite: this.documentoSeleccionado.numero_tramite || null,
          fecha_documento: this.formatearFecha(this.documentoSeleccionado.fecha_documento),
          fecha_reasignacion: this.formatearFecha(this.documentoSeleccionado.fecha_reasignacion),
          fecha_max_respuesta: this.formatearFecha(this.documentoSeleccionado.fecha_max_respuesta),
          reasignado_a: this.documentoSeleccionado.reasignado_a,
          usuario_id: this.documentoSeleccionado.usuario_id,
          comentario: this.documentoSeleccionado.comentario || null,
          respuesta: this.documentoSeleccionado.respuesta || null,
          remitente: this.documentoSeleccionado.remitente || null,
          destinatario: this.documentoSeleccionado.destinatario || null,
          asunto: this.documentoSeleccionado.asunto || null,
          estado: this.documentoSeleccionado.estado,
          extra: this.documentoSeleccionado.extra || null
        };

        console.log('Datos a guardar:', datosActualizados);
        await api.put(`/reasignados/${this.documentoSeleccionado.id}`, datosActualizados);
        console.log('✓ Documento actualizado');

        // Cerrar modal
        const modal = window.bootstrap.Modal.getInstance(document.getElementById('modalDetalleDocumento'));
        if (modal) modal.hide();

        // Mostrar confirmación sin bloquear la recarga
        console.log('🔄 Recargando datos del dashboard...');

        // Recargar datos y esperar a que complete
        await this.loadData();
        console.log('✓ Dashboard actualizado correctamente');
      } catch (err) {
        console.error('Error guardando cambios:', err);
        console.error('Respuesta del servidor:', err.response?.data);
        alert('❌ Error al guardar: ' + (err.response?.data?.message || err.response?.data?.error || err.message));
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

@media (min-width: 992px) {
  .col-lg-2-4 {
    flex: 0 0 20%;
    max-width: 20%;
  }
}

.expired-table-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
}

.expired-table-container table {
  margin-bottom: 0;
}

.expired-table-container thead {
  position: sticky;
  top: 0;
  background-color: #f8f9fa;
  z-index: 10;
}

.expired-table-container thead th {
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  padding: 0.75rem;
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
