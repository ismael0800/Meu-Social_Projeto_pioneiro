@echo off
:: ==========================================
:: 1. VERIFICAR E SOLICITAR MODO ADMINISTRADOR
:: ==========================================
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :iniciar
) else (
    echo Solicitando privilegios de administrador para abrir apenas uma janela...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /B
)

:iniciar
title Meu Social Pioneiros - Servidor Unificado
color 0A
cd /d "C:\Users\PIONEIROS\Desktop\Meu_Social_Pioneiros"

echo ===================================================
echo Iniciando o ecossistema Meu Social Pioneiros...
echo ===================================================
echo.
echo Todos os processos rodarao nesta unica janela.
echo Nao a feche enquanto estiver usando o sistema!
echo.

echo [1/3] Iniciando o Servidor Backend (Next.js) em segundo plano...
start /B cmd /c "cd web && npm run dev"

echo [2/3] Iniciando o Prisma Studio (Banco de Dados) em segundo plano...
start /B cmd /c "cd web && npx prisma studio"

echo [3/3] Iniciando o Aplicativo Mobile (Expo Web) em segundo plano...
start /B cmd /c "cd mobile && npx expo start --port 8082"

echo.
echo Aguardando 10 segundos para inicializar os sistemas...
timeout /t 10 /nobreak >nul

echo Abrindo todas as paginas automaticamente no seu navegador...
start http://localhost:3000
start http://localhost:5555
start http://localhost:8082

echo.
echo ===================================================
echo Inicializacao Completa!
echo Para DESLIGAR todo o sistema de uma vez, basta FECHAR ESTA JANELA.
echo ===================================================
:: Trava a tela para que a janela nao feche sozinha
cmd /k

