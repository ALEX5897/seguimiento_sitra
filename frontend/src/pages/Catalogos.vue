<template>
  <div class="container-fluid p-4">
    <!-- Encabezado -->
    <div class="mb-5">
      <h1 class="page-title">📋 Catálogos del Sistema</h1>
      <p class="text-muted">Gestión de valores fijos y dominios</p>
    </div>

    <!-- Tab navigation -->
    <div class="mb-4">
      <ul class="nav nav-tabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'estados' }"
            @click="activeTab = 'estados'"
            type="button"
            role="tab">
            <i class="bi bi-tags me-2"></i>Estados de Reasignados
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'importancias' }"
            @click="activeTab = 'importancias'"
            type="button"
            role="tab">
            <i class="bi bi-exclamation-circle me-2"></i>Importancias
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'gerencias' }"
            @click="activeTab = 'gerencias'"
            type="button"
            role="tab">
            <i class="bi bi-diagram-3 me-2"></i>Gerencias
          </button>
        </li>
      </ul>
    </div>

    <!-- Tab content -->
    <div class="tab-content">
      <!-- Estados de Reasignados -->
      <div v-if="activeTab === 'estados'" class="tab-pane fade show active">
        <!-- Acciones y Filtros -->
        <div class="row mb-4">
          <div class="col-12 col-md-auto mb-2 mb-md-0">
            <button @click="openCreateEstado" class="btn btn-success w-100 w-md-auto" v-if="isAdmin">
              ➕ Nuevo Estado
            </button>
          </div>
          <div class="col-12 col-md">
            <input
              v-model="filtroEstados"
              type="text"
              class="form-control"
              placeholder="🔍 Buscar por nombre o código..."
              @input="currentPageEstados = 1" />
          </div>
        </div>

        <!-- Tabla de Estados -->
        <div class="card">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <span>📊 Estados de Reasignados</span>
            <small v-if="estadosFiltrados.length > 0" class="text-muted">
              {{ estadosFiltrados.length }} total
            </small>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>
            <div v-else>
              <!-- Vista Desktop (Tabla) -->
              <div class="table-wrapper">
                <div class="table-responsive">
                  <table class="table table-hover mb-0" v-if="estadosFiltrados.length > 0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Icono</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Color</th>
                    <th>Estado</th>
                    <th v-if="isAdmin" style="width: 150px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="estado in estadosPaginados" :key="estado.id" :class="{ 'table-secondary': !estado.activo }">
                    <td><strong>#{{ estado.id }}</strong></td>
                    <td><span style="font-size: 1.5rem;">{{ estado.icono || '◯' }}</span></td>
                    <td><code>{{ estado.codigo }}</code></td>
                    <td><strong>{{ estado.nombre }}</strong></td>
                    <td class="text-muted" style="max-width: 200px; white-space: normal;">{{ estado.descripcion || '-' }}</td>
                    <td>
                      <span
                        class="badge"
                        :class="{
                          'bg-primary': estado.color === 'primary',
                          'bg-secondary': estado.color === 'secondary',
                          'bg-success': estado.color === 'success',
                          'bg-danger': estado.color === 'danger',
                          'bg-warning text-dark': estado.color === 'warning',
                          'bg-info': estado.color === 'info',
                          'bg-light text-dark': estado.color === 'light',
                          'bg-dark': estado.color === 'dark'
                        }">
                        {{ estado.color || 'ninguno' }}
                      </span>
                    </td>
                    <td>
                      <span v-if="estado.activo" class="badge bg-success">✓ Activo</span>
                      <span v-else class="badge bg-secondary">✗ Inactivo</span>
                    </td>
                    <td v-if="isAdmin">
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary" @click="openEditEstado(estado)" title="Editar" :disabled="isSaving">✏️</button>
                        <button v-if="estado.activo" class="btn btn-danger" @click="desactivarEstado(estado.id)" title="Desactivar" :disabled="isSaving">🗑️</button>
                        <button v-else class="btn btn-success" @click="reactivarEstado(estado.id)" title="Reactivar" :disabled="isSaving">↻</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
                <div v-else class="text-center py-4 text-muted">
                  <span>ℹ️</span> Sin estados disponibles
                </div>
              </div>
              </div>
              <!-- Paginación -->
              <nav v-if="estadosFiltrados.length > itemsPerPage" class="mt-3">
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" :class="{ disabled: currentPageEstados === 1 }">
                    <button class="page-link" @click="currentPageEstados = 1" :disabled="currentPageEstados === 1">«</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPageEstados === 1 }">
                    <button class="page-link" @click="currentPageEstados--" :disabled="currentPageEstados === 1">‹</button>
                  </li>
                  <li v-for="p in totalPagesEstados" :key="p" class="page-item" :class="{ active: p === currentPageEstados }">
                    <button class="page-link" @click="currentPageEstados = p">{{ p }}</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPageEstados === totalPagesEstados }">
                    <button class="page-link" @click="currentPageEstados++" :disabled="currentPageEstados === totalPagesEstados">›</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPageEstados === totalPagesEstados }">
                    <button class="page-link" @click="currentPageEstados = totalPagesEstados" :disabled="currentPageEstados === totalPagesEstados">»</button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Importancias -->
      <div v-if="activeTab === 'importancias'" class="tab-pane fade show active">
        <!-- Acciones y Filtros -->
        <div class="row mb-4">
          <div class="col-12 col-md-auto mb-2 mb-md-0">
            <button @click="openCreateImportancia" class="btn btn-success w-100 w-md-auto" v-if="isAdmin">
              ➕ Nueva Importancia
            </button>
          </div>
          <div class="col-12 col-md">
            <input
              v-model="filtroImportancias"
              type="text"
              class="form-control"
              placeholder="🔍 Buscar por nombre o código..."
              @input="currentPageImportancias = 1" />
          </div>
        </div>

        <!-- Tabla de Importancias -->
        <div class="card">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <span>⚡ Importancias</span>
            <small v-if="importanciasFiltradas.length > 0" class="text-muted">
              {{ importanciasFiltradas.length }} total
            </small>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>
            <div v-else>
              <!-- Vista Desktop (Tabla) -->
              <div class="table-wrapper">
                <div class="table-responsive">
                  <table class="table table-hover mb-0" v-if="importanciasFiltradas.length > 0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Icono</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Color</th>
                    <th>Estado</th>
                    <th v-if="isAdmin" style="width: 150px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="imp in importanciasPaginadas" :key="imp.id" :class="{ 'table-secondary': !imp.activo }">
                    <td><strong>#{{ imp.id }}</strong></td>
                    <td><span style="font-size: 1.5rem;">{{ imp.icono || '◯' }}</span></td>
                    <td><code>{{ imp.codigo }}</code></td>
                    <td><strong>{{ imp.nombre }}</strong></td>
                    <td class="text-muted" style="max-width: 200px; white-space: normal;">{{ imp.descripcion || '-' }}</td>
                    <td>
                      <span
                        class="badge"
                        :class="{
                          'bg-primary': imp.color === 'primary',
                          'bg-secondary': imp.color === 'secondary',
                          'bg-success': imp.color === 'success',
                          'bg-danger': imp.color === 'danger',
                          'bg-warning text-dark': imp.color === 'warning',
                          'bg-info': imp.color === 'info',
                          'bg-light text-dark': imp.color === 'light',
                          'bg-dark': imp.color === 'dark'
                        }">
                        {{ imp.color || 'ninguno' }}
                      </span>
                    </td>
                    <td>
                      <span v-if="imp.activo" class="badge bg-success">✓ Activo</span>
                      <span v-else class="badge bg-secondary">✗ Inactivo</span>
                    </td>
                    <td v-if="isAdmin">
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary" @click="openEditImportancia(imp)" title="Editar" :disabled="isSaving">✏️</button>
                        <button v-if="imp.activo" class="btn btn-danger" @click="desactivarImportancia(imp.id)" title="Desactivar" :disabled="isSaving">🗑️</button>
                        <button v-else class="btn btn-success" @click="reactivarImportancia(imp.id)" title="Reactivar" :disabled="isSaving">↻</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
                <div v-else class="text-center py-4 text-muted">
                  <span>ℹ️</span> Sin importancias disponibles
                </div>
              </div>
              </div>
              <!-- Paginación -->
              <nav v-if="importanciasFiltradas.length > itemsPerPage" class="mt-3">
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" :class="{ disabled: currentPageImportancias === 1 }">
                    <button class="page-link" @click="currentPageImportancias = 1" :disabled="currentPageImportancias === 1">«</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPageImportancias === 1 }">
                    <button class="page-link" @click="currentPageImportancias--" :disabled="currentPageImportancias === 1">‹</button>
                  </li>
                  <li v-for="p in totalPagesImportancias" :key="p" class="page-item" :class="{ active: p === currentPageImportancias }">
                    <button class="page-link" @click="currentPageImportancias = p">{{ p }}</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPageImportancias === totalPagesImportancias }">
                    <button class="page-link" @click="currentPageImportancias++" :disabled="currentPageImportancias === totalPagesImportancias">›</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPageImportancias === totalPagesImportancias }">
                    <button class="page-link" @click="currentPageImportancias = totalPagesImportancias" :disabled="currentPageImportancias === totalPagesImportancias">»</button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Gerencias -->
      <div v-if="activeTab === 'gerencias'" class="tab-pane fade show active">
        <!-- Acciones y Filtros -->
        <div class="row mb-4">
          <div class="col-12 col-md-auto mb-2 mb-md-0">
            <button @click="openCreateGerencia" class="btn btn-success w-100 w-md-auto" v-if="isAdmin">
              ➕ Nueva Gerencia
            </button>
          </div>
          <div class="col-12 col-md">
            <input
              v-model="filtroGerencias"
              type="text"
              class="form-control"
              placeholder="🔍 Buscar por nombre o código..."
              @input="currentPageGerencias = 1" />
          </div>
        </div>

        <!-- Tabla de Gerencias -->
        <div class="card">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <span>🏢 Gerencias</span>
            <small v-if="gerenciasFiltradas.length > 0" class="text-muted">
              {{ gerenciasFiltradas.length }} total
            </small>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>
            <div v-else>
              <!-- Vista Desktop (Tabla) -->
              <div class="table-wrapper">
                <div class="table-responsive">
                  <table class="table table-hover mb-0" v-if="gerenciasFiltradas.length > 0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th v-if="isAdmin" style="width: 150px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="gerencia in gerenciasPaginadas" :key="gerencia.id" :class="{ 'table-secondary': !gerencia.activo }">
                    <td><strong>#{{ gerencia.id }}</strong></td>
                    <td><code>{{ gerencia.codigo }}</code></td>
                    <td><strong>{{ gerencia.nombre }}</strong></td>
                    <td class="text-muted" style="max-width: 300px; white-space: normal;">{{ gerencia.descripcion || '-' }}</td>
                    <td>
                      <span v-if="gerencia.activo" class="badge bg-success">✓ Activo</span>
                      <span v-else class="badge bg-secondary">✗ Inactivo</span>
                    </td>
                    <td v-if="isAdmin">
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary" @click="openEditGerencia(gerencia)" title="Editar" :disabled="isSaving">✏️</button>
                        <button v-if="gerencia.activo" class="btn btn-danger" @click="desactivarGerencia(gerencia.id)" title="Desactivar" :disabled="isSaving">🗑️</button>
                        <button v-else class="btn btn-success" @click="reactivarGerencia(gerencia.id)" title="Reactivar" :disabled="isSaving">↻</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
                <div v-else class="text-center py-4 text-muted">
                  <span>ℹ️</span> Sin gerencias disponibles
                </div>
              </div>
              </div>
              <!-- Paginación -->
              <nav v-if="gerenciasFiltradas.length > itemsPerPage" class="mt-3">
                <ul class="pagination justify-content-center mb-0">
                  <li class="page-item" :class="{ disabled: currentPageGerencias === 1 }">
                    <button class="page-link" @click="currentPageGerencias = 1" :disabled="currentPageGerencias === 1">«</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPageGerencias === 1 }">
                    <button class="page-link" @click="currentPageGerencias--" :disabled="currentPageGerencias === 1">‹</button>
                  </li>
                  <li v-for="p in totalPagesGerencias" :key="p" class="page-item" :class="{ active: p === currentPageGerencias }">
                    <button class="page-link" @click="currentPageGerencias = p">{{ p }}</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPageGerencias === totalPagesGerencias }">
                    <button class="page-link" @click="currentPageGerencias++" :disabled="currentPageGerencias === totalPagesGerencias">›</button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPageGerencias === totalPagesGerencias }">
                    <button class="page-link" @click="currentPageGerencias = totalPagesGerencias" :disabled="currentPageGerencias === totalPagesGerencias">»</button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Crear/Editar -->
    <div class="modal fade" id="modalEstado" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <span v-if="activeTab === 'estados'">{{ editingId ? 'Editar Estado' : 'Nuevo Estado' }}</span>
              <span v-else-if="activeTab === 'importancias'">{{ editingId ? 'Editar Importancia' : 'Nueva Importancia' }}</span>
              <span v-else-if="activeTab === 'gerencias'">{{ editingId ? 'Editar Gerencia' : 'Nueva Gerencia' }}</span>
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="save">
              <div v-if="activeTab !== 'gerencias'" class="mb-3">
                <label class="form-label fw-bold">Código *</label>
                <input v-model="form.codigo" type="text" class="form-control" placeholder="ej: pendiente" required :disabled="editingId" />
                <small class="text-muted">No se puede cambiar después de crear</small>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Nombre *</label>
                <input v-model="form.nombre" type="text" class="form-control" :placeholder="activeTab === 'gerencias' ? 'ej: Dirección Administrativa' : 'ej: Pendiente'" required />
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Descripción</label>
                <textarea v-model="form.descripcion" class="form-control" rows="3" :placeholder="activeTab === 'gerencias' ? 'Descripción de la gerencia...' : 'Descripción...'" ></textarea>
              </div>
              <div v-if="activeTab !== 'gerencias'" class="mb-3">
                <label class="form-label fw-bold">Icono</label>
                <input v-model="form.icono" type="text" class="form-control" placeholder="ej: ⏳" maxlength="2" />
                <small class="text-muted">Un emoji (opcional)</small>
              </div>
              <div v-if="activeTab !== 'gerencias'" class="mb-3">
                <label class="form-label fw-bold">Color Bootstrap</label>
                <select v-model="form.color" class="form-select">
                  <option value="">-- Sin color --</option>
                  <option value="primary">Primary (Azul)</option>
                  <option value="secondary">Secondary (Gris)</option>
                  <option value="success">Success (Verde)</option>
                  <option value="danger">Danger (Rojo)</option>
                  <option value="warning">Warning (Amarillo)</option>
                  <option value="info">Info (Cyan)</option>
                  <option value="light">Light (Claro)</option>
                  <option value="dark">Dark (Oscuro)</option>
                </select>
              </div>
              <div v-if="editingId" class="mb-3">
                <label class="form-label fw-bold">Estado</label>
                <div class="form-check form-switch">
                  <input
                    :checked="form.activo === true || form.activo === 1 || form.activo === '1'"
                    @change="form.activo = !form.activo"
                    type="checkbox"
                    class="form-check-input"
                    id="activoCheck" />
                  <label class="form-check-label" for="activoCheck">
                    {{ (form.activo === true || form.activo === 1 || form.activo === '1') ? '✓ Activo' : '✗ Inactivo' }}
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" @click="save" :disabled="isSaving">
              <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
              💾 Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';
