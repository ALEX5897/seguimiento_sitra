<template>
  <div class="modal fade" id="modalResultadosCarga" tabindex="-1" aria-labelledby="modalResultadosCargaLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header" :class="headerClass">
          <h5 class="modal-title text-white" id="modalResultadosCargaLabel">
            <i :class="headerIcon" class="me-2"></i>
            {{ headerTitle }}
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          <!-- Botón cerrar solo visualmente, no funciona por el backdrop static -->
        </div>
        <div class="modal-body">
          <!-- Resumen general -->
          <div v-if="resultado" class="alert" :class="alertClass" role="alert">
            <h6 class="alert-heading mb-2">
              <i :class="alertIcon"></i>
              {{ resultado.message || 'Proceso completado' }}
            </h6>
            <p class="mb-0 small">{{ fechaCarga }}</p>
          </div>

          <!-- Tarjetas de resumen -->
          <div class="row g-3 mb-4" v-if="resultado && resultado.results">
            <!-- Reasignados -->
            <div class="col-md-4">
              <div class="card border-primary">
                <div class="card-body">
                  <h6 class="card-title text-primary">
                    <i class="bi bi-file-earmark-arrow-down me-1"></i>
                    Reasignados
                  </h6>
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-success fs-6">{{ resultado.results.reasignados.insertados }}</span>
                    <span class="text-muted small">insertados</span>
                  </div>
                  <div class="d-flex justify-content-between align-items-center mt-2" v-if="resultado.results.reasignados.omitidos > 0">
                    <span class="badge bg-warning fs-6">{{ resultado.results.reasignados.omitidos }}</span>
                    <span class="text-muted small">omitidos</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tareas -->
            <div class="col-md-4">
              <div class="card border-info">
                <div class="card-body">
                  <h6 class="card-title text-info">
                    <i class="bi bi-list-check me-1"></i>
                    Tareas
                  </h6>
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-success fs-6">{{ resultado.results.tareas.insertados }}</span>
                    <span class="text-muted small">insertadas</span>
                  </div>
                  <div class="d-flex justify-content-between align-items-center mt-2" v-if="resultado.results.tareas.omitidos > 0">
                    <span class="badge bg-warning fs-6">{{ resultado.results.tareas.omitidos }}</span>
                    <span class="text-muted small">omitidas</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Enviados -->
            <div class="col-md-4">
              <div class="card border-success">
                <div class="card-body">
                  <h6 class="card-title text-success">
                    <i class="bi bi-send me-1"></i>
                    Enviados
                  </h6>
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-success fs-6">{{ resultado.results.enviados.insertados }}</span>
                    <span class="text-muted small">insertados</span>
                  </div>
                  <div class="d-flex justify-content-between align-items-center mt-2" v-if="resultado.results.enviados.omitidos > 0">
                    <span class="badge bg-warning fs-6">{{ resultado.results.enviados.omitidos }}</span>
                    <span class="text-muted small">omitidos</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notificaciones -->
            <div class="col-md-4" v-if="resultado.notificaciones">
              <div class="card border-info">
                <div class="card-body">
                  <h6 class="card-title text-info">
                    <i class="bi bi-envelope-check me-1"></i>
                    Notificaciones
                  </h6>
                  <!-- Si está en proceso -->
                  <div v-if="resultado.notificaciones.enProceso">
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="badge bg-info fs-6">{{ resultado.notificaciones.usuariosAProcesar }}</span>
                      <span class="text-muted small">usuarios</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                      <span class="badge bg-secondary fs-6">{{ resultado.notificaciones.documentosTotal }}</span>
                      <span class="text-muted small">documentos</span>
                    </div>
                    <small class="text-muted d-block mt-2">
                      <i class="bi bi-clock-history me-1"></i>
                      Procesando en segundo plano...
                    </small>
                  </div>
                  <!-- Si ya tiene resultados -->
                  <div v-else>
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="badge bg-success fs-6">{{ resultado.notificaciones.enviadas }}</span>
                      <span class="text-muted small">enviadas</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2" v-if="resultado.notificaciones.fallidas > 0">
                      <span class="badge bg-danger fs-6">{{ resultado.notificaciones.fallidas }}</span>
                      <span class="text-muted small">fallidas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mensaje de notificaciones en proceso -->
          <div v-if="resultado && resultado.notificaciones && resultado.notificaciones.enProceso" class="alert alert-info">
            <h6 class="alert-heading">
              <i class="bi bi-info-circle me-2"></i>
              Notificaciones por correo
            </h6>
            <p class="mb-0">{{ resultado.notificaciones.mensaje }}</p>
            <small class="text-muted">Las notificaciones se enviarán automáticamente sin interrumpir tu trabajo.</small>
          </div>

          <!-- Detalles de Notificaciones Enviadas (solo si tiene detalles) -->
          <div v-if="resultado && resultado.notificaciones && resultado.notificaciones.detalles && resultado.notificaciones.detalles.length > 0" class="mt-4">
            <h6 class="text-info mb-3">
              <i class="bi bi-envelope me-2"></i>
              Detalle de Notificaciones Enviadas
            </h6>
            <div class="card border-info">
              <div class="card-body p-0">
                <div class="table-responsive" style="max-height: 250px;">
                  <table class="table table-sm table-hover mb-0">
                    <thead class="table-light sticky-top">
                      <tr>
                        <th>Usuario</th>
                        <th>Correo</th>
                        <th>Documentos</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(detalle, index) in resultado.notificaciones.detalles" :key="index" :class="detalle.estado === 'error' ? 'table-danger' : 'table-success'">
                        <td><small><strong>{{ detalle.usuario }}</strong></small></td>
                        <td><small>{{ detalle.correo }}</small></td>
                        <td><span class="badge bg-primary">{{ detalle.documentos }}</span></td>
                        <td>
                          <small v-if="detalle.estado === 'enviado'" class="text-success">
                            <i class="bi bi-check-circle me-1"></i>Enviado
                          </small>
                          <small v-else class="text-danger" :title="detalle.error">
                            <i class="bi bi-x-circle me-1"></i>Error
                          </small>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Advertencia de usuarios no encontrados -->
          <div v-if="resultado && resultado.usuariosNoEncontrados && resultado.usuariosNoEncontrados.length > 0" class="alert alert-warning">
            <h6 class="alert-heading">
              <i class="bi bi-exclamation-triangle me-2"></i>
              Usuarios no encontrados en la base de datos
            </h6>
            <p class="mb-2 small">Los siguientes nombres no pudieron ser vinculados con usuarios registrados:</p>
            <ul class="mb-0 small">
              <li v-for="(nombre, index) in resultado.usuariosNoEncontrados" :key="index">
                <strong>{{ nombre }}</strong>
              </li>
            </ul>
            <hr>
            <p class="mb-0 small">
              <i class="bi bi-info-circle me-1"></i>
              Los registros con estos usuarios fueron omitidos. Verifique que estén registrados en el sistema con estado "activo".
            </p>
          </div>

          <!-- Detalles de errores -->
          <div v-if="tieneErrores" class="mt-3">
            <h6 class="text-danger mb-3">
              <i class="bi bi-x-circle me-2"></i>
              Detalles de Errores
            </h6>

            <!-- Errores de Reasignados -->
            <div v-if="resultado.results.reasignados.errores.length > 0" class="mb-3">
              <div class="card border-danger">
                <div class="card-header bg-danger text-white py-2">
                  <small><strong>Reasignados ({{ resultado.results.reasignados.errores.length }} errores)</strong></small>
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive" style="max-height: 200px;">
                    <table class="table table-sm table-hover mb-0">
                      <thead class="table-light sticky-top">
                        <tr>
                          <th style="width: 80px;">Fila</th>
                          <th>Documento</th>
                          <th>Usuario</th>
                          <th>Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(error, index) in resultado.results.reasignados.errores" :key="index">
                          <td><span class="badge bg-secondary">{{ error.fila }}</span></td>
                          <td><small>{{ error.numero_documento || '(sin número)' }}</small></td>
                          <td><small>{{ error.reasignado_a || '-' }}</small></td>
                          <td><small class="text-danger">{{ error.error }}</small></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Errores de Tareas -->
            <div v-if="resultado.results.tareas.errores.length > 0" class="mb-3">
              <div class="card border-danger">
                <div class="card-header bg-danger text-white py-2">
                  <small><strong>Tareas ({{ resultado.results.tareas.errores.length }} errores)</strong></small>
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive" style="max-height: 200px;">
                    <table class="table table-sm table-hover mb-0">
                      <thead class="table-light sticky-top">
                        <tr>
                          <th style="width: 80px;">Fila</th>
                          <th>Documento</th>
                          <th>Usuario</th>
                          <th>Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(error, index) in resultado.results.tareas.errores" :key="index">
                          <td><span class="badge bg-secondary">{{ error.fila }}</span></td>
                          <td><small>{{ error.numero_documento || '(sin número)' }}</small></td>
                          <td><small>{{ error.asignado_para || '-' }}</small></td>
                          <td><small class="text-danger">{{ error.error }}</small></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Errores de Enviados -->
            <div v-if="resultado.results.enviados.errores.length > 0" class="mb-3">
              <div class="card border-danger">
                <div class="card-header bg-danger text-white py-2">
                  <small><strong>Enviados ({{ resultado.results.enviados.errores.length }} errores)</strong></small>
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive" style="max-height: 200px;">
                    <table class="table table-sm table-hover mb-0">
                      <thead class="table-light sticky-top">
                        <tr>
                          <th style="width: 80px;">Fila</th>
                          <th>Documento</th>
                          <th>Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(error, index) in resultado.results.enviados.errores" :key="index">
                          <td><span class="badge bg-secondary">{{ error.fila }}</span></td>
                          <td><small>{{ error.numero_documento || '(sin número)' }}</small></td>
                          <td><small class="text-danger">{{ error.error }}</small></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sin errores -->
          <div v-if="!tieneErrores && resultado && !hayAdvertencias" class="alert alert-success">
            <i class="bi bi-check-circle me-2"></i>
            Todos los registros se cargaron exitosamente sin errores.
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" @click="cerrar">
            <i class="bi bi-check-circle me-1"></i>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'ModalResultadosCarga',
  setup() {
    const resultado = ref(null);
    const fechaCarga = ref('');

    const mostrar = (data) => {
      resultado.value = data;
      fechaCarga.value = new Date().toLocaleString('es-EC', {
        dateStyle: 'full',
        timeStyle: 'medium'
      });
      
      const modal = new window.bootstrap.Modal(document.getElementById('modalResultadosCarga'));
      modal.show();
    };

    const cerrar = () => {
      const modalElement = document.getElementById('modalResultadosCarga');
      const modal = window.bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    };

    const tieneErrores = computed(() => {
      if (!resultado.value || !resultado.value.results) return false;
      return (
        resultado.value.results.reasignados.errores.length > 0 ||
        resultado.value.results.tareas.errores.length > 0 ||
        resultado.value.results.enviados.errores.length > 0
      );
    });

    const hayAdvertencias = computed(() => {
      if (!resultado.value) return false;
      return resultado.value.usuariosNoEncontrados && resultado.value.usuariosNoEncontrados.length > 0;
    });

    const totalInsertados = computed(() => {
      if (!resultado.value || !resultado.value.results) return 0;
      return (
        resultado.value.results.reasignados.insertados +
        resultado.value.results.tareas.insertados +
        resultado.value.results.enviados.insertados
      );
    });

    const totalOmitidos = computed(() => {
      if (!resultado.value || !resultado.value.results) return 0;
      return (
        resultado.value.results.reasignados.omitidos +
        resultado.value.results.tareas.omitidos +
        resultado.value.results.enviados.omitidos
      );
    });

    const headerClass = computed(() => {
      if (tieneErrores.value || totalOmitidos.value > 0) {
        return 'bg-warning';
      }
      return 'bg-success';
    });

    const headerIcon = computed(() => {
      if (tieneErrores.value || totalOmitidos.value > 0) {
        return 'bi bi-exclamation-triangle-fill';
      }
      return 'bi bi-check-circle-fill';
    });

    const headerTitle = computed(() => {
      if (tieneErrores.value || totalOmitidos.value > 0) {
        return 'Carga completada con advertencias';
      }
      return 'Carga completada exitosamente';
    });

    const alertClass = computed(() => {
      if (tieneErrores.value || totalOmitidos.value > 0) {
        return 'alert-warning';
      }
      return 'alert-success';
    });

    const alertIcon = computed(() => {
      if (tieneErrores.value || totalOmitidos.value > 0) {
        return 'bi bi-exclamation-circle me-2';
      }
      return 'bi bi-check-circle me-2';
    });

    return {
      resultado,
      fechaCarga,
      mostrar,
      cerrar,
      tieneErrores,
      hayAdvertencias,
      totalInsertados,
      totalOmitidos,
      headerClass,
      headerIcon,
      headerTitle,
      alertClass,
      alertIcon
    };
  }
};
</script>

<style scoped>
.card {
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.badge.fs-6 {
  font-size: 1.25rem !important;
  padding: 0.5rem 0.75rem;
}

.table-responsive {
  border-radius: 0.25rem;
}

.sticky-top {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
