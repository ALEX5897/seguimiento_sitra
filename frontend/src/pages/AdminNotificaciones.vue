<template>
  <div class="container-fluid py-4">
    <div class="row mb-4">
      <div class="col">
        <h2 class="mb-0">
          <i class="bi bi-bell-fill"></i> Configuración de Notificaciones
        </h2>
        <small class="text-muted">Administrar notificaciones por correo y de la aplicación</small>
      </div>
    </div>

    <div v-if="loading" class="alert alert-info">
      <i class="bi bi-hourglass-split"></i> Cargando configuración...
    </div>

    <div v-else class="row">
      <!-- Configuración General -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0"><i class="bi bi-gear-fill"></i> Configuración General</h5>
          </div>
          <div class="card-body">
            <div class="form-check form-switch mb-3">
              <input
                class="form-check-input"
                type="checkbox"
                id="switchActivo"
                v-model="config.activo"
                @change="guardarConfiguracion"
              />
              <label class="form-check-label" for="switchActivo">
                <strong>Sistema de notificaciones activo</strong>
                <small class="d-block text-muted">
                  Si desactivas, se desactivarán tanto correos como notificaciones de app
                </small>
              </label>
            </div>

            <div class="mb-3">
              <label for="horaEnvio" class="form-label">Hora de envío automático:</label>
              <input
                type="time"
                class="form-control"
                id="horaEnvio"
                v-model="config.hora_envio"
                @change="guardarConfiguracion"
              />
              <small class="text-muted">Hora en que se ejecutarán los procesos automáticos (Zona: Ecuador)</small>
            </div>

            <div class="mb-3">
              <label for="diasRetraso" class="form-label">Días de retraso para notificar:</label>
              <input
                type="number"
                class="form-control"
                id="diasRetraso"
                v-model.number="config.dias_retraso"
                min="0"
                @change="guardarConfiguracion"
              />
              <small class="text-muted">Número de días después de expirar para enviar notificación</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuración de Notificaciones por Correo -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header bg-info text-white">
            <h5 class="mb-0"><i class="bi bi-envelope-fill"></i> Notificaciones por Correo</h5>
          </div>
          <div class="card-body">
            <div class="form-check form-switch mb-4">
              <input
                class="form-check-input"
                type="checkbox"
                id="switchEmail"
                v-model="config.notificaciones_email_activas"
                @change="guardarConfiguracion"
                :disabled="!config.activo"
              />
              <label class="form-check-label" for="switchEmail">
                <strong>Habilitar notificaciones por correo</strong>
              </label>
            </div>

            <div class="alert alert-light" v-if="config.notificaciones_email_activas">
              <p class="mb-2">
                <strong>Habilitado</strong>
              </p>
              <ul class="mb-0 small">
                <li>Se enviarán correos cuando se asigne un nuevo documento</li>
                <li>Se enviarán correos cuando falte 1 día para expirar</li>
                <li>Se enviarán correos cuando un documento esté expirado</li>
                <li>Se enviarán correos por cambios de estado</li>
              </ul>
            </div>

            <div class="alert alert-warning" v-else>
              <p class="mb-0">
                <strong>Deshabilitado</strong> - Los usuarios NO recibirán notificaciones por correo
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuración de Notificaciones de la App -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0"><i class="bi bi-app-indicator"></i> Notificaciones de la Aplicación</h5>
          </div>
          <div class="card-body">
            <div class="form-check form-switch mb-4">
              <input
                class="form-check-input"
                type="checkbox"
                id="switchApp"
                v-model="config.notificaciones_app_activas"
                @change="guardarConfiguracion"
                :disabled="!config.activo"
              />
              <label class="form-check-label" for="switchApp">
                <strong>Habilitar notificaciones en la aplicación</strong>
              </label>
            </div>

            <div class="alert alert-light" v-if="config.notificaciones_app_activas">
              <p class="mb-2">
                <strong>Habilitado</strong>
              </p>
              <ul class="mb-0 small">
                <li>Los usuarios verán campanas de notificación en la app</li>
                <li>Se registran cambios de estado de documentos</li>
                <li>Se registran nuevos comentarios</li>
              </ul>
            </div>

            <div class="alert alert-warning" v-else>
              <p class="mb-0">
                <strong>Deshabilitado</strong> - Los usuarios NO verán notificaciones en la aplicación
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Historial de Envíos -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header bg-warning text-dark">
            <h5 class="mb-0"><i class="bi bi-clock-history"></i> Historial de Envíos</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <small class="text-muted">Último envío de notificaciones:</small>
              <p class="mb-0 fw-bold">{{ formatDate(status.ultimo_envio_notificaciones) }}</p>
            </div>

            <div class="mb-3">
              <small class="text-muted">Último envío de correos expirados:</small>
              <p class="mb-0 fw-bold">{{ formatDate(status.ultimo_envio_expirados) }}</p>
            </div>

            <div class="mb-3">
              <small class="text-muted">Último envío de correos próximos:</small>
              <p class="mb-0 fw-bold">{{ formatDate(status.ultimo_envio_proximos) }}</p>
            </div>

            <div class="mb-3">
              <small class="text-muted">Total de correos enviados hoy:</small>
              <p class="mb-0 fw-bold">{{ status.correos_enviados_hoy || 0 }}</p>
            </div>

            <button @click="cargarStatus" class="btn btn-sm btn-outline-primary">
              <i class="bi bi-arrow-clockwise"></i> Actualizar
            </button>
          </div>
        </div>
      </div>

      <!-- Correo de Prueba -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0"><i class="bi bi-send"></i> Correo de Prueba</h5>
          </div>
          <div class="card-body">
            <p class="small text-muted mb-3">
              Envía un correo de prueba para verificar que la configuración de correo funciona correctamente.
            </p>

            <div class="mb-3">
              <label for="emailPrueba" class="form-label">Correo de destino:</label>
              <input
                type="email"
                class="form-control"
                id="emailPrueba"
                v-model="emailPrueba"
                placeholder="ejemplo@dominio.com"
              />
            </div>

            <button
              @click="enviarCorreoPrueba"
              :disabled="!emailPrueba || enviandoPrueba"
              class="btn btn-primary"
            >
              <span v-if="enviandoPrueba" class="spinner-border spinner-border-sm me-2"></span>
              <i class="bi bi-send me-1"></i>
              Enviar Correo de Prueba
            </button>
          </div>
        </div>
      </div>

      <!-- Plantillas de Notificación -->
      <div class="col-md-12 mb-4">
        <div class="card">
          <div class="card-header bg-secondary text-white">
            <h5 class="mb-0"><i class="bi bi-file-text"></i> Plantillas de Notificación por Correo</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div v-for="plantilla in plantillas" :key="plantilla.tipo" class="col-md-6 mb-3">
                <div class="card border-light">
                  <div class="card-header" :style="{ backgroundColor: getColorPantilla(plantilla.tipo) }">
                    <h6 class="mb-0 text-white">
                      <i :class="getIconoPantilla(plantilla.tipo)"></i> {{ getNombrePantilla(plantilla.tipo) }}
                    </h6>
                  </div>
                  <div class="card-body">
                    <small class="text-muted d-block mb-2"><strong>Asunto:</strong></small>
                    <p class="small mb-3">{{ plantilla.asunto }}</p>
                    <button
                      class="btn btn-sm btn-outline-primary me-2"
                      @click="editarPlantilla(plantilla)"
                    >
                      <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button
                      class="btn btn-sm btn-outline-info"
                      @click="previewPlantilla(plantilla)"
                    >
                      <i class="bi bi-eye"></i> Vista Previa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enviar Notificaciones Ahora -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0"><i class="bi bi-bolt-fill"></i> Enviar Notificaciones Ahora</h5>
          </div>
          <div class="card-body">
            <p class="small text-muted mb-3">
              Envía notificaciones inmediatas según los filtros seleccionados.
            </p>

            <div class="mb-4">
              <h6 class="mb-3">Selecciona qué enviar:</h6>

              <div class="form-check mb-2">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="checkDocumentosExpirados"
                  v-model="filtrosEnvio.documentosExpirados"
                />
                <label class="form-check-label" for="checkDocumentosExpirados">
                  <strong>📋 Documentos Tarde (Expirados)</strong>
                  <small class="d-block text-muted">Notificar sobre documentos cuya fecha máxima de respuesta ya pasó</small>
                </label>
              </div>

              <div class="form-check mb-3">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="checkDocumentosProximos"
                  v-model="filtrosEnvio.documentosProximos"
                />
                <label class="form-check-label" for="checkDocumentosProximos">
                  <strong>⏰ Documentos Próximos a Vencer</strong>
                  <small class="d-block text-muted">Notificar sobre documentos que vencen en las próximas 24 horas</small>
                </label>
              </div>
            </div>

            <button
              @click="enviarNotificacionesAhora"
              :disabled="!filtrosEnvio.documentosExpirados && !filtrosEnvio.documentosProximos || enviandoAhora"
              class="btn btn-success w-100"
            >
              <span v-if="enviandoAhora" class="spinner-border spinner-border-sm me-2"></span>
              <i class="bi bi-lightning-charge-fill me-1"></i>
              Enviar Notificaciones Ahora
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para editar plantilla -->
    <div v-if="mostrarModalPlantilla" class="modal d-block" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Editar Plantilla - {{ getNombrePantilla(plantillaActual.tipo) }}</h5>
            <button type="button" class="btn-close" @click="mostrarModalPlantilla = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label"><strong>Asunto del Correo</strong></label>
              <input
                v-model="plantillaActual.asunto"
                type="text"
                class="form-control"
              />
              <small class="text-muted">Puedes usar {{variable}} para reemplazar con datos dinámicos</small>
            </div>

            <div class="mb-3">
              <label class="form-label"><strong>Cuerpo del Correo (HTML)</strong></label>
              <textarea
                v-model="plantillaActual.cuerpo_html"
                class="form-control"
                rows="12"
                style="font-family: monospace;"
              ></textarea>
              <small class="text-muted d-block mt-2">
                <strong>Variables disponibles:</strong> {{nombre}}, {{cantidad}}, {{numero_documento}}, {{tipo_documento}}, {{remitente}}, {{fecha_max_respuesta}}, {{asunto}}, {{url_sistema}}, {{tabla_documentos}}
              </small>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="mostrarModalPlantilla = false">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="guardarPlantilla"
              :disabled="guardandoPlantilla"
            >
              <span v-if="guardandoPlantilla" class="spinner-border spinner-border-sm me-2"></span>
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para preview de plantilla -->
    <div v-if="mostrarPreview" class="modal d-block" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Vista Previa - {{ getNombrePantilla(plantillaActual.tipo) }}</h5>
            <button type="button" class="btn-close" @click="mostrarPreview = false"></button>
          </div>
          <div class="modal-body">
            <div class="card">
              <div class="card-body">
                <p><strong>Asunto:</strong> {{ plantillaActual.asunto }}</p>
                <hr>
                <div v-html="plantillaActual.cuerpo_html" class="border p-3" style="background-color: #f9f9f9;"></div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="mostrarPreview = false">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="mensaje" class="alert" :class="'alert-' + tipoMensaje" role="alert">
      {{ mensaje }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminNotificaciones',
  data() {
    return {
      config: {
        id: 1,
        activo: true,
        hora_envio: '08:00',
        dias_retraso: 1,
        notificaciones_email_activas: true,
        notificaciones_app_activas: true,
        updated_at: null
      },
      status: {
        ultimo_envio_notificaciones: null,
        ultimo_envio_expirados: null,
        ultimo_envio_proximos: null,
        correos_enviados_hoy: 0
      },
      emailPrueba: '',
      enviandoPrueba: false,
      loading: true,
      mensaje: '',
      tipoMensaje: 'info',
      filtrosEnvio: {
        documentosExpirados: true,
        documentosProximos: true
      },
      enviandoAhora: false,
      plantillas: [],
      mostrarModalPlantilla: false,
      mostrarPreview: false,
      plantillaActual: {},
      guardandoPlantilla: false
    };
  },
  mounted() {
    this.cargarConfiguracion();
    this.cargarStatus();
    this.cargarPlantillas();
  },
  methods: {
    async cargarConfiguracion() {
      try {
        this.loading = true;
        const response = await fetch('/api/admin/notificaciones', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 403) {
            this.mostrarError('No tienes permiso para acceder a esta sección. Solo administradores pueden hacerlo.');
          } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          return;
        }

        const data = await response.json();
        this.config = data;
        this.mostrarExito('Configuración cargada correctamente');
      } catch (error) {
        console.error('Error:', error);
        this.mostrarError('Error al cargar la configuración: ' + error.message);
      } finally {
        this.loading = false;
      }
    },

    async guardarConfiguracion() {
      try {
        const response = await fetch('/api/admin/notificaciones', {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            activo: this.config.activo,
            hora_envio: this.config.hora_envio,
            dias_retraso: this.config.dias_retraso,
            notificaciones_email_activas: this.config.notificaciones_email_activas,
            notificaciones_app_activas: this.config.notificaciones_app_activas
          })
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        this.config = data;
        this.mostrarExito('Configuración guardada correctamente');
      } catch (error) {
        console.error('Error:', error);
        this.mostrarError('Error al guardar la configuración: ' + error.message);
        this.cargarConfiguracion();
      }
    },

    async cargarStatus() {
      try {
        const response = await fetch('/api/admin/notificaciones/status', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        this.status = data;
      } catch (error) {
        console.error('Error cargando status:', error);
        this.mostrarError('Error al cargar el estado de envíos: ' + error.message);
      }
    },

    async enviarCorreoPrueba() {
      if (!this.emailPrueba) {
        this.mostrarError('Por favor ingresa un correo electrónico válido');
        return;
      }

      try {
        this.enviandoPrueba = true;
        const response = await fetch('/api/admin/notificaciones/test-email', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.emailPrueba
          })
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        this.mostrarExito('Correo de prueba enviado correctamente a ' + this.emailPrueba);
        this.emailPrueba = '';
      } catch (error) {
        console.error('Error enviando correo de prueba:', error);
        this.mostrarError('Error al enviar correo de prueba: ' + error.message);
      } finally {
        this.enviandoPrueba = false;
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'Nunca';
      const date = new Date(dateString);
      return date.toLocaleString('es-ES');
    },

    mostrarExito(mensaje) {
      this.mensaje = mensaje;
      this.tipoMensaje = 'success';
      setTimeout(() => {
        this.mensaje = '';
      }, 3000);
    },

    mostrarError(mensaje) {
      this.mensaje = mensaje;
      this.tipoMensaje = 'danger';
    },

    async enviarNotificacionesAhora() {
      if (!this.filtrosEnvio.documentosExpirados && !this.filtrosEnvio.documentosProximos) {
        this.mostrarError('Selecciona al menos una opción para enviar notificaciones');
        return;
      }

      try {
        this.enviandoAhora = true;
        const response = await fetch('/api/admin/notificaciones/enviar-ahora', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            documentosExpirados: this.filtrosEnvio.documentosExpirados,
            documentosProximos: this.filtrosEnvio.documentosProximos
          })
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        this.mostrarExito(`✅ Notificaciones enviadas exitosamente!\n${data.mensaje}`);
        this.cargarStatus();
      } catch (error) {
        console.error('Error enviando notificaciones:', error);
        this.mostrarError('Error al enviar notificaciones: ' + error.message);
      } finally {
        this.enviandoAhora = false;
      }
    },

    async cargarPlantillas() {
      try {
        const response = await fetch('/api/admin/notificaciones/plantillas', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        this.plantillas = data;
      } catch (error) {
        console.error('Error cargando plantillas:', error);
        this.mostrarError('Error al cargar plantillas: ' + error.message);
      }
    },

    editarPlantilla(plantilla) {
      this.plantillaActual = JSON.parse(JSON.stringify(plantilla));
      this.mostrarModalPlantilla = true;
    },

    previewPlantilla(plantilla) {
      this.plantillaActual = JSON.parse(JSON.stringify(plantilla));
      this.mostrarPreview = true;
    },

    async guardarPlantilla() {
      try {
        this.guardandoPlantilla = true;
        const response = await fetch(`/api/admin/notificaciones/plantillas/${this.plantillaActual.tipo}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            asunto: this.plantillaActual.asunto,
            cuerpo_html: this.plantillaActual.cuerpo_html
          })
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        this.mostrarExito('Plantilla guardada correctamente');
        this.mostrarModalPlantilla = false;
        await this.cargarPlantillas();
      } catch (error) {
        console.error('Error guardando plantilla:', error);
        this.mostrarError('Error al guardar plantilla: ' + error.message);
      } finally {
        this.guardandoPlantilla = false;
      }
    },

    getNombrePantilla(tipo) {
      const nombres = {
        'asignado': '📎 Documentos Asignados',
        'tarde': '❌ Documentos Tarde (Vencidos)',
        'proximo_vencer': '⏰ Documentos Próximos a Vencer'
      };
      return nombres[tipo] || tipo;
    },

    getColorPantilla(tipo) {
      const colores = {
        'asignado': '#007bff',
        'tarde': '#dc3545',
        'proximo_vencer': '#ff9800'
      };
      return colores[tipo] || '#6c757d';
    },

    getIconoPantilla(tipo) {
      const iconos = {
        'asignado': 'bi bi-file-earmark-plus',
        'tarde': 'bi bi-exclamation-triangle',
        'proximo_vencer': 'bi bi-clock-history'
      };
      return iconos[tipo] || 'bi bi-file-text';
    }
  }
};
</script>

<style scoped>
.card {
  border: 1px solid #dee2e6;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-header {
  border-bottom: 1px solid #dee2e6;
}

.form-check-label {
  cursor: pointer;
  user-select: none;
}

.badge {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
}
</style>
