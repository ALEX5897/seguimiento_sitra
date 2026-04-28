<template>
  <div class="admin-notificaciones">
    <h1 class="mb-4">⚙️ Configuración de Notificaciones</h1>

    <ul class="nav nav-tabs mb-4" role="tablist">
      <li class="nav-item">
        <a class="nav-link active" data-bs-toggle="tab" href="#config-general" role="tab">
          <i class="bi bi-gear"></i> Configuración General
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-bs-toggle="tab" href="#plantilla-asignados" role="tab">
          <i class="bi bi-file-earmark"></i> Documentos Asignados
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" data-bs-toggle="tab" href="#plantilla-tarde" role="tab">
          <i class="bi bi-exclamation-triangle"></i> Documentos Tarde
        </a>
      </li>
    </ul>

    <div class="tab-content">
      <!-- Tab 1: Configuración General -->
      <div class="tab-pane fade show active" id="config-general" role="tabpanel">
        <div class="card">
          <div class="card-body">
            <form @submit.prevent="guardarConfiguracion">
              <div class="mb-4">
                <div class="form-check form-switch">
                  <input
                    v-model="config.activo"
                    class="form-check-input"
                    type="checkbox"
                    id="activoSwitch"
                  >
                  <label class="form-check-label" for="activoSwitch">
                    <strong>Activar notificaciones por correo</strong>
                    <p class="text-muted small mt-1">Si está desactivado, no se enviarán notificaciones por correo</p>
                  </label>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="horaEnvio" class="form-label">⏰ Hora de envío diario</label>
                    <input
                      v-model="config.hora_envio"
                      type="time"
                      class="form-control"
                      id="horaEnvio"
                      required
                    >
                    <small class="text-muted d-block mt-2">
                      Nota: Los cambios de hora requieren reiniciar el servidor para que se apliquen.
                    </small>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="diasRetraso" class="form-label">📅 Días de retraso mínimo</label>
                    <input
                      v-model.number="config.dias_retraso"
                      type="number"
                      class="form-control"
                      id="diasRetraso"
                      min="0"
                      max="30"
                      required
                    >
                    <small class="text-muted d-block mt-2">
                      Documentos con retraso mayor o igual a este valor serán notificados
                    </small>
                  </div>
                </div>
              </div>

              <div class="d-flex gap-2 mt-4">
                <button type="submit" class="btn btn-primary" :disabled="guardando">
                  <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
                  Guardar Configuración
                </button>

                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  @click="probarNotificaciones"
                  :disabled="probando"
                >
                  <span v-if="probando" class="spinner-border spinner-border-sm me-2"></span>
                  🧪 Probar Ahora
                </button>
              </div>

              <div v-if="mensajeExito" class="alert alert-success mt-3 alert-dismissible fade show" role="alert">
                {{ mensajeExito }}
                <button type="button" class="btn-close" @click="mensajeExito = ''"></button>
              </div>

              <div v-if="mensajeError" class="alert alert-danger mt-3 alert-dismissible fade show" role="alert">
                {{ mensajeError }}
                <button type="button" class="btn-close" @click="mensajeError = ''"></button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Tab 2: Plantilla Documentos Asignados -->
      <div class="tab-pane fade" id="plantilla-asignados" role="tabpanel">
        <plantilla-editor
          tipo="asignado"
          titulo="Documentos Asignados"
          @guardar="guardarPlantilla"
        />
      </div>

      <!-- Tab 3: Plantilla Documentos Tarde -->
      <div class="tab-pane fade" id="plantilla-tarde" role="tabpanel">
        <plantilla-editor
          tipo="tarde"
          titulo="Documentos con Retraso"
          @guardar="guardarPlantilla"
        />
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';
import { showToast } from '../utils/feedback';
import PlantillaEditor from '../components/PlantillaEditor.vue';

export default {
  name: 'AdminNotificaciones',
  components: {
    PlantillaEditor
  },
  data() {
    return {
      config: {
        activo: true,
        hora_envio: '08:00',
        dias_retraso: 1
      },
      guardando: false,
      probando: false,
      mensajeExito: '',
      mensajeError: ''
    };
  },
  mounted() {
    this.cargarConfiguracion();
  },
  methods: {
    async cargarConfiguracion() {
      try {
        const response = await api.get('/admin/notificaciones/config');
        this.config = response.data;
      } catch (error) {
        this.mensajeError = 'Error al cargar la configuración: ' + (error.response?.data?.error || error.message);
      }
    },
    async guardarConfiguracion() {
      this.guardando = true;
      this.mensajeExito = '';
      this.mensajeError = '';

      try {
        const response = await api.put('/admin/notificaciones/config', {
          activo: this.config.activo,
          hora_envio: this.config.hora_envio,
          dias_retraso: this.config.dias_retraso
        });

        this.mensajeExito = response.data.message;
        if (response.data.nota) {
          this.mensajeExito += ' - ' + response.data.nota;
        }
        showToast('Configuración guardada correctamente', 'success');
      } catch (error) {
        this.mensajeError = 'Error al guardar: ' + (error.response?.data?.error || error.message);
        showToast(this.mensajeError, 'error');
      } finally {
        this.guardando = false;
      }
    },
    async probarNotificaciones() {
      this.probando = true;
      this.mensajeExito = '';
      this.mensajeError = '';

      try {
        const response = await api.post('/admin/notificaciones/test');
        this.mensajeExito = 'Notificaciones ejecutadas. ' + response.data.message;
        showToast('Notificaciones enviadas correctamente', 'success');
      } catch (error) {
        this.mensajeError = 'Error al enviar: ' + (error.response?.data?.error || error.message);
        showToast(this.mensajeError, 'error');
      } finally {
        this.probando = false;
      }
    },
    guardarPlantilla() {
      this.cargarConfiguracion();
    }
  }
};
</script>

<style scoped>
.admin-notificaciones {
  max-width: 1000px;
}

.nav-tabs .nav-link {
  color: #495057;
  border: none;
  border-bottom: 3px solid transparent;
}

.nav-tabs .nav-link:hover {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
  background: none;
}

.form-switch .form-check-input {
  width: 2.5em;
  height: 1.5em;
}
</style>
