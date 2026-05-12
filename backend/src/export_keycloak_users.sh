#!/bin/bash

# Cargar variables de entorno
set -a
source .env
set +a

# URLs
KEYCLOAK_URL="https://gia.quito-turismo.gob.ec"
REALM="quito-turismo"

echo "🔐 Obteniendo token de Keycloak..."

# Obtener token
TOKEN_RESPONSE=$(curl -s -X POST \
  "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=$KEYCLOAK_CLIENT_ID&client_secret=$KEYCLOAK_CLIENT_SECRET" \
  -k)

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Error obteniendo token"
  echo "$TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido"
echo "📥 Descargando usuarios de Keycloak..."

# Descargar todos los usuarios y convertir a JSON
curl -s -X GET \
  "$KEYCLOAK_URL/admin/realms/$REALM/users?max=500" \
  -H "Authorization: Bearer $TOKEN" \
  -k | jq '[.[] | select(.enabled == true) | {nombre: (.firstName + " " + .lastName), correo: .email}]' > keycloak_users.json

echo "✅ Usuarios exportados a keycloak_users.json"
