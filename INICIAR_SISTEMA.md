# 🚀 Cómo Iniciar el Sistema SITRA

## Requisitos Previos

✅ Node.js instalado (v14 o superior)
✅ npm instalado
✅ Conexión a la base de datos (172.16.1.63)

## Opción 1: Comando Rápido (Windows)

Ejecuta desde la raíz del proyecto:
```bash
REINICIAR.bat
```

Esto abrirá un menú con instrucciones claras.

## Opción 2: Terminal Manual (Recomendado)

### Paso 1: Abre PRIMERA Terminal (Backend)

```bash
cd backend
npm run dev
```

**Resultado esperado:**
```
[nodemon] starting `node src/index.js`
🚀 Servidor escuchando en puerto 3000
✅ Conectado a BD
📡 CORS Origins permitidos: [...]
```

### Paso 2: Abre SEGUNDA Terminal (Frontend)

```bash
cd frontend
npm run dev
```

**Resultado esperado:**
```
VITE v... dev server running at:

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Paso 3: Accede al Sistema

Abre en navegador:
```
http://localhost:5173
```

## Verificación de Estado

### ✅ Checklist Post-Inicio

Frontend:
- [ ] Página carga sin errores
- [ ] Ves el menú lateral
- [ ] Puedes navegar entre secciones
- [ ] Console no muestra errores (F12)

Backend:
- [ ] Servidor escucha en puerto 3000
- [ ] Conectado a BD
- [ ] Terminal no muestra errores

Sistema:
- [ ] Login funciona
- [ ] Dashboard se carga
- [ ] Menú de Administración > Catálogos existe
- [ ] Puedes ver tabla de estados

## Solución de Problemas

### Error: Puerto 3000 ocupado

**Síntoma:** 
```
Error: listen EADDRINUSE :::3000
```

**Solución Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Solución macOS/Linux:**
```bash
lsof -i :3000
kill -9 <PID>
```

### Error: Puerto 5173 ocupado

Mismo proceso que arriba pero con puerto 5173.

### Error: Módulos no encontrados

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Error: No conecta a BD

**Verificar:**
1. `.env` en backend tiene credenciales correctas
2. IP 172.16.1.63 es accesible
3. Base de datos está corriendo

```bash
# Verificar conexión
ping 172.16.1.63
```

### Error: Frontend en blanco

1. Limpiar caché: `Ctrl + Shift + Del`
2. Reiniciar Vite en terminal
3. Hard refresh: `Ctrl + F5`

### Error: Hot Module Replacement (HMR) no funciona

Si ves cambios pero no se reflejan:
1. Cierra terminal de frontend
2. Ejecuta: `npm run dev`
3. Espera a que muestre "ready"

## URLs Importantes

| Componente | URL | Puerto |
|-----------|-----|--------|
| Frontend | http://localhost:5173 | 5173 |
| Backend API | http://localhost:3000 | 3000 |
| Catálogos | http://localhost:5173/catalogos | 5173 |
| Dashboard | http://localhost:5173/dashboard | 5173 |
| Reasignados | http://localhost:5173/reasignados | 5173 |

## Comandos Útiles

### Development
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Compilación
```bash
# Frontend build
cd frontend && npm run build

# Resultado
# dist/ folder listo para deployment
```

### Testing
```bash
# Backend seeds
cd backend && npm run seed

# Migrations
cd backend && npm run migrate
```

## Logs Útiles para Debugging

### Terminal Backend
```
✅ Connected to DB
📊 Seed completed
🚀 Server listening
```

### Terminal Frontend
```
✓ built in Xs
ready in Xs
```

### Console del Navegador (F12)
```javascript
// Ver usuario actual
console.log(localStorage.getItem('user'))

// Ver estado de autenticación
console.log(localStorage.getItem('token'))
```

## Reiniciar sin Perder Datos

Los datos persistentes en BD NO se pierden al reiniciar los servidores.

Para limpiar datos de prueba:
```bash
cd backend
npm run seed  # Recarga datos de prueba
```

## Parar los Servidores

### Terminal Backend
- Presiona: `Ctrl + C`

### Terminal Frontend
- Presiona: `Ctrl + C`

## Horario de Reinicio Recomendado

- **Desarrollo:** Bajo demanda
- **Pruebas:** Después de cambios importantes
- **Producción:** Sin downtime (usar PM2 o similar)

---

**Última actualización:** 2026-05-12
**Versión:** 1.0
