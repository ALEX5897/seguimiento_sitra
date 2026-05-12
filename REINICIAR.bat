@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   REINICIAR SISTEMA SITRA
echo ========================================
echo.

REM Obtener el directorio actual
set PROYECTO_DIR=%~dp0

echo 📁 Directorio del proyecto: %PROYECTO_DIR%
echo.

REM Verificar que estamos en el directorio correcto
if not exist "backend\src\index.js" (
    echo ❌ Error: No se encontró backend\src\index.js
    echo Por favor ejecuta este script desde la raíz del proyecto
    pause
    exit /b 1
)

if not exist "frontend\src\App.vue" (
    echo ❌ Error: No se encontró frontend\src\App.vue
    echo Por favor ejecuta este script desde la raíz del proyecto
    pause
    exit /b 1
)

echo ✅ Estructura del proyecto validada
echo.

echo.
echo ========================================
echo   OPCIÓN 1: Iniciar Backend
echo ========================================
echo.
echo Comando:
echo   cd backend ^&^& npm run dev
echo.
echo O abre una terminal en backend\ y ejecuta: npm run dev
echo.

echo.
echo ========================================
echo   OPCIÓN 2: Iniciar Frontend
echo ========================================
echo.
echo Comando:
echo   cd frontend ^&^& npm run dev
echo.
echo O abre una terminal en frontend\ y ejecuta: npm run dev
echo.

echo.
echo ========================================
echo   INSTRUCCIONES COMPLETAS
echo ========================================
echo.
echo 1. Abre DOS TERMINALES (PowerShell o CMD)
echo.
echo TERMINAL 1 - Backend:
echo   cd "%PROYECTO_DIR%backend"
echo   npm run dev
echo.
echo TERMINAL 2 - Frontend:
echo   cd "%PROYECTO_DIR%frontend"
echo   npm run dev
echo.
echo 3. Espera a que ambas muestren "ready" o "listening"
echo.
echo 4. Abre en navegador: http://localhost:5173
echo.
echo ========================================
echo.
echo URLs:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
echo.
echo Presiona Enter para cerrar...
pause
