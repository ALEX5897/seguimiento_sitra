# Sistema de Asignación de Memos v2

Sistema empresarial para la gestión integral, seguimiento y asignación automática de documentos (memos) corporativos.

## 📋 Documentación

- **[Guía de Arquitectura y Despliegue](README_ARCHITECTURA.md)** ← Equipo de Arquitectura/DevOps
- **[Manual de Usuario](GUIA_USUARIOS_DOCUMENTOS.md)** ← Usuarios finales  
- **[Guía de Notificaciones](NOTIFICACIONES.md)** ← Configuración de emails
- **[Acceso Remoto](ACCESO_REMOTO.md)** ← Conexión a servidor
- **[FAQ](FAQ.md)** ← Preguntas frecuentes

---

## 🚀 Características Principales

✅ **Gestión de Documentos** - Reasignación, tareas, seguimiento de enviados
✅ **Autenticación Empresarial** - Keycloak SSO/LDAP integrado
✅ **Notificaciones Automáticas** - Correos programados con Node-cron
✅ **Carga Masiva** - Importar documentos desde Excel con validación
✅ **Dashboard Interactivo** - Gráficos y estadísticas en tiempo real
✅ **Sistema de Comentarios** - Trazabilidad completa de comunicación
✅ **Exportación de Reportes** - Generación de archivos Excel personalizados
✅ **Control de Acceso** - RBAC (Role-Based Access Control)
✅ **Auditoría Completa** - Registro detallado de todas las acciones

---

## 🏗️ Arquitectura

### Componentes Principales

```
Frontend (Vue 3 + Tailwind)
         ↓ REST API
Backend (Node.js + Express)
         ↓
  ├─ MySQL (Base de Datos)
  ├─ Keycloak (Autenticación)
  └─ SMTP (Correos)
```

**Flujo de Datos:**
1. Usuario accede a la interfaz web (SPA Vue 3)
2. Se autentica via Keycloak (SSO corporativo)
3. Frontend consume API REST del Backend
4. Backend procesa lógica y persiste en MySQL
5. Sistema envía notificaciones automáticas por email

---

## 🛠️ Tecnologías

### Backend
- Node.js 16+ con Express.js
- MySQL 5.7+ (Base de datos)
- Keycloak 26+ (Autenticación SSO)
- Nodemailer (Correos SMTP)
- Node-cron (Tareas automáticas)
- Multer (Upload de archivos)
- XLSX (Procesamiento Excel)

### Frontend  
- Vue.js 3.4+ (Framework)
- Vite 5.0+ (Build tool)
- Tailwind CSS (Estilos)
- Pinia (State management)
- Chart.js (Gráficos)
- Axios (HTTP client)

---

## ⚡ Quick Start (Desarrollo)

### 1️⃣ Clonar repositorio
```bash
git clone https://github.com/ALEX5897/Sis_asignacion_de_memos_v2.git
cd Sis_asignacion_de_memos_v2
```

### 2️⃣ Backend
```bash
cd backend
npm install
cp .env.example .env
npm run migrate       # Crear tablas
npm run dev          # Inicia en puerto 3000
```

### 3️⃣ Frontend
```bash
cd frontend
npm install
npm run dev          # Inicia en puerto 5173
```

---

## 📖 Guía Completa de Despliegue

Para equipo de **Arquitectura/DevOps**:

👉 **[Leer Guía de Arquitectura y Despliegue](README_ARCHITECTURA.md)**

Incluye:
- Requisitos del servidor
- Instalación paso a paso
- Configuración de variables de entorno
- Despliegue con Nginx + PM2
- Docker Compose
- Configuración SSL/TLS
- Seguridad y hardening
- Monitoreo y logs
- Troubleshooting

---

## 🔐 Seguridad

- ✅ Autenticación centralizada con Keycloak
- ✅ Variables de entorno protegidas
- ✅ SSL/TLS en producción
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Validación de entrada
- ✅ Logging de auditoría

---

## 📦 Variables de Entorno Principales

Archivo `.env` del backend (ver `backend/.env.example`):

```env
# Base de Datos
DB_HOST=localhost
DB_USER=sistra_user
DB_PASS=contraseña_segura
DB_NAME=seguimiento_v2

# Servidor
PORT=3000
NODE_ENV=production

# Correo SMTP (Outlook/Office365)
MAIL_HOST=outlook.office365.com
MAIL_PORT=587
MAIL_USER=sistra@empresa.com
MAIL_PASS=contraseña_app

# Notificaciones
CRON_SCHEDULE=0 8 * * *
TIMEZONE=America/Argentina/Buenos_Aires

# Keycloak
KEYCLOAK_ENABLED=true
KEYCLOAK_URL=https://auth.empresa.com
KEYCLOAK_REALM=empresa
KEYCLOAK_CLIENT_ID=sistra-app
KEYCLOAK_CLIENT_SECRET=secret
```

---

## 📊 Estructura del Proyecto

```
.
├── backend/                    # API REST (Node.js/Express)
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/            # Endpoints
│   │   ├── services/          # Lógica de negocio
│   │   ├── middleware/        # Autenticación
│   │   └── helpers/
│   ├── migrations/            # Scripts SQL
│   ├── .env.example
│   └── package.json
│
├── frontend/                   # SPA Vue 3
│   ├── src/
│   │   ├── components/        # Componentes Vue
│   │   ├── pages/             # Vistas
│   │   ├── stores/            # Pinia (state)
│   │   ├── router/            # Vue Router
│   │   ├── services/          # HTTP requests
│   │   └── utils/
│   ├── index.html
│   └── package.json
│
├── doc/                        # Documentación
├── README.md                   # Este archivo
├── README_ARCHITECTURA.md      # Guía de arquitectura
└── .gitignore
```

---

## 📌 Endpoints Principales de la API

```
Documentos:
  GET    /api/reasignados              - Listar documentos
  POST   /api/reasignados              - Crear documento
  PUT    /api/reasignados/:id          - Actualizar
  DELETE /api/reasignados/:id          - Eliminar
  POST   /api/reasignados/upload       - Carga masiva Excel

Tareas:
  GET    /api/tareas                   - Listar tareas
  POST   /api/tareas                   - Crear tarea
  PUT    /api/tareas/:id               - Actualizar
  DELETE /api/tareas/:id               - Eliminar

Estadísticas:
  GET    /api/estadisticas/dashboard   - Dashboard
  GET    /api/estadisticas/por-estado  - Por estado
  GET    /api/estadisticas/usuarios    - Por usuario

Autenticación:
  POST   /api/auth/login               - Iniciar sesión
  POST   /api/auth/logout              - Cerrar sesión
```

---

## 🆘 Troubleshooting Rápido

**Error de conexión a MySQL:**
```bash
mysql -u sistra_user -p -h localhost seguimiento_v2
```

**Puerto 3000 ocupado:**
```bash
lsof -i :3000
kill -9 <PID>
```

**Instalar dependencias limpias:**
```bash
npm ci --only=production
npm run migrate
```

Más ayuda → [Ver README_ARCHITECTURA.md](README_ARCHITECTURA.md)

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -am 'Agregar feature'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Pull Request

---

## 📄 Licencia

Proyecto privado - Uso interno autorizado únicamente.

---

## 👥 Equipo

- **Desarrollador Principal**: ALEX5897
- **Arquitectura & DevOps**: Infraestructura
- **Soporte**: desarrollo@empresa.com

---

**Versión**: 2.0.0 | **Última actualización**: Marzo 2026 | **Estado**: ✅ Producción
