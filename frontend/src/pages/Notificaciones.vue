<template>
  <div class="container-fluid p-4">
    <!-- Encabezado -->
    <div class="mb-5">
      <h1 class="page-title">🔔 Notificaciones del Sistema</h1>
      <p class="text-muted">Historial de notificaciones y cambios en documentos reasignados</p>
    </div>

    <!-- Acciones -->
    <div class="row mb-4">
      <div class="col-auto">
        <button 
          v-if="notificacionesSinLeer.length > 0"
          @click="marcarTodasLeidas"
          class="btn btn-primary"
        >
          ✅ Marcar todas como leídas
        </button>
      </div>
      <div class="col-auto">
        <select v-model="filtroTipo" class="form-select form-select-sm">
          <option value="">Todos los tipos</option>
          <option value="comentario_nuevo">💬 Comentario nuevo</option>
          <option value="respuesta_recibida">↩️ Respuesta recibida</option>
          <option value="documento_modificado">📝 Documento modificado</option>
          <option value="vencimiento_proximo">⏰ Vencimiento próximo</option>
          <option value="vencimiento_expirado">🚨 Vencimiento expirado</option>
        </select>
      </div>
    </div>

    <!-- Tabla de notificaciones -->
    <div class="card">
      <div class="card-body">
        <div v-if="notificacionesFiltradas.length === 0" class="alert alert-info text-center py-4">
          <i class="bi bi-inbox fs-4 mb-2"></i>
          <p class="mb-0">No hay notificaciones que mostrar</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th style="width: 50px;"></th>
                <th>Tipo</th>
                <th>Título</th>
                <th>Mensaje</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="notif in notificacionesFiltradas" 
                :key="notif.id"
                :class="{ 'table-light': notif.leida, 'fw-bold': !notif.leida }"
              >
                <td class="text-center">
                  <span :class="getIconoClase(notif.tipo_notificacion)">
                    {{ getIcono(notif.tipo_notificacion) }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="getBadgeClase(notif.tipo_notificacion)">
                    {{ getTipoTexto(notif.tipo_notificacion) }}
                  </span>
                </td>
                <td>{{ notif.titulo }}</td>
                <td>
                  <small class="text-muted">{{ notif.mensaje.substring(0, 50) }}...</small>
                </td>
                <td class="small">{{ formatoFecha(notif.fecha_creacion) }}</td>
                <td>
                  <span v-if="notif.leida" class="badge bg-success">Leída</span>
                  <span v-else class="badge bg-warning">Sin leer</span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button 
                      v-if="!notif.leida"
                      @click="marcarComoLeida(notif.id)"
                      class="btn btn-sm btn-outline-primary"
                      title="Marcar como leída"
                    >
                      <i class="bi bi-check-circle"></i>
                    </button>
                    <button 
                      @click="abrirNotificacion(notif)"
                      class="btn btn-sm btn-outline-secondary"
                      title="Abrir documento"
                    >
                      <i class="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Paginación -->
    <nav v-if="totalPaginas > 1" class="mt-4" aria-label="Paginación">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: paginaActual === 1 }">
          <button class="page-link" @click="paginaActual = 1">Primera</button>
        </li>
        <li class="page-item" :class="{ disabled: paginaActual === 1 }">
          <button class="page-link" @click="paginaActual--">Anterior</button>
        </li>
        <li v-for="p in paginasVisibles" :key="p" class="page-item" :class="{ active: p === paginaActual }">
          <button class="page-link" @click="paginaActual = p">{{ p }}</button>
        </li>
        <li class="page-item" :class="{ disabled: paginaActual === totalPaginas }">
          <button class="page-link" @click="paginaActual++">Siguiente</button>
        </li>
        <li class="page-item" :class="{ disabled: paginaActual === totalPaginas }">
          <button class="page-link" @click="paginaActual = totalPaginas">Última</button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
import api from '../api'
import { showToast, confirmAction } from '../utils/feedback'

