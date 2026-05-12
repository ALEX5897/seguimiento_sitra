# 🔌 Liberar Puertos y Reiniciar

## Problema

```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

El puerto 3000 (o 5173) ya está siendo usado por otro proceso.

## Solución para Windows (PowerShell)

### Opción 1: Matar proceso en puerto 3000

```powershell
# Encontrar proceso en puerto 3000
netstat -ano | findstr :3000

# Ver resultado similar a:
# TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345

# Matar el proceso (reemplaza 12345 con el PID real)
taskkill /PID 12345 /F
```

### Opción 2: Matar proceso en puerto 5173

```powershell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Opción 3: Matar todos los node.js

```powershell
# Matar TODOS los procesos node
taskkill /IM node.exe /F
```

## Solución para macOS/Linux

```bash
# Puerto 3000
lsof -i :3000
kill -9 <PID>

# Puerto 5173
lsof -i :5173
kill -9 <PID>

# Todos los node
killall node
```

## Después de Liberar Puertos

### 1. Verifica que los puertos estén libres

**Windows:**
```powershell
netstat -ano | findstr :3000
# No debería mostrar nada si está libre
```

**macOS/Linux:**
```bash
lsof -i :3000
# No debería mostrar nada si está libre
```

### 2. Reinicia los servicios

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Verifica que funciona

```
✅ Backend en http://localhost:3000
✅ Frontend en http://localhost:5173
```

## Script Rápido (Windows)

Crea un archivo `LIBERAR_Y_REINICIAR.bat`:

```batch
@echo off
echo Matando procesos en puertos...
taskkill /IM node.exe /F 2>nul
echo Esperando...
timeout /t 2 /nobreak

echo.
echo Backend:
cd backend
npm run dev
```

## Puertos Conflictivos Comunes

| Aplicación | Puerto | Solución |
|-----------|--------|----------|
| Node.js | 3000 | `taskkill /IM node.exe /F` |
| Vite Dev | 5173 | `taskkill /IM node.exe /F` |
| Next.js | 3000 | Cambiar puerto o matar proceso |
| VS Code | 5173 | Cerrar VS Code o cambiar puerto |

## Cambiar Puerto si no Puedes Liberar

### Backend (cambiar de 3000 a 3001)

Edita `backend/.env`:
```
PORT=3001
```

Luego inicia:
```bash
npm run dev
```

### Frontend (cambiar de 5173 a 5174)

Edita `frontend/vite.config.js`:
```javascript
export default defineConfig({
  server: {
    port: 5174
  }
})
```

Luego inicia:
```bash
npm run dev
```

## Verificación Completa

```bash
# Verificar Puerto 3000 (Backend)
curl http://localhost:3000/api/catalogos/estados-reasignados

# Verificar Puerto 5173 (Frontend)
curl http://localhost:5173

# Si ves HTML o JSON, el servidor está corriendo
```

## Prevenir en el Futuro

1. **Usa un gestor de procesos:** PM2, Forever, etc.
2. **Documenta los puertos:** En tu .env
3. **Usa scripts específicos:** No inicies múltiples instancias
4. **Revisa procesos regularmente:** Limpia tareas innecesarias

---

**Última actualización:** 2026-05-12
