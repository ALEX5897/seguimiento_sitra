<template>
  <div class="plantilla-editor">
    <div class="row">
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">✏️ Editar Plantilla: {{ titulo }}</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="guardar">
              <div class="mb-3">
                <label for="asunto" class="form-label"><strong>Asunto del correo</strong></label>
                <input
                  v-model="plantilla.asunto"
                  type="text"
                  class="form-control"
                  id="asunto"
                  required
                  placeholder="Ej: SITRA: Nuevo documento asignado"
                >
              </div>

              <div class="mb-3">
                <label for="cuerpo" class="form-label"><strong>Cuerpo HTML</strong></label>
                <textarea
                  v-model="plantilla.cuerpo_html"
                  class="form-control"
                  id="cuerpo"
                  rows="12"
                  required
                  style="font-family: monospace; font-size: 0.9rem;"
                ></textarea>
              </div>

              <div class="mb-3">
                <p class="small text-muted mb-2"><strong>Variables disponibles:</strong></p>
                <div class="bg-light p-2 rounded small" style="max-height: 200px; overflow-y: auto;">
                  <p v-for="(desc, var_name) in variablesDisponibles" :key="var_name" class="mb-1">
                    <code>{{ var_name }}</code> - {{ desc }}
                  </p>
                </div>
              </div>

              <div class="d-grid gap-2">
                <button type="submit" class="btn btn-primary" :disabled="guardando">
                  <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
                  💾 Guardar Plantilla
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

      <div class="col-lg-6">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">👁️ Vista Previa</h5>
          </div>
          <div class="card-body p-0">
            <div class="preview-area">
              <div v-html="previewHTML" class="preview-content"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';
import { showToast } from '../utils/feedback';

export default {
  name: 'PlantillaEditor',
  props: {
    tipo: {
      type: String,
      required: true,
      validator: (v) => ['asignado', 'tarde'].includes(v)
    },
    titulo: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      plantilla: {
        asunto: '',
        cuerpo_html: ''
      },
      guardando: false,
      mensajeExito: '',
      mensajeError: '',
      variablesDisponibles: {}
    };
  },
  computed: {
    previewHTML() {
      const datosEjemplo = this.obtenerDatosEjemplo();
      let html = this.plantilla.cuerpo_html;

      Object.entries(datosEjemplo).forEach(([variable, valor]) => {
        const regex = new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        html = html.replace(regex, valor);
      });

      return html;
    }
  },
  watch: {
    tipo() {
      this.cargarPlantilla();
    }
  },
  mounted() {
    this.inicializar();
  },
  methods: {
    inicializar() {
      if (this.tipo === 'asignado') {
        this.variablesDisponibles = {
          '{{nombre}}': 'Nombre del usuario',
          '{{numero_documento}}': 'Número del documento',
          '{{fecha_max_respuesta}}': 'Fecha límite de respuesta',
          '{{remitente}}': 'Remitente del documento',
          '{{asunto}}': 'Asunto del documento',
          '{{destinatario}}': 'Destinatario del documento',
          '{{tabla_documentos}}': 'Tabla HTML con los documentos'
        };
      } else if (this.tipo === 'tarde') {
        this.variablesDisponibles = {
          '{{nombre}}': 'Nombre del usuario',
          '{{cantidad}}': 'Cantidad de documentos con retraso',
          '{{tabla_documentos}}': 'Tabla HTML con los documentos retrasados'
        };
      }
      this.cargarPlantilla();
    },
    async cargarPlantilla() {
      try {
        const response = await api.get(`/admin/notificaciones/plantillas/${this.tipo}`);
        this.plantilla = {
          asunto: response.data.asunto,
          cuerpo_html: response.data.cuerpo_html
        };
      } catch (error) {
        this.mensajeError = 'Error al cargar plantilla: ' + (error.response?.data?.error || error.message);
      }
    },
    async guardar() {
      if (!this.plantilla.asunto.trim()) {
        this.mensajeError = 'El asunto no puede estar vacío';
        return;
      }

      if (!this.plantilla.cuerpo_html.trim()) {
        this.mensajeError = 'El cuerpo HTML no puede estar vacío';
        return;
      }

      this.guardando = true;
      this.mensajeExito = '';
      this.mensajeError = '';

      try {
        await api.put(`/admin/notificaciones/plantillas/${this.tipo}`, {
          asunto: this.plantilla.asunto,
          cuerpo_html: this.plantilla.cuerpo_html
        });

        this.mensajeExito = 'Plantilla guardada correctamente';
        showToast(`Plantilla "${this.titulo}" guardada`, 'success');
        this.$emit('guardar');
      } catch (error) {
        this.mensajeError = 'Error al guardar: ' + (error.response?.data?.error || error.message);
        showToast(this.mensajeError, 'error');
      } finally {
        this.guardando = false;
      }
    },
    obtenerDatosEjemplo() {
      const tabla = `
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 8px; border: 1px solid #ddd;">Documento</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Trámite</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Fecha Máxima</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">DOC-2026-001</td>
              <td style="padding: 8px; border: 1px solid #ddd;">TR-001</td>
              <td style="padding: 8px; border: 1px solid #ddd;">28/04/2026</td>
            </tr>
          </tbody>
        </table>
      `;

      return {
        '{{nombre}}': 'Juan Pérez',
        '{{numero_documento}}': 'DOC-2026-001',
        '{{fecha_max_respuesta}}': '28/04/2026',
        '{{remitente}}': 'Dirección General',
        '{{asunto}}': 'Solicitud de información',
        '{{destinatario}}': 'Departamento de Recursos',
        '{{cantidad}}': '3',
        '{{tabla_documentos}}': tabla
      };
    }
  }
};
</script>

<style scoped>
.plantilla-editor {
  padding: 20px 0;
}

.preview-area {
  min-height: 400px;
  overflow-y: auto;
  background: #f9f9f9;
}

.preview-content {
  padding: 20px;
}

.preview-content :deep(*) {
  background: white;
  padding: 15px;
  border-radius: 4px;
}

.preview-content :deep(table) {
  margin: 10px 0 !important;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  padding: 8px !important;
  border: 1px solid #ddd !important;
}

.preview-content :deep(th) {
  background: #f0f0f0 !important;
}
</style>
