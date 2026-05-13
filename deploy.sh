#!/bin/bash

################################################################################
# SCRIPT DE DEPLOYMENT - Seguimiento SITRA a Producción
# Servidor: 172.16.1.72
# Directorio: /opt/seguimiento_sitra
# Dominio: seguimientositra.quito-turismo.gob.ec
# Puerto: 3001
################################################################################

set -e

echo "🚀 === DEPLOYMENT SEGUIMIENTO SITRA ==="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
DEPLOY_DIR="/opt/seguimiento_sitra"
BACKEND_DIR="$DEPLOY_DIR/backend"
FRONTEND_DIR="$DEPLOY_DIR/frontend"
NGINX_SITES="/etc/nginx/sites-enabled"

echo -e "${YELLOW}1️⃣ Verificando directorios...${NC}"
if [ ! -d "$DEPLOY_DIR" ]; then
  echo "   ℹ️ Creando $DEPLOY_DIR"
  sudo mkdir -p "$DEPLOY_DIR"
  sudo chown acasa:acasa "$DEPLOY_DIR"
else
  echo "   ✅ Directorio $DEPLOY_DIR existe"
fi

echo ""
echo -e "${YELLOW}2️⃣ Detener servicio anterior (si existe)...${NC}"
if sudo systemctl is-active --quiet seguimiento-sitra; then
  echo "   ⏹️  Deteniendo seguimiento-sitra..."
  sudo systemctl stop seguimiento-sitra
  sleep 2
  echo "   ✅ Servicio detenido"
else
  echo "   ℹ️ Servicio no está activo"
fi

echo ""
echo -e "${YELLOW}3️⃣ Limpiar directorio anterior...${NC}"
if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR)" ]; then
  echo "   🗑️  Respaldando configuración actual..."
  if [ -f "$BACKEND_DIR/.env.production" ]; then
    cp "$BACKEND_DIR/.env.production" /tmp/env.production.backup
  fi
  echo "   Eliminando archivos anteriores..."
  rm -rf "$DEPLOY_DIR"/*
fi

echo ""
echo -e "${YELLOW}4️⃣ Copiar archivos del proyecto...${NC}"
echo "   📁 Copiando backend..."
cp -r backend "$DEPLOY_DIR/"
echo "   📁 Copiando frontend..."
cp -r frontend "$DEPLOY_DIR/"
echo "   📁 Copiando infraestructura..."
cp -r infra "$DEPLOY_DIR/"
echo "   ✅ Archivos copiados"

echo ""
echo -e "${YELLOW}5️⃣ Configurar .env.production...${NC}"
if [ -f /tmp/env.production.backup ]; then
  echo "   📋 Restaurando .env.production anterior..."
  cp /tmp/env.production.backup "$BACKEND_DIR/.env.production"
else
  echo "   ℹ️ Creando .env.production nuevo..."
  # Copiar si existe en el proyecto
  if [ -f "$BACKEND_DIR/.env.production" ]; then
    echo "   ✅ .env.production ya existe"
  else
    echo "   ⚠️  .env.production no encontrado - usar .env como base"
    cp "$BACKEND_DIR/.env" "$BACKEND_DIR/.env.production"
  fi
fi

echo ""
echo -e "${YELLOW}6️⃣ Instalar dependencias del backend...${NC}"
cd "$BACKEND_DIR"
echo "   📦 npm install..."
npm install --production
echo "   ✅ Dependencias instaladas"

echo ""
echo -e "${YELLOW}7️⃣ Compilar frontend...${NC}"
cd "$FRONTEND_DIR"
echo "   📦 npm install..."
npm install
echo "   🔨 npm run build..."
npm run build
echo "   ✅ Frontend compilado"

echo ""
echo -e "${YELLOW}8️⃣ Configurar Nginx...${NC}"
NGINX_CONF="$NGINX_SITES/siguimiento-sitra.conf"

# Respaldar configuración anterior si existe
if [ -f "$NGINX_CONF" ]; then
  sudo cp "$NGINX_CONF" "$NGINX_CONF.backup"
  echo "   💾 Respaldo de configuración anterior"
fi

# Crear nueva configuración
echo "   ⚙️  Instalando configuración nginx..."
sudo cp "$DEPLOY_DIR/infra/nginx/sitra.conf" "$NGINX_CONF"

# Validar configuración
echo "   🔍 Validando configuración nginx..."
if sudo nginx -t; then
  echo "   ✅ Configuración válida"
  sudo systemctl reload nginx
  echo "   ✅ Nginx recargado"
else
  echo -e "${RED}   ❌ Error en configuración nginx${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}9️⃣ Instalar servicio systemd...${NC}"
SYSTEMD_SERVICE="/etc/systemd/system/seguimiento-sitra.service"
echo "   📋 Instalando servicio..."
sudo cp "$DEPLOY_DIR/infra/systemd/seguimiento-sitra.service" "$SYSTEMD_SERVICE"
sudo systemctl daemon-reload
echo "   ✅ Servicio instalado"

echo ""
echo -e "${YELLOW}🔟 Iniciar servicio...${NC}"
echo "   🚀 Iniciando seguimiento-sitra..."
sudo systemctl start seguimiento-sitra
sleep 3

# Verificar si está corriendo
if sudo systemctl is-active --quiet seguimiento-sitra; then
  echo "   ✅ Servicio está activo"
else
  echo -e "${RED}   ❌ Error: Servicio no está activo${NC}"
  echo "   Logs:"
  sudo journalctl -u seguimiento-sitra -n 20
  exit 1
fi

# Auto-iniciar en el boot
echo "   ⚙️  Configurando auto-inicio..."
sudo systemctl enable seguimiento-sitra
echo "   ✅ Auto-inicio configurado"

echo ""
echo -e "${YELLOW}1️⃣1️⃣ Verificar estado...${NC}"
echo ""
echo -e "${GREEN}✅ DEPLOYMENT COMPLETADO${NC}"
echo ""
echo "📊 Resumen:"
echo "   🌐 Dominio: https://seguimientositra.quito-turismo.gob.ec"
echo "   🔌 Puerto Node: 3001"
echo "   📂 Directorio: /opt/seguimiento_sitra"
echo "   🗄️  Base de datos: 172.16.1.80:3306 (seguimiento_sitra)"
echo "   🔄 Servicio: seguimiento-sitra (systemd)"
echo ""
echo "Comandos útiles:"
echo "   Ver logs:       sudo journalctl -u seguimiento-sitra -f"
echo "   Ver estado:     sudo systemctl status seguimiento-sitra"
echo "   Reiniciar:      sudo systemctl restart seguimiento-sitra"
echo "   Detener:        sudo systemctl stop seguimiento-sitra"
echo ""