import { showToast, confirmAction } from '../utils/feedback';

export default {
  name: 'Catalogos',
  data() {
    return {
      estados: [],
      importancias: [],
      gerencias: [],
      form: {},
      editingId: null,
      loading: false,
      isSaving: false,
      isAdmin: false,
      activeTab: 'estados',
      usuarioActual: null,
      // Filtros
      filtroEstados: '',
      filtroImportancias: '',
      filtroGerencias: '',
      // Paginación
      itemsPerPage: 10,
      currentPageEstados: 1,
      currentPageImportancias: 1,
      currentPageGerencias: 1
    };
  },
  mounted() {
    this.cargarPermiso();
    this.cargarEstados();
    this.cargarImportancias();
    this.cargarGerencias();
  },
  computed: {
    estadosFiltrados() {
      return this.estados.filter(e =>
        e.nombre.toLowerCase().includes(this.filtroEstados.toLowerCase()) ||
        e.codigo.toLowerCase().includes(this.filtroEstados.toLowerCase())
      );
    },
    estadosPaginados() {
      const start = (this.currentPageEstados - 1) * this.itemsPerPage;
      return this.estadosFiltrados.slice(start, start + this.itemsPerPage);
    },
    totalPagesEstados() {
      return Math.ceil(this.estadosFiltrados.length / this.itemsPerPage);
    },
    importanciasFiltradas() {
      return this.importancias.filter(i =>
        i.nombre.toLowerCase().includes(this.filtroImportancias.toLowerCase()) ||
        i.codigo.toLowerCase().includes(this.filtroImportancias.toLowerCase())
      );
    },
    importanciasPaginadas() {
      const start = (this.currentPageImportancias - 1) * this.itemsPerPage;
      return this.importanciasFiltradas.slice(start, start + this.itemsPerPage);
    },
    totalPagesImportancias() {
      return Math.ceil(this.importanciasFiltradas.length / this.itemsPerPage);
    },
    gerenciasFiltradas() {
      return this.gerencias.filter(g =>
        g.nombre.toLowerCase().includes(this.filtroGerencias.toLowerCase()) ||
        g.codigo.toLowerCase().includes(this.filtroGerencias.toLowerCase())
      );
    },
    gerenciasPaginadas() {
      const start = (this.currentPageGerencias - 1) * this.itemsPerPage;
      return this.gerenciasFiltradas.slice(start, start + this.itemsPerPage);
    },
    totalPagesGerencias() {
      return Math.ceil(this.gerenciasFiltradas.length / this.itemsPerPage);
    }
  },
  methods: {
    async cargarPermiso() {
      try {
        const response = await api.get('/auth/usuario');
        if (response.data && response.data.usuario) {
          this.usuarioActual = response.data.usuario;
          const rol = (response.data.usuario.rol || '').toLowerCase();
          this.isAdmin = rol.includes('admin');
          console.log('✓ Rol cargado:', response.data.usuario.rol, 'isAdmin:', this.isAdmin);
        }
      } catch (error) {
        console.error('Error cargando permiso:', error);
        this.isAdmin = false;
      }
    },

    async cargarEstados() {
      try {
        this.loading = true;
        const response = await api.get('/catalogos/estados-reasignados');
        this.estados = response.data || [];
        console.log('✓ Estados cargados:', this.estados.length);
      } catch (err) {
        showToast('❌ Error cargando estados: ' + err.message, 'error');
        console.error('Error:', err);
      } finally {
        this.loading = false;
      }
    },

    async cargarImportancias() {
      try {
        const response = await api.get('/catalogos/importancias');
        this.importancias = response.data || [];
        console.log('✓ Importancias cargadas:', this.importancias.length);
      } catch (err) {
        console.error('Error cargando importancias:', err);
        this.importancias = [];
      }
    },

    async cargarGerencias() {
      try {
        const response = await api.get('/catalogos/gerencias');
        this.gerencias = response.data || [];
        console.log('✓ Gerencias cargadas:', this.gerencias.length);
      } catch (err) {
        console.error('Error cargando gerencias:', err);
        this.gerencias = [];
      }
    },

    openCreateEstado() {
      this.activeTab = 'estados';
      this.editingId = null;
      this.form = {
        codigo: '',
        nombre: '',
        descripcion: '',
        icono: '',
        color: 'primary',
        activo: true
      };
      this.abrirModal();
    },

    openEditEstado(estado) {
      this.activeTab = 'estados';
      this.editingId = estado.id;
      this.form = { ...estado };
      // Normalizar activo a booleano
      this.form.activo = estado.activo === true || estado.activo === 1 || estado.activo === '1';
      this.abrirModal();
    },

    openCreateImportancia() {
      this.activeTab = 'importancias';
      this.editingId = null;
      this.form = {
        codigo: '',
        nombre: '',
        descripcion: '',
        icono: '',
        color: 'primary',
        activo: true
      };
      this.abrirModal();
    },

    openEditImportancia(imp) {
      this.activeTab = 'importancias';
      this.editingId = imp.id;
      this.form = { ...imp };
      // Normalizar activo a booleano
      this.form.activo = imp.activo === true || imp.activo === 1 || imp.activo === '1';
      this.abrirModal();
    },

    openCreateGerencia() {
      this.activeTab = 'gerencias';
      this.editingId = null;
      this.form = {
        codigo: '',
        nombre: '',
        descripcion: '',
        activo: true
      };
      this.abrirModal();
    },

    openEditGerencia(gerencia) {
      this.activeTab = 'gerencias';
      this.editingId = gerencia.id;
      this.form = { ...gerencia };
      // Normalizar activo a booleano
      this.form.activo = gerencia.activo === true || gerencia.activo === 1 || gerencia.activo === '1';
      this.abrirModal();
    },

    abrirModal() {
      const modal = new window.bootstrap.Modal(document.getElementById('modalEstado'));
      modal.show();
    },

    validarFormulario() {
      const errores = [];
      const isGerencia = this.activeTab === 'gerencias';

      if (!isGerencia && (!this.form.codigo || this.form.codigo.trim() === '')) {
        errores.push('El código es requerido');
      } else if (!isGerencia && !/^[a-z_]+$/.test(this.form.codigo)) {
        errores.push('El código debe contener solo letras minúsculas y guiones bajos');
      }

      if (!this.form.nombre || this.form.nombre.trim() === '') {
        errores.push('El nombre es requerido');
      } else if (this.form.nombre.length > 100) {
        errores.push('El nombre no puede exceder 100 caracteres');
      }

      if (!isGerencia && this.form.icono && this.form.icono.length > 2) {
        errores.push('El icono debe ser máximo 2 caracteres');
      }

      if (errores.length > 0) {
        showToast('⚠️ ' + errores[0], 'warning');
        return false;
      }

      return true;
    },

    async save() {
      try {
        if (!this.validarFormulario()) {
          return;
        }

        this.isSaving = true;
        const isEstado = this.activeTab === 'estados';
        const isImportancia = this.activeTab === 'importancias';
        const isGerencia = this.activeTab === 'gerencias';

        let endpoint = '';
        let tipo = '';
        if (isEstado) {
          endpoint = '/catalogos/estados-reasignados';
          tipo = 'Estado';
        } else if (isImportancia) {
          endpoint = '/catalogos/importancias';
          tipo = 'Importancia';
        } else if (isGerencia) {
          endpoint = '/catalogos/gerencias';
          tipo = 'Gerencia';
        }

        if (this.editingId) {
          // Actualizar
          console.log(`Actualizando ${tipo}:`, this.editingId);
          const payload = {
            nombre: this.form.nombre,
            descripcion: this.form.descripcion,
            activo: this.form.activo
          };
          if (isEstado || isImportancia) {
            payload.icono = this.form.icono;
            payload.color = this.form.color;
          }
          await api.put(`${endpoint}/${this.editingId}`, payload);
          showToast(`✓ ${tipo} actualizado correctamente`, 'success');
        } else {
          // Crear
          console.log(`Creando nuevo ${tipo}:`, this.form.codigo);
          const payload = {
            codigo: this.form.codigo.toLowerCase(),
            nombre: this.form.nombre,
            descripcion: this.form.descripcion
          };
          if (isEstado || isImportancia) {
            payload.icono = this.form.icono;
            payload.color = this.form.color;
          }
          await api.post(endpoint, payload);
          showToast(`✓ ${tipo} creado correctamente`, 'success');
        }

        // Cerrar modal
        const modalEl = document.getElementById('modalEstado');
        const modal = window.bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // Limpiar formulario
        this.form = {};
        this.editingId = null;

        // Recargar
        if (isEstado) {
          await this.cargarEstados();
        } else if (isImportancia) {
          await this.cargarImportancias();
        } else if (isGerencia) {
          await this.cargarGerencias();
        }
      } catch (err) {
        console.error('Error al guardar:', err);
        const mensaje = err.response?.data?.error || err.message;
        showToast('❌ Error: ' + mensaje, 'error');
      } finally {
        this.isSaving = false;
      }
    },

    async desactivarEstado(id) {
      const estado = this.estados.find(e => e.id === id);
      if (!estado) return;

      if (!await confirmAction(`¿Desactivar el estado "${estado.nombre}"?`)) {
        return;
      }

      try {
        this.isSaving = true;
        await api.delete(`/catalogos/estados-reasignados/${id}`);
        showToast(`✓ Estado "${estado.nombre}" desactivado`, 'success');
        await this.cargarEstados();
      } catch (err) {
        console.error('Error:', err);
        showToast('❌ Error: ' + (err.response?.data?.error || err.message), 'error');
      } finally {
        this.isSaving = false;
      }
    },

    async reactivarEstado(id) {
      const estado = this.estados.find(e => e.id === id);
      if (!estado) return;

      if (!await confirmAction(`¿Reactivar el estado "${estado.nombre}"?`)) {
        return;
      }

      try {
        this.isSaving = true;
        await api.put(`/catalogos/estados-reasignados/${id}`, {
          nombre: estado.nombre,
          descripcion: estado.descripcion,
          icono: estado.icono,
          color: estado.color,
          activo: true
        });
        showToast(`✓ Estado "${estado.nombre}" reactivado`, 'success');
        await this.cargarEstados();
      } catch (err) {
        console.error('Error:', err);
        showToast('❌ Error: ' + (err.response?.data?.error || err.message), 'error');
      } finally {
        this.isSaving = false;
      }
    },

    async desactivarImportancia(id) {
      const imp = this.importancias.find(i => i.id === id);
      if (!imp) return;

      if (!await confirmAction(`¿Desactivar la importancia "${imp.nombre}"?`)) {
        return;
      }

      try {
        this.isSaving = true;
        await api.delete(`/catalogos/importancias/${id}`);
        showToast(`✓ Importancia "${imp.nombre}" desactivada`, 'success');
        await this.cargarImportancias();
      } catch (err) {
        console.error('Error:', err);
        showToast('❌ Error: ' + (err.response?.data?.error || err.message), 'error');
      } finally {
        this.isSaving = false;
      }
    },

    async reactivarImportancia(id) {
      const imp = this.importancias.find(i => i.id === id);
      if (!imp) return;

      if (!await confirmAction(`¿Reactivar la importancia "${imp.nombre}"?`)) {
        return;
      }

      try {
        this.isSaving = true;
        await api.put(`/catalogos/importancias/${id}`, {
          nombre: imp.nombre,
          descripcion: imp.descripcion,
          icono: imp.icono,
          color: imp.color,
          activo: true
        });
        showToast(`✓ Importancia "${imp.nombre}" reactivada`, 'success');
        await this.cargarImportancias();
      } catch (err) {
        console.error('Error:', err);
        showToast('❌ Error: ' + (err.response?.data?.error || err.message), 'error');
      } finally {
        this.isSaving = false;
      }
    },

    async desactivarGerencia(id) {
      const gerencia = this.gerencias.find(g => g.id === id);
      if (!gerencia) return;

      if (!await confirmAction(`¿Desactivar la gerencia "${gerencia.nombre}"?`)) {
        return;
      }

      try {
        this.isSaving = true;
        await api.delete(`/catalogos/gerencias/${id}`);
        showToast(`✓ Gerencia "${gerencia.nombre}" desactivada`, 'success');
        await this.cargarGerencias();
      } catch (err) {
        console.error('Error:', err);
        showToast('❌ Error: ' + (err.response?.data?.error || err.message), 'error');
      } finally {
        this.isSaving = false;
      }
    },

    async reactivarGerencia(id) {
      const gerencia = this.gerencias.find(g => g.id === id);
      if (!gerencia) return;

      if (!await confirmAction(`¿Reactivar la gerencia "${gerencia.nombre}"?`)) {
        return;
      }

      try {
        this.isSaving = true;
        await api.put(`/catalogos/gerencias/${id}`, {
          nombre: gerencia.nombre,
          descripcion: gerencia.descripcion,
          activo: true
        });
        showToast(`✓ Gerencia "${gerencia.nombre}" reactivada`, 'success');
        await this.cargarGerencias();
      } catch (err) {
        console.error('Error:', err);
        showToast('❌ Error: ' + (err.response?.data?.error || err.message), 'error');
      } finally {
        this.isSaving = false;
      }
    }
  }
};
</script>

