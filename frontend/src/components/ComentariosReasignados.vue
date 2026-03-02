<template>
  <div class="comentarios-container">
    <!-- Título y contador -->
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h5 class="mb-0">
        <i class="bi bi-chat-dots"></i> Comentarios 
        <span class="badge bg-secondary">{{ comentarios.length }}</span>
      </h5>
      <button 
        v-if="puedeAgregar" 
        class="btn btn-sm btn-outline-primary"
        @click="toggleFormulario"
      >
        <i class="bi bi-plus-circle"></i> {{ mostrarFormulario ? 'Cancelar' : 'Agregar comentario' }}
      </button>
    </div>

    <!-- Formulario para agregar comentario -->
    <div v-if="mostrarFormulario && puedeAgregar" class="card mb-3 border-primary">
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label">Tu comentario</label>
          <textarea 
            v-model="nuevoComentario.contenido"
            class="form-control"
            rows="3"
            placeholder="Escribe tu comentario aquí..."
            :disabled="guardando"
          ></textarea>
          <small class="text-muted">{{ caracteresRestantes }} caracteres permitidos</small>
        </div>
        
        <div class="d-flex gap-2">
          <button 
            @click="guardarComentario"
            class="btn btn-primary btn-sm"
            :disabled="!nuevoComentario.contenido.trim() || guardando"
          >
            <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
            {{ guardando ? 'Guardando...' : 'Enviar comentario' }}
          </button>
          <button 
            @click="toggleFormulario"
            class="btn btn-secondary btn-sm"
            :disabled="guardando"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Lista de comentarios -->
    <div v-if="comentarios.length > 0" class="comentarios-lista">
      <div 
        v-for="comentario in comentarios" 
        :key="comentario.id"
        class="comentario-item mb-3 p-3 rounded border"
        :class="getClaseComentario(comentario)"
      >
        <!-- Encabezado del comentario -->
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge" :class="getBadgeClase(comentario)">
                {{ getBadgeTexto(comentario) }}
              </span>
              <strong>{{ comentario.nombre_usuario }}</strong>
              <small class="text-muted">({{ comentario.correo_usuario }})</small>
            </div>
            <small class="text-muted d-block">
              <i class="bi bi-calendar-event"></i> {{ formatoFecha(comentario.fecha_hora) }}
              <span v-if="comentario.actualizado_en !== comentario.fecha_hora" class="ms-2">
                (editado)
              </span>
            </small>
          </div>
          
          <!-- Acciones -->
          <div class="btn-group-vertical btn-group-sm" v-if="puedeEliminar(comentario)">
            <button 
              @click="eliminarComentario(comentario.id)"
              class="btn btn-sm btn-danger"
              title="Eliminar comentario"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <!-- Contenido del comentario -->
        <div class="comentario-contenido mt-2 p-2 bg-light rounded">
          {{ comentario.contenido }}
        </div>

        <!-- Estado de lectura -->
        <div v-if="!comentario.leido" class="mt-2">
          <button 
            @click="marcarLeido(comentario.id)"
            class="btn btn-link btn-sm p-0"
          >
            <i class="bi bi-check2-circle"></i> Marcar como leído
          </button>
        </div>
      </div>
    </div>

    <!-- Mensaje vacío -->
    <div v-else class="alert alert-info text-center py-4">
      <i class="bi bi-chat-dots fs-4 mb-2"></i>
      <p class="mb-0">No hay comentarios aún. ¡Sé el primero en comentar!</p>
    </div>
  </div>
</template>

<script>
import api from '../api'
import { showToast, confirmAction } from '../utils/feedback'

