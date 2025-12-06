#!/bin/bash

# Script para iniciar todo o ambiente necessário para testes E2E
# Inicia: Backend Rails, Frontend React, Appium

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando Ambiente de Testes E2E${NC}"
echo "=========================================="
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "Gemfile" ]; then
    echo -e "${RED}❌ Execute este script da raiz do projeto${NC}"
    exit 1
fi

# Função para verificar se uma porta está em uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Porta em uso
    else
        return 1  # Porta livre
    fi
}

# Verificar portas
echo -e "${YELLOW}🔍 Verificando portas...${NC}"

if check_port 3000; then
    echo -e "${GREEN}✅ Backend Rails já está rodando na porta 3000${NC}"
else
    echo -e "${YELLOW}⚠️  Backend Rails não está rodando${NC}"
fi

if check_port 5173; then
    echo -e "${GREEN}✅ Frontend React já está rodando na porta 5173${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend React não está rodando${NC}"
fi

if check_port 4723; then
    echo -e "${GREEN}✅ Appium já está rodando na porta 4723${NC}"
else
    echo -e "${YELLOW}⚠️  Appium não está rodando${NC}"
fi

echo ""

# Verificar dispositivo Android
echo -e "${YELLOW}📱 Verificando dispositivos Android...${NC}"
DEVICES=$(adb devices 2>/dev/null | grep -v "List of devices" | grep "device$" | awk '{print $1}' || echo "")

if [ -z "$DEVICES" ]; then
    echo -e "${RED}❌ Nenhum dispositivo Android conectado!${NC}"
    echo ""
    echo "Conecte um dispositivo físico ou inicie um emulador:"
    echo "  ./bin/start-android-emulator.sh"
    echo ""
else
    echo -e "${GREEN}✅ Dispositivos encontrados:${NC}"
    for DEVICE in $DEVICES; do
        if [[ $DEVICE == emulator-* ]]; then
            echo "  🤖 Emulador: $DEVICE"
        else
            DEVICE_NAME=$(adb -s $DEVICE shell getprop ro.product.model 2>/dev/null | tr -d '\r' || echo "Desconhecido")
            echo "  📱 Físico: $DEVICE ($DEVICE_NAME)"
        fi
    done
fi

echo ""

# Obter IP da máquina
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo -e "${YELLOW}📡 Configuração de Rede:${NC}"
echo "   IP da máquina: $LOCAL_IP"
echo "   Backend: http://$LOCAL_IP:3000/api/v1"
echo "   Frontend: http://$LOCAL_IP:5173"
echo ""

# Iniciar serviços que não estão rodando
echo -e "${YELLOW}🚀 Iniciando serviços...${NC}"
echo ""

# Backend Rails
if ! check_port 3000; then
    echo -e "${BLUE}📦 Iniciando Backend Rails...${NC}"
    cd "$(dirname "$0")/.."
    # Usar foreman para garantir que escuta em 0.0.0.0 (necessário para dispositivo físico)
    foreman start -f Procfile.dev web > /tmp/rails.log 2>&1 &
    RAILS_PID=$!
    echo "   PID: $RAILS_PID"
    sleep 5
    if check_port 3000; then
        # Verificar se está escutando em 0.0.0.0 (não apenas 127.0.0.1)
        if netstat -tlnp 2>/dev/null | grep -q "0.0.0.0:3000" || ss -tlnp 2>/dev/null | grep -q "0.0.0.0:3000"; then
            echo -e "${GREEN}   ✅ Backend iniciado e acessível na rede${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Backend iniciado mas pode não estar acessível na rede${NC}"
            echo -e "${YELLOW}   💡 Use: foreman start -f Procfile.dev web${NC}"
        fi
    else
        echo -e "${RED}   ❌ Erro ao iniciar backend. Verifique: tail -f /tmp/rails.log${NC}"
    fi
fi

# Frontend React
if ! check_port 5173; then
    echo -e "${BLUE}⚛️  Iniciando Frontend React...${NC}"
    cd "$(dirname "$0")/../FrontEnd"
    pnpm dev > /tmp/vite.log 2>&1 &
    VITE_PID=$!
    echo "   PID: $VITE_PID"
    sleep 3
    if check_port 5173; then
        echo -e "${GREEN}   ✅ Frontend iniciado${NC}"
    else
        echo -e "${RED}   ❌ Erro ao iniciar frontend. Verifique: tail -f /tmp/vite.log${NC}"
    fi
    cd - > /dev/null
fi

# Appium
if ! check_port 4723; then
    echo -e "${BLUE}🤖 Iniciando Appium...${NC}"
    export ANDROID_HOME=$HOME/Android/Sdk
    export ANDROID_SDK_ROOT=$HOME/Android/Sdk
    export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
    appium --allow-insecure chromedriver_autodownload > /tmp/appium.log 2>&1 &
    APPIUM_PID=$!
    echo "   PID: $APPIUM_PID"
    sleep 5
    if check_port 4723; then
        echo -e "${GREEN}   ✅ Appium iniciado${NC}"
    else
        echo -e "${RED}   ❌ Erro ao iniciar Appium. Verifique: tail -f /tmp/appium.log${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Ambiente de testes pronto!${NC}"
echo ""
echo -e "${BLUE}📋 Resumo:${NC}"
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo "   Appium:   http://localhost:4723"
echo ""
echo -e "${YELLOW}💡 Para executar os testes:${NC}"
echo "   export APPIUM_DEVICE_NAME=\$(adb devices | grep -v emulator | grep device | awk '{print \$1}' | head -1)"
echo "   cd AndroidApp/tests/java"
echo "   ./../../gradlew test"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo "   Backend:  tail -f /tmp/rails.log"
echo "   Frontend: tail -f /tmp/vite.log"
echo "   Appium:   tail -f /tmp/appium.log"
echo ""
echo -e "${YELLOW}🛑 Para parar todos os serviços:${NC}"
echo "   pkill -f 'rails server'"
echo "   pkill -f 'vite'"
echo "   pkill -f appium"
echo ""

