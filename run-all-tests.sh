#!/bin/bash

# Script para executar todos os testes E2E automaticamente
# Uso: ./run-all-tests.sh

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

# Função para verificar porta
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Iniciar serviços se não estiverem rodando
echo -e "${YELLOW}📦 Verificando serviços...${NC}"

# Backend
if ! check_port 3000; then
    echo -e "${BLUE}   Iniciando Backend Rails...${NC}"
    foreman start -f Procfile.dev web > /tmp/rails.log 2>&1 &
    sleep 5
fi

# Frontend
if ! check_port 5173; then
    echo -e "${BLUE}   Iniciando Frontend React...${NC}"
    cd FrontEnd
    pnpm dev > /tmp/vite.log 2>&1 &
    cd ..
    sleep 3
fi

# Appium
if ! check_port 4723; then
    echo -e "${BLUE}   Iniciando Appium...${NC}"
    export ANDROID_HOME=$HOME/Android/Sdk
    export ANDROID_SDK_ROOT=$HOME/Android/Sdk
    export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
    appium --allow-insecure chromedriver_autodownload > /tmp/appium.log 2>&1 &
    sleep 5
fi

# Verificar serviços
echo ""
echo -e "${YELLOW}🔍 Verificando serviços...${NC}"

BACKEND_OK=false
FRONTEND_OK=false
APPIUM_OK=false
DEVICE_OK=false

if check_port 3000; then
    if netstat -tlnp 2>/dev/null | grep -q "0.0.0.0:3000" || ss -tlnp 2>/dev/null | grep -q "0.0.0.0:3000"; then
        if curl -s http://192.168.201.56:3000/api/v1/health > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ Backend (acessível na rede)${NC}"
            BACKEND_OK=true
        else
            echo -e "${YELLOW}   ⚠️  Backend (rodando mas pode não estar acessível)${NC}"
        fi
    else
        echo -e "${RED}   ❌ Backend (não acessível na rede - use foreman)${NC}"
    fi
else
    echo -e "${RED}   ❌ Backend não está rodando${NC}"
fi

if check_port 5173; then
    echo -e "${GREEN}   ✅ Frontend${NC}"
    FRONTEND_OK=true
else
    echo -e "${RED}   ❌ Frontend não está rodando${NC}"
fi

if check_port 4723; then
    if curl -s http://localhost:4723/status > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Appium${NC}"
        APPIUM_OK=true
    else
        echo -e "${RED}   ❌ Appium não está respondendo${NC}"
    fi
else
    echo -e "${RED}   ❌ Appium não está rodando${NC}"
fi

# Verificar dispositivo
DEVICE=$(adb devices 2>/dev/null | grep -v "List of devices" | grep "device$" | awk '{print $1}' | head -1)
if [ -n "$DEVICE" ]; then
    if [[ $DEVICE == emulator-* ]]; then
        echo -e "${GREEN}   ✅ Emulador: $DEVICE${NC}"
    else
        DEVICE_NAME=$(adb -s $DEVICE shell getprop ro.product.model 2>/dev/null | tr -d '\r' || echo "Desconhecido")
        echo -e "${GREEN}   ✅ Dispositivo Físico: $DEVICE ($DEVICE_NAME)${NC}"
    fi
    DEVICE_OK=true
    export APPIUM_DEVICE_NAME=$DEVICE
else
    echo -e "${RED}   ❌ Nenhum dispositivo conectado${NC}"
fi

echo ""

# Verificar se tudo está OK
if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ] && [ "$APPIUM_OK" = true ] && [ "$DEVICE_OK" = true ]; then
    echo -e "${GREEN}✅ Todos os serviços estão prontos!${NC}"
    echo ""
    
    # Executar testes
    echo -e "${BLUE}🧪 Executando testes...${NC}"
    echo ""
    
    cd AndroidApp/tests/java
    ./../../gradlew clean test
    
    echo ""
    echo -e "${GREEN}✅ Testes concluídos!${NC}"
    echo ""
    echo -e "${YELLOW}📊 Ver resultados:${NC}"
    echo "   open build/reports/tests/test/index.html  # macOS"
    echo "   xdg-open build/reports/tests/test/index.html  # Linux"
    
else
    echo -e "${RED}❌ Alguns serviços não estão prontos${NC}"
    echo ""
    echo "Corrija os problemas acima e execute novamente."
    exit 1
fi