export default {
  name: 'NotificacionesPage',
  data() {
    return {
      notificaciones: [],
      filtroTipo: '',
      paginaActual: 1,
      porPagina: 20,
      cargando: true
    }
  },
  computed: {
    notificacionesSinLeer() {
      return this.notificaciones.filter(n => !n.leida);
    },
    notificacionesFiltradas() {
      let filtradas = this.notificaciones;

      if (this.filtroTipo) {
        filtradas = filtradas.filter(n => n.tipo_notificacion === this.filtroTipo);
      }

      return filtradas;
    },
    totalPaginas() {
      return Math.ceil(this.notificacionesFiltradas.length / this.porPagina);
    },
    paginasVisibles() {
      const total = this.totalPaginas;
      const actual = this.paginaActual;
      const rango = 5;
      
      let inicio = Math.max(1, actual - Math.floor(rango / 2));
      let fin = Math.min(total, inicio + rango - 1);
      
      if (fin - inicio < rango - 1) {
        inicio = Math.max(1, fin - rango + 1);
      }
      
      const paginas = [];
      for (let i = inicio; i <= fin; i++) {
        paginas.push(i);
      }
      return paginas;
    },
    notificacionesMostradas() {
      const inicio = (this.paginaActual - 1) * this.porPagina;
      const fin = inicio + this.porPagina;
      return this.notificacionesFiltradas.slice(inicio, fin);
    }
  },
  watch: {
    filtroTipo() {
      this.paginaActual = 1;
    },
    notificacionesFiltradas() {
      this.paginaActual = 1;
    }
  },
  mounted() {
    this.cargarNotificaciones();
    // Auto-actualizar cada 15 segundos
    this.intervalo = setInterval(() => {
      this.cargarNotificaciones();
    }, 15000);
  },
  beforeUnmount() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  },
  methods: {
    async cargarNotificaciones() {
      try {
        this.cargando = true;
        const response = await api.get('/notificaciones');
        this.notificaciones = response.data || [];
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
      } finally {
        this.cargando = false;
      }
    },

    async marcarComoLeida(notificacionId) {
      try {
        await api.put(`/notificaciones/${notificacionId}/leer`);
        await this.cargarNotificaciones();
      } catch (error) {
        console.error('Error marcando notificación como leída:', error);
      }
    },

    async marcarTodasLeidas() {
      const confirmado = await confirmAction('¿Deseas marcar todas las notificaciones como leídas?', 'Marcar notificaciones');
      if (!confirmado) {
        return;
      }

      try {
        for (const notif of this.notificacionesSinLeer) {
          await api.put(`/notificaciones/${notif.id}/leer`);
        }
        await this.cargarNotificaciones();
      } catch (error) {
        console.error('Error marcando todas como leídas:', error);
        showToast('Error al marcar notificaciones', 'error');
      }
    },

    abrirNotificacion(notif) {
      if (!notif.leida) {
        this.marcarComoLeida(notif.id);
      }

      if (notif.urlAccion) {
        this.$router.push(notif.urlAccion);
      }
    },

    getIcono(tipo) {
      const iconos = {
        'comentario_nuevo': '💬',
        'respuesta_recibida': '↩️',
        'documento_modificado': '📝',
        'vencimiento_proximo': '⏰',
        'vencimiento_expirado': '🚨'
      };
      return iconos[tipo] || '📬';
    },

    getIconoClase(tipo) {
      const clases = {
        'comentario_nuevo': 'text-info',
        'respuesta_recibida': 'text-success',
        'documento_modificado': 'text-warning',
        'vencimiento_proximo': 'text-warning',
        'vencimiento_expirado': 'text-danger'
      };
      return clases[tipo] || 'text-secondary';
    },

    getBadgeClase(tipo) {
      const clases = {
        'comentario_nuevo': 'bg-info',
        'respuesta_recibida': 'bg-success',
        'documento_modificado': 'bg-warning text-dark',
        'vencimiento_proximo': 'bg-warning text-dark',
        'vencimiento_expirado': 'bg-danger'
      };
      return clases[tipo] || 'bg-secondary';
    },

    getTipoTexto(tipo) {
      const textos = {
        'comentario_nuevo': 'Comentario Nuevo',
        'respuesta_recibida': 'Respuesta Recibida',
        'documento_modificado': 'Documento Modificado',
        'vencimiento_proximo': 'Próximo a Vencer',
        'vencimiento_expirado': 'Expirado'
      };
      return textos[tipo] || tipo;
    },

    formatoFecha(fecha) {
      if (!fecha) return '';
      const date = new Date(fecha);
      const opciones = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return date.toLocaleDateString('es-ES', opciones);
    }
  }
}
</script>

<style scoped>
.page-title {
  color: #333;
  font-weight: 600;
}

.table-light {
  opacity: 0.7;
}

.btn-group-sm {
  gap: 4px;
}
</style>
