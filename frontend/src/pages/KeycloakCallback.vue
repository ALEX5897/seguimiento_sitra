<template>
  <div class="callback-container">
    <div class="callback-box">
      <div class="spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <h2>{{ mensaje }}</h2>
      <p v-if="error" class="error-message">
        <i class="fas fa-exclamation-triangle"></i> {{ error }}
      </p>
      <p v-else class="info-message">Por favor espera mientras completamos tu autenticación...</p>
      <div v-if="debug" class="debug-info">
        <p><small>Status: {{ status }}</small></p>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/authStore'

export default {
  name: 'KeycloakCallback',
  data() {
    return {
      mensaje: 'Completando autenticación...',
      error: null,
      status: 'iniciando',
      debug: true,
      intentos: 0,
      maxIntentos: 5
    }
  },
  async mounted() {
    this.status = 'mounted'
    console.log('🔄 KeycloakCallback montado, iniciando procesamiento...')
    
    // Esperar un poco para asegurar que la sesión esté completamente guardada en el servidor
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await this.procesarCallback()
  },
  methods: {
    async procesarCallback() {
      try {
        this.status = 'verificando_sesion'
        console.log('🔍 Verificando sesión del usuario...')
        
        const authStore = useAuthStore()
        
        // Intentar obtener el usuario varias veces
        while (this.intentos < this.maxIntentos) {
          this.intentos++
          this.status = `intento_${this.intentos}/${this.maxIntentos}`
          
          try {
            console.log(`📋 Intento ${this.intentos}: Llamando a /api/auth/usuario`)
            
            const response = await fetch('/api/auth/usuario', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            })

            console.log(`📡 Respuesta del servidor: ${response.status}`)
            
            if (response.ok) {
              const data = await response.json()
              console.log('✅ Usuario obtenido:', data.usuario)
              
              // Actualizar el store
              authStore.usuario = data.usuario
              authStore.isAuthenticated = true
              authStore.permisos = data.usuario?.permisos || {}
              
              this.mensaje = '¡Autenticación exitosa!'
              this.status = 'exito'
              console.log('👤 Usuario autenticado correctamente')
              
              // Redirigir al dashboard después de 1 segundo
              setTimeout(() => {
                console.log('🚀 Redirigiendo a /dashboard')
                this.$router.push('/dashboard')
              }, 1000)
              
              return
            } else if (response.status === 401) {
              console.warn(`⚠️ No autenticado (intento ${this.intentos}/${this.maxIntentos})`)
              
              if (this.intentos < this.maxIntentos) {
                // Esperar e intentar de nuevo
                await new Promise(resolve => setTimeout(resolve, 500))
                continue
              }
            } else {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(`Error HTTP ${response.status}: ${errorData.error || 'Desconocido'}`)
            }
          } catch (fetchError) {
            console.error(`❌ Error en intento ${this.intentos}:`, fetchError.message)
            
            if (this.intentos < this.maxIntentos) {
              await new Promise(resolve => setTimeout(resolve, 500))
              continue
            } else {
              throw fetchError
            }
          }
        }
        
        throw new Error('No se pudo verificar la sesión después de varios intentos')
        
      } catch (err) {
        console.error('❌ Error completo en callback:', err)
        this.mensaje = 'Error en la autenticación'
        this.error = err.message || 'No se pudo completar la autenticación'
        this.status = 'error'
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          console.log('↩️ Redirigiendo a /login')
          this.$router.push('/login?error=callback_failed')
        }, 3000)
      }
    }
  }
}
</script>

<style scoped>
.callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.callback-box {
  background: white;
  border-radius: 15px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 50px 40px;
  text-align: center;
  max-width: 500px;
  width: 90%;
}

.spinner {
  font-size: 48px;
  color: #667eea;
  margin-bottom: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

h2 {
  color: #333;
  margin-bottom: 15px;
  font-size: 24px;
}

.info-message {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.error-message {
  color: #c5504f;
  font-size: 14px;
  line-height: 1.6;
  background: #f8d7da;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
  border: 1px solid #f5c6cb;
}

.debug-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  font-family: monospace;
}

.debug-info p {
  margin: 5px 0;
  color: #999;
  font-size: 12px;
}
</style>
