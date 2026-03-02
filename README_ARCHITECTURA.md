# Sistema de Asignación de Memos v2 - Guía de Arquitectura y Despliegue

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tecnologías](#tecnologías)
4. [Requisitos del Servidor](#requisitos-del-servidor)
5. [Instalación Completa](#instalación-completa)
6. [Configuración](#configuración)
7. [Despliegue en Producción](#despliegue-en-producción)
8. [Seguridad](#seguridad)
9. [Monitoreo y Logs](#monitoreo-y-logs)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visión General

**Sistema de Asignación de Memos v2** es una plataforma empresarial moderna para la gestión integral de documentos y memos corporativos.

### Objetivos Principales

- 📄 Centralizar la gestión de documentos corporativos
- 👤 Automatizar el flujo de asignación de tareas
- 📧 Notificaciones automáticas y recordatorios
- 📊 Análisis y reportes en tiempo real
- 🔐 Autenticación empresarial con SSO/LDAP

### Funcionalidades Clave

- ✅ Gestión de documentos (reasignados, tareas, enviados)
- ✅ Autenticación centralizada con Keycloak
- ✅ Carga masiva desde archivos Excel
- ✅ Notificaciones automáticas programadas
- ✅ Dashboard interactivo con gráficos
- ✅ Sistema de comentarios y trazabilidad
- ✅ Exportación de reportes en Excel
- ✅ Control de acceso basado en roles (RBAC)

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENTES (Browsers)                       │
│              Chrome, Firefox, Safari, Edge (HTTPS)                │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Vue 3 + Vite)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  • Aplicación de una página (SPA)                         │ │
│  │  • Componentes Vue 3 + Tailwind CSS                       │ │
│  │  • Gestión de estado con Pinia                            │ │
│  │  • Enrutamiento con Vue Router                            │ │
│  │  • Visualización con Chart.js                             │ │
│  │  • Autenticación con Keycloak-js                          │ │
│  │  • HTTP client con Axios                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│  Puerto: 80 (HTTP) / 443 (HTTPS) en producción                  │
└─────────────────────────────┬──────────────────────────────────┘
                              │ REST API (HTTP/HTTPS)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  • Endpoints REST API                                     │ │
│  │  • Middleware de autenticación (Keycloak)                 │ │
│  │  • Gestión de subida de archivos (Multer)                 │ │
│  │  • Procesamiento de Excel (XLSX)                          │ │
│  │  • Envío de emails (Nodemailer)                           │ │
│  │  • Tareas programadas (Node-cron)                         │ │
│  │  • Gestión de sesiones y CORS                             │ │
│  │  • Lógica de negocio                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│  Puerto: 3000 (interno/externo)                                 │
└─────────────────────────────┬──────────────────────────────────┘
      │                       │                      │
      ▼                       ▼                      ▼
┌──────────────┐        ┌──────────────┐      ┌─────────────────┐
│  MySQL 5.7+  │        │  Keycloak    │      │  SMTP Server    │
│ Base de Datos│        │  SSO (IAM)   │      │  (Correo)       │
│  Puerto 3306 │        │  Puerto 8080 │      │  Puerto 587/465 │
└──────────────┘        └──────────────┘      └─────────────────┘
```

### Flow de Autenticación

```
1. Usuario accede a la aplicación
              │
              ▼
2. Keycloak-js redirige a Keycloak (SSO)
              │
              ▼
3. Usuario se autentica en red corporativa (LDAP/AD)
              │
              ▼
4. Keycloak emite JWT Token
              │
              ▼
5. Frontend almacena token y lo envía en cada request
              │
              ▼
6. Backend valida token con Keycloak Connect
              │
              ▼
7. Se otorga acceso basado en rol del usuario
```

---

## 🛠️ Tecnologías Utilizadas

### Backend (Node.js/Express)

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Node.js** | 16+ | Runtime JavaScript |
| **Express.js** | 4.18+ | Framework web REST API |
| **MySQL** (mysql2) | 3.3+ | Base de datos relacional |
| **Keycloak Connect** | 26.1+ | Autenticación SSO/LDAP |
| **Nodemailer** | 8.0+ | Servicio de correos SMTP |
| **Node-cron** | 4.2+ | Planificador de tareas |
| **Multer** | 1.4+ | Gestión de uploads |
| **XLSX** | 0.18+ | Procesamiento Excel |
| **CORS** | 2.8+ | Control de acceso |
| **Dotenv** | 17.3+ | Variables de entorno |

### Frontend (Vue.js)

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Vue.js** | 3.4+ | Framework JavaScript |
| **Vite** | 5.0+ | Build tool |
| **Vue Router** | 4.2+ | Enrutamiento |
| **Pinia** | 3.0+ | State management |
| **Axios** | 1.4+ | HTTP client |
| **Keycloak-js** | 26.2+ | SDK autenticación |
| **Chart.js** | 4.5+ | Gráficos |
| **Tailwind CSS** | 3.4+ | Framework CSS |
| **ExcelJS** | 4.4+ | Exportación Excel |

### Infraestructura

| Servicio | Puerto | Descripción |
|---------|--------|-------------|
| **MySQL** | 3306 | Base de datos |
| **Keycloak** | 8080 | Autenticación IAM |
| **SMTP** | 587/465 | Servidor correo |

---

## 🖥️ Requisitos del Servidor

### Recursos Mínimos (Desarrollo/Testing)

```yaml
CPU:     2 cores
RAM:     4 GB
Disco:   10 GB SSD
Conexión: Acceso a internet
SO:      Linux/Windows/macOS
```

### Recursos Recomendados (Producción)

```yaml
CPU:     4 cores (2.0+ GHz)
RAM:     8-16 GB
Disco:   50 GB+ SSD
Conexión: Dedicada + SSL/TLS
SO:      Linux (Ubuntu 20.04 LTS+)
Backup:  Estrategia externa configurada
Monitor: Alertas y logging
```

### Sistemas Operativos Soportados

- ✅ **Linux**: Ubuntu 20.04 LTS, CentOS 8+, Debian 11+
- ✅ **Windows**: Windows Server 2019 / 2022
- ✅ **macOS**: v11+ (solo desarrollo)

### Puertos Requeridos

| Servicio | Puerto | Protocolo | Acceso |
|---------|--------|-----------|--------|
| Frontend | 80 | HTTP | Externo |
| Frontend | 443 | HTTPS | Externo |
| Backend API | 3000 | HTTP | Interno/Externo |
| MySQL | 3306 | TCP | Interno |
| Keycloak | 8080 | HTTP | Interno/Externo |
| SMTP | 587 | TLS | Externo |
| SMTP | 465 | SSL | Externo |

### Dependencias del Sistema

**Ubuntu/Debian:**
```bash
sudo apt-get update && apt-get install -y \
  build-essential curl wget git unzip ca-certificates \
  mysql-server mysql-client \
  nodejs npm \
  default-jdk \
  openssl
```

**CentOS/RHEL:**
```bash
sudo yum groupinstall -y 'Development Tools'
sudo yum install -y \
  curl wget git unzip \
  mysql-server mysql \
  nodejs npm \
  java-11-openjdk \
  openssl
```

**Windows Server:**
```powershell
# Usar Chocolatey
choco install nodejs mysql git -y

# O descargar manualmente:
# - Node.js desde nodejs.org
# - MySQL desde mysql.com
# - Git desde git-scm.com
```

---

## 📦 Instalación Paso a Paso

### Fase 1: Preparación del Servidor

**1. Clonar repositorio:**
```bash
cd /opt  # o tu ruta preferida
git clone https://github. com/ALEX5897/Sis_asignacion_de_memos_v2.git
cd Sis_asignacion_de_memos_v2
```

**2. Crear estructura de directorios:**
```bash
mkdir -p /opt/sistra/{logs,backups,uploads}
chmod -R 755 /opt/sistra
```

### Fase 2: Configuración de Base de Datos

**1. Crear base de datos:**
```sql
-- Conectar como root
mysql -u root -p

-- Crear base de datos
CREATE DATABASE seguimiento_v2 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Crear usuario específico
CREATE USER 'sistra_user'@'localhost' 
  IDENTIFIED BY 'contraseña_segura_fuerte_aqui';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON seguimiento_v2.* 
  TO 'sistra_user'@'localhost';
FLUSH PRIVILEGES;
```

**2. Ejecutar migraciones:**
```bash
cd /opt/sistra/backend
npm install
npm run migrate
```

### Fase 3: Configuración de Backend

**1. Instalar dependencias:**
```bash
cd /opt/sistra/backend
npm ci --only=production
```

**2. Crear archivo `.env`:**
```bash
cp .env.example .env
nano .env
```

**3. Contenido de `.env` para Producción:**

```env
# ===== BASE DE DATOS =====
DB_HOST=localhost
DB_USER=sistra_user
DB_PASS=contraseña_segura_fuerte_aqui
DB_NAME=seguimiento_v2
DB_POOL_SIZE=20
DB_POOL_TIMEOUT=30000

# ===== SERVIDOR =====
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# ===== CORREO SMTP =====
# Para Outlook/Office365
MAIL_HOST=outlook.office365.com
MAIL_PORT=587
MAIL_USER=sistra@empresa.com
MAIL_PASS=contraseña_aplicacion
MAIL_FROM="Sistema Memos <sistra@empresa.com>"
MAIL_TIMEOUT=10000

# ===== NOTIFICACIONES (CRON) =====
CRON_SCHEDULE=0 8 * * *
CRON_ENABLED=true
TIMEZONE=America/Argentina/Buenos_Aires

# ===== KEYCLOAK (SSO/LDAP) =====
KEYCLOAK_ENABLED=true
KEYCLOAK_URL=https://auth.empresa.com
KEYCLOAK_REALM=empresa
KEYCLOAK_CLIENT_ID=sistra-app
KEYCLOAK_CLIENT_SECRET=secret_aqui
KEYCLOAK_TIMEOUT=10000

# ===== SEGURIDAD =====
CORS_ORIGIN=https://memos.empresa.com
SESSION_SECRET=generado_con_openssl_rand
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# ===== LOGS =====
LOG_FILE=/opt/sistra/logs/backend.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=14
```

### Fase 4: Configuración de Frontend

**1. Instalar dependencias:**
```bash
cd /opt/sistra/frontend
npm ci --only=production
```

**2. Compilar para producción:**
```bash
npm run build
# Genera carpeta dist/
```

**3. Variables de entorno (si es necesario):**
```bash
cat > .env.production << EOF
VITE_API_URL=https://api.empresa.com
VITE_API_TIMEOUT=30000
VITE_KEYCLOAK_ENABLED=true
VITE_KEYCLOAK_URL=https://auth.empresa.com
VITE_KEYCLOAK_REALM=empresa
VITE_KEYCLOAK_CLIENT_ID=sistra-app
EOF
```

---

## 🚀 Despliegue en Producción

### Opción 1: Nginx + PM2 (RECOMENDADO)

**1. Instalar Nginx y PM2:**
```bash
# Nginx
sudo apt-get install -y nginx

# PM2
npm install -g pm2
```

**2. Configurar Nginx:**
```bash
sudo tee /etc/nginx/sites-available/sistra << 'EOF'
upstream api_backend {
    server localhost:3000;
    keepalive 120;
}

server {
    listen 80;
    server_name memos.empresa.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name memos.empresa.com;

    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/memos.empresa.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/memos.empresa.com/privkey.pem;
    
    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/sistra_access.log;
    error_log /var/log/nginx/sistra_error.log;

    # Frontend (SPA)
    location / {
        root /opt/sistra/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 30d;
    }

    # API Backend
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
```

**3. Habilitar sitio:**
```bash
sudo ln -s /etc/nginx/sites-available/sistra /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

**4. Obtener certificado SSL (Let's Encrypt):**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d memos.empresa.com
```

**5. Iniciar Backend con PM2:**
```bash
cd /opt/sistra/backend
pm2 start "npm start" --name "sistra-api"
pm2 restart sistra-api
pm2 save
pm2 startup
```

### Opción 2: Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0-alpine
    environment:
      MYSQL_DATABASE: seguimiento_v2
      MYSQL_USER: sistra_user
      MYSQL_PASSWORD: contraseña_segura
      MYSQL_ROOT_PASSWORD: root_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/migrations:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  backend:
    build: ./backend
    environment:
      DB_HOST: mysql
      DB_USER: sistra_user
      DB_PASS: contraseña_segura
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    restart: unless-stopped

volumes:
  mysql_data:
```

**Ejecutar:**
```bash
docker-compose up -d
docker-compose ps
```

---

## 🔒 Seguridad

### Checklist Pre-Producción

- [ ] Cambiar todas las credenciales por defecto
- [ ] Configurar SSL/TLS con certificados válidos
- [ ] Implementar autenticación SSO (Keycloak)
- [ ] Configurar firewall adecuadamente
- [ ] Habilitar logging y auditoría
- [ ] Configurar backups automáticos
- [ ] Implementar rate limiting
- [ ] Validar y sanitizar todas las entradas
- [ ] Configurar CORS solo para dominios autorizados
- [ ] Implementar monitoreo y alertas

### Contraseñas Seguras

```bash
# Generar contraseña segura
openssl rand -base64 32

# Ejemplo: zK7+mP2jL9qR4vS8bX1cY5wN3fD6hG0jK
```

### Configuración Firewall (ufw)

```bash
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Backend (si es necesario)
sudo ufw status
```

---

## 👀 Monitoreo y Logs

### Logs Principales

```bash
# Backend (PM2)
pm2 logs sistra-api
tail -f /opt/sistra/logs/backend.log

# Nginx
tail -f /var/log/nginx/sistra_access.log
tail -f /var/log/nginx/sistra_error.log

# MySQL
tail -f /var/log/mysql/error.log

# Sistema
journalctl -u nginx -f
journalctl -u mysql -f
```

### Monitoreo con PM2

```bash
pm2 show sistra-api
pm2 monit
pm2 logs sistra-api --err
```

### Métricas Importantes

```bash
# Uso de recursos
top
htop

# Conexiones MySQL
mysql -u sistra_user -p -e "SHOW PROCESSLIST;"

# Espacio en disco
df -h
du -sh /opt/sistra

# Conexiones de red
netstat -tulpn | grep nodejs
```

---

## 🔧 Troubleshooting

### Error: "Connection refused" a MySQL

```bash
# Verificar estado
sudo systemctl status mysql

# Iniciar si está parado
sudo systemctl start mysql

# Verificar puerto
sudo netstat -tulpn | grep :3306

# Verificar credenciales
mysql -u sistra_user -p -h localhost seguimiento_v2
```

### Error: "Port 3000 already in use"

```bash
# Encontrar proceso
lsof -i :3000

# Matar proceso
kill -9 <PID>

# O cambiar puerto en .env
PORT=3001
```

### Error: "Cannot find module"

```bash
# Limpiar e instalar
rm -rf node_modules package-lock.json
npm ci --only=production
```

### Performance Lento

```bash
# Optimizar base de datos
mysql -u sistra_user -p -e "OPTIMIZE TABLE seguimiento_v2.*;"

# Aumentar connection pool
DB_POOL_SIZE=30

# Limpiar logs antiguos
find /opt/sistra/logs -mtime +30 -delete
```

---

## 📊 Estructura de Base de Datos

### Tablas principales

```sql
-- Documentos reasignados
CREATE TABLE reasignados (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  document_number VARCHAR(255),
  sender VARCHAR(255),
  recipient VARCHAR(255),
  subject TEXT,
  date DATETIME,
  status VARCHAR(100),
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_date (date)
);

-- Tareas
CREATE TABLE tareas (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  description TEXT,
  due_date DATETIME,
  assigned_to VARCHAR(255),
  status VARCHAR(100),
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
);

-- Comentarios
CREATE TABLE comentarios (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tarea_id BIGINT,
  usuario_id BIGINT,
  contenido TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tarea_id) REFERENCES tareas(id),
  INDEX idx_tarea (tarea_id)
);
```

---

## 📞 Soporte y Contacto

- **Email técnico**: desarrollo@empresa.com
- **Chat**: Slack #sistra-devops
- **Issues**: GitHub Issues
- **Documentación**: Wiki del proyecto

---

**Versión**: 2.0.0 | **Última actualización**: Marzo 2026
