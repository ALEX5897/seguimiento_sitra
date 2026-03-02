<template>
  <div>
    <label :for="inputId" class="form-label fw-bold">{{ label }} <span class="text-danger" v-if="required">*</span></label>
    <div class="input-group">
      <input
        :id="inputId"
        type="text"
        class="form-control"
        :placeholder="placeholder"
        :value="selectedNombre"
        @input="onInput"
        @focus="showSugerencias = true"
        @blur="onBlur"
        autocomplete="off"
      />
      <button
        v-if="selectedNombre"
        class="btn btn-outline-secondary"
        type="button"
        @click="limpiar"
        title="Limpiar selección"
      >
        ✕
      </button>
    </div>

    <!-- Dropdown de sugerencias -->
    <div
      v-if="showSugerencias && (sugerencias.length > 0 || usuariosActivos.length > 0)"
      class="list-group mt-1"
      style="position: absolute; z-index: 1000; max-width: 100%; width: 100%;"
    >
      <!-- Sugerencias por búsqueda -->
      <button
        v-for="usuario in sugerencias"
        :key="`s-${usuario.id}`"
        type="button"
        class="list-group-item list-group-item-action text-start py-2"
        @click="seleccionar(usuario)"
      >
        <div class="fw-bold">{{ usuario.nombre }}</div>
        <small class="text-muted">{{ usuario.cargo }} • {{ usuario.gerencia }}</small>
      </button>

      <!-- Divider si hay muchos usuarios -->
      <li v-if="sugerencias.length === 0 && usuariosActivos.length > 0" class="list-group-item disabled" style="padding: 4px 8px;">
        <small>Todos los usuarios:</small>
      </li>

      <!-- Todos los usuarios activos -->
      <button
        v-for="usuario in usuariosActivos"
        :key="`u-${usuario.id}`"
        v-show="sugerencias.length === 0"
        type="button"
        class="list-group-item list-group-item-action text-start py-2"
        @click="seleccionar(usuario)"
      >
        <div class="fw-bold">{{ usuario.nombre }}</div>
        <small class="text-muted">{{ usuario.cargo }} • {{ usuario.gerencia }}</small>
      </button>
    </div>

    <!-- Información del usuario seleccionado -->
    <div v-if="usuarioSeleccionado" class="alert alert-info mt-2 py-2 px-3 mb-0">
      <small>
        <strong>{{ usuarioSeleccionado.nombre }}</strong> • {{ usuarioSeleccionado.cargo }} •
        {{ usuarioSeleccionado.gerencia }} • 📧 {{ usuarioSeleccionado.correo }}
      </small>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  props: {
    modelValue: String,
    selectedUserId: { type: [Number, String], default: null },
    label: { type: String, default: 'Seleccionar Usuario' },
    placeholder: { type: String, default: 'Busca por nombre...' },
    required: { type: Boolean, default: false },
    inputId: { type: String, default: 'usuario-selector' },
    enforceSelection: { type: Boolean, default: true }
  },
  
  data() {
    return {
      selectedNombre: this.modelValue || '',
      usuariosActivos: [],
      sugerencias: [],
      usuarioSeleccionado: null,
      showSugerencias: false,
      terminoBusqueda: ''
    };
  },

  watch: {
    modelValue(newVal) {
      this.selectedNombre = newVal || '';
    },
    selectedUserId() {
      this.setSeleccionadoPorId();
    }
  },

  mounted() {
    this.cargarUsuarios();
    document.addEventListener('click', this.cerrarSugerencias);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.cerrarSugerencias);
  },

  methods: {
    async cargarUsuarios() {
      try {
        const response = await api.get('/usuarios/activos/lista');
        this.usuariosActivos = response.data || [];
        this.setSeleccionadoPorId();
      } catch (error) {
        console.error('Error cargando usuarios:', error);
      }
    },

    setSeleccionadoPorId() {
      if (!this.selectedUserId || !this.usuariosActivos.length) return;
      const id = Number(this.selectedUserId);
      const encontrado = this.usuariosActivos.find(u => Number(u.id) === id);
      if (encontrado) {
        this.seleccionar(encontrado);
      }
    },

    async onInput(event) {
      this.selectedNombre = event.target.value;
      this.terminoBusqueda = event.target.value.trim();
      this.usuarioSeleccionado = null;

      if (this.terminoBusqueda.length >= 2) {
        await this.buscarUsuarios();
      } else if (this.terminoBusqueda.length === 0) {
        this.sugerencias = [];
      }

      this.$emit('update:modelValue', this.selectedNombre);
      this.$emit('usuarioSeleccionado', null);
    },

    async buscarUsuarios() {
      try {
        const response = await api.get(`/usuarios/buscar/${encodeURIComponent(this.terminoBusqueda)}`);
        this.sugerencias = response.data || [];
      } catch (error) {
        console.error('Error buscando usuarios:', error);
        this.sugerencias = [];
      }
    },

    seleccionar(usuario) {
      this.selectedNombre = usuario.nombre;
      this.usuarioSeleccionado = usuario;
      this.showSugerencias = false;
      this.sugerencias = [];

      this.$emit('update:modelValue', usuario.nombre);
      this.$emit('usuarioSeleccionado', usuario);
    },

    limpiar() {
      this.selectedNombre = '';
      this.usuarioSeleccionado = null;
      this.sugerencias = [];
      this.$emit('update:modelValue', '');
      this.$emit('usuarioSeleccionado', null);
    },

    onBlur() {
      setTimeout(() => {
        if (this.enforceSelection && this.selectedNombre && !this.usuarioSeleccionado) {
          const nombre = this.selectedNombre.toLowerCase().trim();
          const match = this.usuariosActivos.find(u => (u.nombre || '').toLowerCase().trim() === nombre);
          if (match) {
            this.seleccionar(match);
          } else {
            this.limpiar();
          }
        }
        this.showSugerencias = false;
      }, 200);
    },

    cerrarSugerencias(event) {
      if (!this.$el.contains(event.target)) {
        this.showSugerencias = false;
      }
    }
  }
};
</script>

<style scoped>
.info-group {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.info-group:last-child {
  border-bottom: none;
}

.list-group {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.list-group-item {
  border: none;
  border-bottom: 1px solid #eee;
}

.list-group-item:last-child {
  border-bottom: none;
}

.list-group-item:hover {
  background-color: #f8f9fa;
  cursor: pointer;
}

.input-group .form-control:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.alert {
  background-color: #e7f3ff;
  border-color: #b3d9ff;
}
</style>
