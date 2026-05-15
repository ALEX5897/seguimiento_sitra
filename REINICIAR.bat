@echo off
REM Script para reiniciar SITRA - Doble clic para ejecutar

setlocal enabledelayedexpansion
chcp 65001 >/dev/null
cls

echo.
echo ====================================================
echo     REINICIAR SISTEMA SITRA - Limpiar Cache
echo ====================================================
echo.

echo Ejecutando script de reinicio...
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "reiniciar_sistema.ps1"

pause