<style scoped>
.page-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1rem;
}

.nav-tabs .nav-link {
  color: #666;
  border-bottom: 2px solid #ddd;
}

.nav-tabs .nav-link.active {
  color: #007bff;
  border-bottom: 2px solid #007bff;
  background: none;
}

.nav-tabs .nav-link:hover {
  color: #007bff;
}

.card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  border-radius: 8px 8px 0 0;
  border: none;
  font-weight: 500;
}

.table-hover tbody tr:hover {
  background-color: #f5f5f5;
}

code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  color: #d63384;
}

/* Table wrapper para mejor scroll */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-wrapper::-webkit-scrollbar {
  height: 6px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.w-md-auto {
  width: auto !important;
}

.pagination {
  flex-wrap: wrap;
  gap: 0.25rem;
}

.pagination .page-link {
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
}

/* Responsive styles */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .table {
    font-size: 0.85rem;
  }

  .table thead th {
    padding: 0.5rem 0.35rem !important;
    font-size: 0.8rem;
  }

  .table td {
    padding: 0.4rem 0.35rem !important;
  }

  .btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }

  .card {
    margin-bottom: 1rem;
  }

  .card-header {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .pagination .page-link {
    padding: 0.35rem 0.5rem;
    font-size: 0.75rem;
  }
}

