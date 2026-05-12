# 🚀 Instrucciones para Reiniciar el Sistema

## Cambios Realizados

Se agregó la página de **Catálogos** al sistema con:
- ✅ Opción en el menú de administración (Catálogos)
- ✅ Página completa para gestionar estados de reasignados
- ✅ CRUD funcional (Crear, Leer, Actualizar, Desactivar)
- ✅ Validaciones y manejo de errores
- ✅ API endpoints en `/api/catalogos/estados-reasignados`

## Reiniciar el Sistema

### Opción 1: Reinicio Manual (Recomendado)

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
# O si prefieres:
# node src/index.js
```

Deberías ver algo como:
```
🚀 Servidor escuchando en puerto 3000
✅ Conectado a BD
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Deberías ver:
```
  VITE v... dev server running at:
  ➜  Local:   http://localhost:5173
```

### Opción 2: Abrir en Navegador

Una vez ambos servidores estén corriendo:

1. **URL del Sistema:** `http://localhost:5173`
2. **Login** con tu usuario (acasa@quito-turismo.gob.ec)
3. **Menú > Administración > Catálogos**

## Verificación Post-Reinicio

### ✅ Checklist de Verificación

- [ ] Frontend carga correctamente
- [ ] Backend está disponible
- [ ] Menú tiene opción "Catálogos"
- [ ] Puedes abrir la página de Catálogos (admin solo)
- [ ] Ves la tabla con los 2 estados: Pendiente y Completo
- [ ] Puedes crear/editar estados
- [ ] API responde en `/api/catalogos/estados-reasignados`

### Test Rápido de API

```bash
curl http://localhost:3000/api/catalogos/estados-reasignados
```

Deberías recibir:
```json
[
  {
    "id": 1,
    "codigo": "pendiente",
    "nombre": "Pendiente",
    "icono": "⏳",
    "color": "warning",
    "activo": true
  },
  {
    "id": 2,
    "codigo": "completo",
    "nombre": "Completo",
    "icono": "✓",
    "color": "success",
    "activo": true
  }
]
```

## Si hay Problemas

### Error: Puerto 3000 en uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# MacOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Error: Módulos faltantes
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Error: BD no conecta
- Verificar `.env` en backend tiene credenciales correctas
- Conectividad a `172.16.1.63` disponible

### Frontend no recarga
- Limpiar caché del navegador (Ctrl+Shift+Del)
- Reiniciar servidor Vite
- Verificar `http://localhost:5173` está disponible

## Rutas Agregadas

- **Frontend:** `/catalogos` → Página de Catálogos
- **Backend:** `GET /api/catalogos/estados-reasignados`
- **Backend:** `POST /api/catalogos/estados-reasignados`
- **Backend:** `PUT /api/catalogos/estados-reasignados/:id`
- **Backend:** `DELETE /api/catalogos/estados-reasignados/:id`

## Documentación

Ver: `docs/CATALOGO_ESTADOS.md` para:
- API completa
- Ejemplos de uso
- Cómo agregar nuevos estados
- Tabla de colores e iconos

---

**Hora de reinicio:** `2026-05-12 16:30 (Aproximado)`

Para más información, consulta el commit más reciente en git.