export default {
  name: 'ComentariosReasignados',
  props: {
    reasignadoId: {
      type: [String, Number],
      required: true
    },
    usuarioActual: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['actualizar'],
  data() {
    return {
      comentarios: [],
      nuevoComentario: {
        contenido: '',
        tipo_comentario: 'comentario'
      },
      mostrarFormulario: false,
      guardando: false,
      cargando: true,
      errorMsg: null,
      maxCaracteres: 5000
    }
  },
  computed: {
    caracteresRestantes() {
      return this.maxCaracteres - (this.nuevoComentario.contenido.length || 0);
    },
    esSoloLectura() {
      const rol = (this.usuarioActual?.rol || '').toLowerCase();
      return rol === 'solo_vista' || rol === 'solo lectura' || rol === 'lectura';
    },
    puedeAgregar() {
      // Usuarios de solo lectura SÍ pueden agregar comentarios, solo no pueden eliminarlos
      return this.usuarioActual && this.usuarioActual.correo;
    }
  },
  watch: {
    reasignadoId(newId, oldId) {
      if (!newId || newId === oldId) {
        return;
      }
      // Reset UI state when switching documents
      this.nuevoComentario.contenido = '';
      this.mostrarFormulario = false;
      this.cargarComentarios();
    }
  },
  mounted() {
    this.cargarComentarios();
    // Auto-actualizar cada 30 segundos
    this.intervalo = setInterval(() => {
      this.cargarComentarios();
    }, 30000);
  },
  beforeUnmount() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  },
  methods: {
    async cargarComentarios() {
      try {
        this.cargando = true;
        const response = await api.get(`/reasignados/${this.reasignadoId}/comentarios`);
        this.comentarios = response.data || [];
        this.errorMsg = null;
      } catch (error) {
        console.error('Error cargando comentarios:', error);
        this.errorMsg = 'Error al cargar comentarios';
      } finally {
        this.cargando = false;
      }
    },

    async guardarComentario() {
      // Usuarios de solo lectura pueden agregar comentarios
      if (!this.nuevoComentario.contenido.trim()) {
        showToast('Por favor escribe un comentario', 'warning');
        return;
      }

      if (this.nuevoComentario.contenido.length > this.maxCaracteres) {
        showToast(`El comentario no debe superar ${this.maxCaracteres} caracteres`, 'warning');
        return;
      }

      this.guardando = true;
      try {
        const datos = {
          contenido: this.nuevoComentario.contenido.trim(),
          tipo_comentario: this.nuevoComentario.tipo_comentario
        };

        await api.post(`/reasignados/${this.reasignadoId}/comentarios`, datos);
        
        // Limpiar formulario y recargar
        this.nuevoComentario.contenido = '';
        this.mostrarFormulario = false;
        await this.cargarComentarios();
        showToast('Comentario guardado correctamente', 'success');
        
        this.$emit('actualizar');
      } catch (error) {
        console.error('Error guardando comentario:', error);
        showToast('Error al guardar comentario: ' + (error.response?.data?.error || error.message), 'error');
      } finally {
        this.guardando = false;
      }
    },

    async marcarLeido(comentarioId) {
      try {
        await api.put(`/reasignados/${this.reasignadoId}/comentarios/${comentarioId}/leer`);
        await this.cargarComentarios();
      } catch (error) {
        console.error('Error marcando como leído:', error);
      }
    },

    async eliminarComentario(comentarioId) {
      if (this.esSoloLectura) {
        showToast('No tienes permisos para eliminar comentarios', 'warning');
        return;
      }
      const confirmado = await confirmAction('¿Estás seguro de que quieres eliminar este comentario?', 'Eliminar comentario');
      if (!confirmado) {
        return;
      }

      try {
        await api.delete(`/reasignados/${this.reasignadoId}/comentarios/${comentarioId}`);
        await this.cargarComentarios();
        showToast('Comentario eliminado correctamente', 'success');
      } catch (error) {
        console.error('Error eliminando comentario:', error);
        showToast('Error al eliminar comentario', 'error');
      }
    },

    puedeEliminar(comentario) {
      if (this.esSoloLectura) return false;
      // Admin y secretaria pueden eliminar cualquier comentario
      // Los usuarios solo pueden eliminar sus propios comentarios
      const esAdmin = this.usuarioActual?.rol === 'admin';
      const esSecretaria = this.usuarioActual?.rol === 'secretaria';
      const esDelUsuario = comentario.correo_usuario === this.usuarioActual?.correo;
      
      return esAdmin || esSecretaria || esDelUsuario;
    },

    getClaseComentario(comentario) {
      const clase = {
        border: true,
        'border-primary': comentario.tipo_usuario === 'secretaria',
        'border-success': comentario.tipo_usuario === 'usuario_asignado',
        'border-info': comentario.tipo_usuario === 'admin'
      };
      
      if (!comentario.leido) {
        clase['bg-light'] = true;
      }
      
      return clase;
    },

    getBadgeClase(comentario) {
      const clases = {
        'bg-primary': comentario.tipo_usuario === 'secretaria',
        'bg-success': comentario.tipo_usuario === 'usuario_asignado',
        'bg-info': comentario.tipo_usuario === 'admin'
      };
      return clases;
    },

    getBadgeTexto(comentario) {
      const textos = {
        'secretaria': '🏢 Secretaría',
        'usuario_asignado': '👤 Usuario',
        'admin': '🔐 Admin'
      };
      return textos[comentario.tipo_usuario] || 'Usuario';
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
    },

    toggleFormulario() {
      this.mostrarFormulario = !this.mostrarFormulario;
      if (!this.mostrarFormulario) {
        this.nuevoComentario.contenido = '';
      }
    }
  }
}
</script>

<style scoped>
.comentarios-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}

.comentario-item {
  background-color: white;
  transition: all 0.2s ease;
}

.comentario-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.comentario-contenido {
  white-space: pre-wrap;
  line-height: 1.5;
  color: #333;
}

.badge {
  font-size: 0.85rem;
}

h5 {
  color: #333;
  font-weight: 600;
}
</style>