@media (max-width: 576px) {
  .page-title {
    font-size: 1.25rem;
  }

  .table {
    font-size: 0.7rem;
  }

  .table thead th {
    padding: 0.35rem 0.2rem !important;
    font-size: 0.65rem;
  }

  .table td {
    padding: 0.3rem 0.2rem !important;
    word-break: break-word;
  }

  .btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }

  .btn-sm {
    padding: 0.2rem 0.4rem;
    font-size: 0.65rem;
  }

  .btn-group-sm > .btn {
    padding: 0.2rem 0.3rem;
  }

  .form-control {
    font-size: 16px;
    padding: 0.5rem 0.75rem;
  }

  .form-select {
    font-size: 0.9rem;
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .card {
    margin-bottom: 0.75rem;
    border-radius: 6px;
  }

  .card-header {
    padding: 0.75rem;
    font-size: 0.95rem;
  }

  .card-body {
    padding: 0.75rem;
  }

  .text-muted {
    font-size: 0.8rem;
  }

  h3, h4, h5 {
    font-size: 1rem;
  }

  .modal-dialog {
    margin: 0.5rem;
  }

  .pagination .page-link {
    padding: 0.3rem 0.4rem;
    font-size: 0.7rem;
  }

  .row > .col-auto {
    width: 100%;
  }

  .col-md {
    width: 100%;
  }
}

/* Optimización para zoom - Mantener compacto */
.table {
  table-layout: fixed;
  width: 100%;
  font-size: 0.7rem;
}

.table th,
.table td {
  padding: 0.35rem 0.3rem !important;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

.table-wrapper {
  max-width: 100%;
  overflow-x: auto;
  max-height: 60vh;
  overflow-y: auto;
}
</style>
