import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import Login from '../pages/Login.vue'
import Reasignados from '../pages/Reasignados.vue'
import Tareas from '../pages/Tareas.vue'
import Enviados from '../pages/Enviados.vue'
import Dashboard from '../pages/Dashboard.vue'
import ReportReasignados from '../pages/ReportReasignados.vue'
import ReportTareas from '../pages/ReportTareas.vue'
import AdminUsers from '../pages/AdminUsers.vue'
import KeycloakCallback from '../pages/KeycloakCallback.vue'
import Notificaciones from '../pages/Notificaciones.vue'

const publicRoutes = ['/login', '/auth/callback']
let verificacionInicial = false

const routes = [
  { path: '/login', component: Login, meta: { requiereAuth: false } },
  { path: '/auth/callback', component: KeycloakCallback, meta: { requiereAuth: false } },
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: Dashboard, meta: { requiereAuth: true } },
  { path: '/reasignados', component: Reasignados, meta: { requiereAuth: true } },
  { path: '/tareas', component: Tareas, meta: { requiereAuth: true } },
  { path: '/enviados', component: Enviados, meta: { requiereAuth: true } },
  { path: '/notificaciones', component: Notificaciones, meta: { requiereAuth: true } },
  { path: '/reportes/reasignados', component: ReportReasignados, meta: { requiereAuth: true } },
  { path: '/reportes/tareas', component: ReportTareas, meta: { requiereAuth: true } },
  { path: '/admin/usuarios', component: AdminUsers, meta: { requiereAuth: true, requiereAdmin: true } },
]

const router = createRouter({ 
  history: createWebHistory(), 
  routes 
})

/**
 * Guardián de rutas para proteger páginas autenticadas
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiereAuth = to.meta.requiereAuth !== false
  const isPublicRoute = publicRoutes.includes(to.path)

  // Solo verificar el usuario una sola vez al inicio, y NO en rutas públicas (como /auth/callback)
  if (!verificacionInicial && !isPublicRoute && !authStore.usuario) {
    verificacionInicial = true
    await authStore.fetchUser()
  }

  const requiereAdmin = to.meta.requiereAdmin === true

  // Si la ruta requiere autenticación y el usuario no está autenticado
  if (requiereAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  // Si la ruta requiere admin y el usuario no es admin
  if (requiereAdmin && !authStore.isAdmin) {
    return next('/')
  }

  // Si el usuario está autenticado y trata de ir a login, redirigir al dashboard
  if (isPublicRoute && authStore.isAuthenticated && to.path === '/login') {
    return next('/dashboard')
  }

  next()
})

export default router
