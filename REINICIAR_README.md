# 🔄 Reiniciar Sistema SITRA

Este directorio contiene scripts automatizados para limpiar cache y reiniciar el sistema SITRA.

## 📋 Scripts Disponibles

### 1. **Windows (PowerShell + Batch)**

#### Opción A: Doble clic (Recomendado para usuarios)
```
reiniciar.bat
```
- Haz doble clic en `reiniciar.bat`
- Se abrirán dos ventanas PowerShell automáticamente
- Espera 5-10 segundos para que ambos servidores inicien

#### Opción B: PowerShell (Para desarrolladores)
```powershell
.\reiniciar.ps1
```
- Abre PowerShell en este directorio
- Ejecuta el comando anterior
- Los servidores se abrirán en nuevas ventanas

### 2. **Linux/Mac (Bash)**
```bash
chmod +x reiniciar.sh
./reiniciar.sh
```

## 🧹 ¿Qué Hace el Script?

1. **Detiene procesos** - Mata todos los procesos node/npm corriendo
2. **Limpia frontend cache**
   - Elimina carpeta `dist/`
   - Elimina carpeta `.vite/`
   - Elimina logs
3. **Limpia backend cache**
   - Elimina carpeta `.cache/`
   - Elimina logs
4. **Reinicia servicios**
   - Inicia backend en puerto 3000
   - Inicia frontend en puerto 5175
5. **Muestra estado** - Muestra URLs de acceso

## 🚀 Acceso Después del Reinicio

Una vez completado, accede a:
- **Frontend:** `http://IP:5175` (ejemplo: `http://172.16.40.64:5175`)
- **Backend API:** `http://IP:3000`

## 🔧 Limpiar Cache del Navegador

Después de ejecutar el script, también limpia el cache de tu navegador:

### Chrome/Edge
- Presiona `Ctrl + Shift + Delete`
- Selecciona "Últimas 24 horas"
- Marca "Cookies y otros datos de sitios" e "Imágenes y archivos almacenados en caché"
- Click en "Borrar datos"

O más rápido:
- Presiona `Ctrl + Shift + R` para recargar sin cache

### Firefox
- Presiona `Ctrl + Shift + Delete`
- Selecciona "Últimos 24 horas"
- Click en "Limpiar"

## 📊 Archivos que Se Limpian

### Frontend
```
frontend/dist/              # Build compilado
frontend/.vite/             # Cache de Vite
frontend/node_modules/.vite/
frontend/frontend.log       # Archivos de log
```

### Backend
```
backend/.cache/             # Cache del backend
backend/backend.log         # Archivos de log
```

## ⚠️ Notas Importantes

- Los scripts **NO** elimina `node_modules/` para ahorrar tiempo
- Los scripts abre dos nuevas ventanas PowerShell (no cierres, necesitan seguir corriendo)
- Si los servidores no arrancan, revisa la consola para ver errores
- Asegúrate de tener Node.js y npm instalados

## 🐛 Troubleshooting

### "Acceso denegado" en Windows
- Ejecuta PowerShell como administrador
- Luego ejecuta el script

### Los servidores no inician
- Verifica que el puerto 3000 y 5175 estén disponibles
- Intenta matar procesos manualmente:
  ```powershell
  Get-Process node,npm | Stop-Process -Force
  ```

### Script no ejecutable en Mac/Linux
```bash
chmod +x reiniciar.sh
```

## 💡 Desarrollo

Para hacer cambios al script:

1. **PowerShell:** Edita `reiniciar.ps1` directamente
2. **Batch:** Edita `reiniciar.bat` directamente
3. **Bash:** Edita `reiniciar.sh` directamente

## 📝 Ejemplo de Uso

```bash
# Windows - Doble clic en reiniciar.bat
# O desde PowerShell:
PS> .\reiniciar.ps1

# Linux/Mac
$ ./reiniciar.sh

# Espera 10 segundos...

# Accede a:
# http://172.16.40.64:5175
```

---

**¿Necesitas ayuda?** Revisa los logs en PowerShell si hay errores.
