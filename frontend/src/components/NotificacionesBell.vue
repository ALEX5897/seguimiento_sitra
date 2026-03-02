<template>
  <div class="notificaciones-bell">
    <!-- Campana con contador -->
    <button 
      class="btn btn-light position-relative"
      @click="toggleNotificaciones"
      title="Notificaciones"
    >
      <i class="bi bi-bell fs-5"></i>
      <span v-if="contadorSinLeer > 0" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
        {{ contadorSinLeer > 99 ? '99+' : contadorSinLeer }}
      </span>
    </button>

    <!-- Panel de notificaciones -->
    <div v-if="mostrarPanel" class="notificaciones-panel">
      <div class="panel-header">
        <h6 class="mb-0"><i class="bi bi-bell"></i> Notificaciones</h6>
        <div class="header-actions">
          <button 
            v-if="notificaciones.length > 0"
            class="btn btn-link btn-sm p-0"
            @click="marcarTodasLeidas"
            title="Marcar todas como leídas"
          >
            <i class="bi bi-check-all"></i>
          </button>
          <button 
            class="btn-close"
            @click="mostrarPanel = false"
          ></button>
        </div>
      </div>

      <div class="panel-content">
        <!-- Sin notificaciones -->
        <div v-if="notificaciones.length === 0" class="text-center py-4 text-muted">
          <i class="bi bi-bell-slash fs-4 mb-2"></i>
          <p class="mb-0">No hay notificaciones</p>
        </div>

        <!-- Lista de notificaciones -->
        <div v-else class="notificaciones-lista">
          <div 
            v-for="notif in notificaciones" 
            :key="notif.id"
            class="notificacion-item"
            :class="{ 'no-leida': !notif.leida }"
          >
            <!-- Ícono según tipo -->
            <div class="notif-icon" :class="getIconoClase(notif.tipo_notificacion)">
              {{ getIcono(notif.tipo_notificacion) }}
            </div>

            <!-- Contenido -->
            <div class="notif-content" @click="abrirNotificacion(notif)">
              <div class="notif-titulo">
                {{ notif.titulo }}
              </div>
              <div class="notif-mensaje">
                {{ notif.mensaje }}
              </div>
              <div class="notif-fecha">
                {{ formatoFecha(notif.fecha_creacion) }}
              </div>
            </div>

            <!-- Acciones -->
            <div class="notif-actions">
              <button 
                v-if="!notif.leida"
                class="btn btn-sm btn-light"
                @click="marcarComoLeida(notif.id)"
                title="Marcar como leída"
              >
                <i class="bi bi-check-circle"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <button 
          class="btn btn-sm btn-outline-secondary w-100"
          @click="irANotificaciones"
        >
          Ver todas las notificaciones
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api'

export default {
  name: 'NotificacionesBell',
  data() {
    return {
      mostrarPanel: false,
      notificaciones: [],
      contadorSinLeer: 0,
      intervalo: null
    }
  },
  mounted() {
    this.cargarNotificaciones();
    // Auto-actualizar notificaciones cada 10 segundos
    this.intervalo = setInterval(() => {
      this.cargarNotificaciones();
    }, 10000);

    // Cerrar panel al hacer click fuera
    document.addEventListener('click', this.cerrarPanelFueraDe);
  },
  beforeUnmount() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
    document.removeEventListener('click', this.cerrarPanelFueraDe);
  },
  methods: {
    async cargarNotificaciones() {
      try {
        const response = await api.get('/notificaciones?sin_leer=true');
        this.notificaciones = response.data || [];
        
        // Contar sin leer
        this.contadorSinLeer = this.notificaciones.filter(n => !n.leida).length;
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
      }
    },

    toggleNotificaciones() {
      this.mostrarPanel = !this.mostrarPanel;
      if (this.mostrarPanel) {
        this.cargarNotificaciones();
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
      try {
        for (const notif of this.notificaciones.filter(n => !n.leida)) {
          await api.put(`/notificaciones/${notif.id}/leer`);
        }
        await this.cargarNotificaciones();
      } catch (error) {
        console.error('Error marcando todas como leídas:', error);
      }
    },

    abrirNotificacion(notif) {
      // Marcar como leída
      if (!notif.leida) {
        this.marcarComoLeida(notif.id);
      }

      // Navegar a la URL de la notificación
      if (notif.urlAccion) {
        this.$router.push(notif.urlAccion);
        this.mostrarPanel = false;
      }
    },

    async irANotificaciones() {
      this.$router.push('/notificaciones');
      this.mostrarPanel = false;
    },

    cerrarPanelFueraDe(event) {
      const elem = document.querySelector('.notificaciones-bell');
      if (elem && !elem.contains(event.target)) {
        this.mostrarPanel = false;
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
        'comentario_nuevo': 'bg-info',
        'respuesta_recibida': 'bg-success',
        'documento_modificado': 'bg-warning',
        'vencimiento_proximo': 'bg-warning',
        'vencimiento_expirado': 'bg-danger'
      };
      return clases[tipo] || 'bg-secondary';
    },

    formatoFecha(fecha) {
      if (!fecha) return '';
      const date = new Date(fecha);
      const ahora = new Date();
      const diff = ahora - date;
      
      const minutos = Math.floor(diff / 60000);
      const horas = Math.floor(diff / 3600000);
      const dias = Math.floor(diff / 86400000);

      if (minutos < 1) return 'Hace unos segundos';
      if (minutos < 60) return `Hace ${minutos}m`;
      if (horas < 24) return `Hace ${horas}h`;
      if (dias < 7) return `Hace ${dias}d`;

      const opciones = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return date.toLocaleDateString('es-ES', opciones);
    }
  }
}
</script>

<style scoped>
.notificaciones-bell {
  position: relative;
}

.notificaciones-panel {
  position: absolute;
  top: 100%;
  right: -10px;
  width: 400px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  max-height: 500px;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
}

.panel-header h6 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.notificaciones-lista {
  display: flex;
  flex-direction: column;
}

.notificacion-item {
  display: flex;
  padding: 12px 12px;
  border-bottom: 1px solid #f0f0f0;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: #fff;
}

.notificacion-item:hover {
  background-color: #f8f9fa;
}

.notificacion-item.no-leida {
  background-color: #f0f7ff;
  font-weight: 500;
}

.notif-icon {
  font-size: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-titulo {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-mensaje {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-fecha {
  font-size: 12px;
  color: #999;
}

.notif-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.panel-footer {
  padding: 8px 12px;
  border-top: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

@media (max-width: 576px) {
  .notificaciones-panel {
    width: 320px;
    right: -20px;
  }
}
</style>
