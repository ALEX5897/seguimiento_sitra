<template>
  <div class="container-fluid py-4">
    <div class="row mb-4">
      <div class="col">
        <h2 class="mb-0">
          <i class="bi bi-cloud-upload"></i> Carga Masiva de Documentos
        </h2>
        <small class="text-muted">Carga datos desde archivo Excel (.xlsx)</small>
      </div>
    </div>

    <div class="row">
      <!-- Panel de carga -->
      <div class="col-lg-8 mb-4">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0"><i class="bi bi-upload"></i> Cargar Archivo</h5>
          </div>
          <div class="card-body">
            <p class="text-muted mb-4">
              Carga un archivo Excel con las siguientes hojas: Reasignados, Tareas y/o Enviados
            </p>

            <!-- Zona de carga -->
            <div
              @drop="handleDrop"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              :class="['border-2 border-dashed rounded p-5 text-center', isDragging ? 'bg-light' : '']"
              style="cursor: pointer;"
            >
              <i class="bi bi-cloud-upload text-primary" style="font-size: 3rem;"></i>
              <p class="mt-3 mb-2">
                <strong>Arrastra tu archivo aquí</strong>
              </p>
              <p class="text-muted small mb-3">o haz clic para seleccionar</p>

              <input
                type="file"
                ref="fileInput"
                @change="handleFileSelect"
                accept=".xlsx,.xls"
                style="display: none;"
              />

              <button
                @click="$refs.fileInput.click()"
                class="btn btn-primary"
                :disabled="cargando"
              >
                <i class="bi bi-folder-open"></i> Seleccionar Archivo
              </button>
            </div>

            <!-- Archivo seleccionado -->
            <div v-if="archivoSeleccionado" class="mt-4 alert alert-info">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <i class="bi bi-file-earmark-excel"></i>
                  <strong>{{ archivoSeleccionado.name }}</strong>
                  <small class="d-block text-muted">{{ formatoTamaño(archivoSeleccionado.size) }}</small>
                </div>
                <button
                  @click="limpiarArchivo"
                  class="btn btn-sm btn-outline-danger"
                >
                  <i class="bi bi-x"></i> Limpiar
                </button>
              </div>
            </div>

            <!-- Botón de carga -->
            <div v-if="archivoSeleccionado" class="mt-4">
              <button
                @click="procesarCarga"
                :disabled="cargando"
                class="btn btn-success btn-lg w-100"
              >
                <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-arrow-repeat"></i>
                {{ cargando ? 'Procesando...' : 'Procesar Carga' }}
              </button>
            </div>

            <!-- Barra de progreso -->
            <div v-if="cargando" class="mt-3">
              <div class="progress">
                <div
                  class="progress-bar progress-bar-striped progress-bar-animated"
                  style="width: 100%;"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel de información -->
      <div class="col-lg-4">
        <div class="card mb-4">
          <div class="card-header bg-info text-white">
            <h5 class="mb-0"><i class="bi bi-info-circle"></i> Información</h5>
          </div>
          <div class="card-body">
            <h6>Formato del archivo</h6>
            <p class="small text-muted mb-3">
              El archivo debe tener las siguientes hojas:
            </p>
            <ul class="small mb-4">
              <li><strong>Reasignados:</strong> Documentos reasignados</li>
              <li><strong>Tareas:</strong> Tareas pendientes</li>
              <li><strong>Enviados:</strong> Documentos enviados</li>
            </ul>

            <h6>Columnas requeridas</h6>
            <p class="small text-muted mb-3">
              Cada hoja debe contener:
            </p>
            <ul class="small">
              <li>Número Documento</li>
              <li>Tipo Documento</li>
              <li>Reasignado a / Asignado para</li>
              <li>Fecha Max. de Respuesta</li>
              <li>Estado</li>
            </ul>
          </div>
        </div>

        <div class="card">
          <div class="card-header bg-warning text-dark">
            <h5 class="mb-0"><i class="bi bi-exclamation-triangle"></i> Importante</h5>
          </div>
          <div class="card-body small">
            <p>
              ⚠️ Los usuarios deben existir en el sistema. Se validarán por nombre.
            </p>
            <p>
              ✓ Los registros duplicados se ignorarán.
            </p>
            <p class="mb-0">
              📝 Se generará un reporte con los resultados de la carga.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de resultados -->
    <ModalResultadosCarga ref="modalResultados" />
  </div>
</template>

<script>
import ModalResultadosCarga from '../components/ModalResultadosCarga.vue';

export default {
  name: 'CargaMasiva',
  components: {
    ModalResultadosCarga
  },
  data() {
    return {
      archivoSeleccionado: null,
      isDragging: false,
      cargando: false
    };
  },
  methods: {
    handleDrop(event) {
      event.preventDefault();
      this.isDragging = false;

      const files = event.dataTransfer.files;
      if (files.length > 0) {
        this.archivoSeleccionado = files[0];
      }
    },
    handleFileSelect(event) {
      const files = event.target.files;
      if (files.length > 0) {
        this.archivoSeleccionado = files[0];
      }
    },
    limpiarArchivo() {
      this.archivoSeleccionado = null;
      this.$refs.fileInput.value = '';
    },
    formatoTamaño(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    async procesarCarga() {
      if (!this.archivoSeleccionado) {
        alert('Selecciona un archivo primero');
        return;
      }

      try {
        this.cargando = true;
        const formData = new FormData();
        formData.append('file', this.archivoSeleccionado);

        const response = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const datos = await response.json();
        console.log('Resultados de carga:', datos);

        // Mostrar modal con resultados
        if (this.$refs.modalResultados) {
          this.$refs.modalResultados.mostrar(datos);
        }

        // Limpiar el archivo después de procesar
        this.limpiarArchivo();
      } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar el archivo: ' + error.message);
      } finally {
        this.cargando = false;
      }
    }
  }
};
</script>

<style scoped>
.border-2 {
  border-width: 2px !important;
}

.border-dashed {
  border-style: dashed !important;
}

/* Responsive styles */
@media (max-width: 768px) {
  h1 {
    font-size: 1.3rem;
  }

  .card {
    margin-bottom: 1rem;
  }

  .btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  .btn-lg {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  .form-control {
    font-size: 0.9rem;
  }
}

@media (max-width: 576px) {
  h1 {
    font-size: 1rem;
  }

  h3 {
    font-size: 0.95rem;
  }

  .card {
    margin-bottom: 0.75rem;
    border-radius: 6px;
  }

  .card-header {
    padding: 0.75rem;
  }

  .card-body {
    padding: 0.75rem;
  }

  .btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
    width: 100%;
  }

  .btn-lg {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .form-control {
    font-size: 16px;
    padding: 0.4rem;
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-label {
    font-size: 0.85rem;
  }

  .alert {
    padding: 0.75rem;
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }

  .table {
    font-size: 0.7rem;
  }

  .table thead th {
    padding: 0.4rem 0.15rem !important;
  }

  .table td {
    padding: 0.3rem 0.15rem !important;
  }

  .modal-dialog {
    margin: 0.5rem;
  }

  .modal-content {
    border-radius: 8px;
  }

  .border-2 {
    border-width: 1px !important;
  }

  .text-center {
    text-align: center;
  }
}
</style>
