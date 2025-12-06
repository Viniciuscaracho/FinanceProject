#!/bin/bash

# Script completo para resetar e reconfigurar todo o ambiente de testes
# Para tudo, limpa processos, reinicia e verifica

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔄 Resetando e Reconfigurando Ambiente Completo${NC}"
echo "=================================================="
echo ""

# Função para matar processos na porta
kill_port() {
    local port=$1
    local name=$2
    echo -n "   Parando $name na porta $port... "
    
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        kill -9 $pids 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${YELLOW}⚠️  Nenhum processo encontrado${NC}"
    fi
}

# Função para verificar porta
check_port() {
    local port=$1
    if lsof -ti:$port >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# ============================================
# FASE 1: PARAR TUDO
# ============================================
echo -e "${RED}🛑 FASE 1: Parando todos os serviços${NC}"
echo "----------------------------------------"

# 1. Parar emulador
echo "1️⃣ Parando emulador Android..."
if adb devices 2>/dev/null | grep -q "emulator.*device"; then
    echo "   Emulador encontrado, parando..."
    adb emu kill 2>/dev/null || true
    sleep 2
    
    # Forçar parada se ainda estiver rodando
    if adb devices 2>/dev/null | grep -q "emulator.*device"; then
        echo "   Forçando parada..."
        pkill -9 qemu-system 2>/dev/null || true
        pkill -9 emulator 2>/dev/null || true
        sleep 2
    fi
    echo -e "   ${GREEN}✅ Emulador parado${NC}"
else
    echo -e "   ${YELLOW}⚠️  Nenhum emulador rodando${NC}"
fi
echo ""

# 2. Parar Appium
echo "2️⃣ Parando Appium (porta 4723)..."
kill_port 4723 "Appium"
pkill -9 appium 2>/dev/null || true
sleep 1
echo ""

# 3. Parar Backend Rails
echo "3️⃣ Parando Backend Rails (porta 3000)..."
kill_port 3000 "Rails"
pkill -9 rails 2>/dev/null || true
pkill -9 puma 2>/dev/null || true
pkill -9 foreman 2>/dev/null || true
sleep 1
echo ""

# 4. Parar Frontend
echo "4️⃣ Parando Frontend (porta 5173)..."
kill_port 5173 "Vite/Frontend"
pkill -9 vite 2>/dev/null || true
pkill -9 node 2>/dev/null || true
pkill -9 pnpm 2>/dev/null || true
sleep 1
echo ""

# 5. Limpar processos ADB
echo "5️⃣ Limpando processos ADB..."
adb kill-server 2>/dev/null || true
sleep 1
adb start-server 2>/dev/null || true
echo -e "   ${GREEN}✅ ADB reiniciado${NC}"
echo ""

# 6. Aguardar tudo parar
echo "6️⃣ Aguardando processos finalizarem (3 segundos)..."
sleep 3
echo ""

# ============================================
# FASE 2: CONFIGURAR VARIÁVEIS DE AMBIENTE
# ============================================
echo -e "${BLUE}⚙️  FASE 2: Configurando variáveis de ambiente${NC}"
echo "----------------------------------------"

# Configurar Android SDK
if [ -z "$ANDROID_HOME" ]; then
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
        export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
        export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"
        echo -e "   ${GREEN}✅ ANDROID_HOME configurado: $ANDROID_HOME${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Android SDK não encontrado em $HOME/Android/Sdk${NC}"
        echo "   Configure manualmente: export ANDROID_HOME=\$HOME/Android/Sdk"
    fi
else
    echo -e "   ${GREEN}✅ ANDROID_HOME já configurado: $ANDROID_HOME${NC}"
fi
echo ""

# ============================================
# FASE 3: VERIFICAR PRÉ-REQUISITOS
# ============================================
echo -e "${YELLOW}🔍 FASE 3: Verificando pré-requisitos${NC}"
echo "----------------------------------------"

ERRORS=0

# Verificar se estamos no diretório correto
if [ ! -f "Gemfile" ]; then
    echo -e "   ${RED}❌ Execute este script da raiz do projeto${NC}"
    exit 1
fi

# Verificar Ruby/Bundler
if command -v bundle &> /dev/null; then
    echo -e "   ${GREEN}✅ Bundler instalado${NC}"
else
    echo -e "   ${RED}❌ Bundler não encontrado${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Verificar Node/pnpm
if command -v pnpm &> /dev/null; then
    echo -e "   ${GREEN}✅ pnpm instalado${NC}"
else
    echo -e "   ${YELLOW}⚠️  pnpm não encontrado (opcional)${NC}"
fi

# Verificar Appium
if command -v appium &> /dev/null; then
    echo -e "   ${GREEN}✅ Appium instalado${NC}"
else
    echo -e "   ${RED}❌ Appium não encontrado${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Verificar emulador
if command -v emulator &> /dev/null || [ -n "$ANDROID_HOME" ]; then
    echo -e "   ${GREEN}✅ Android Emulator disponível${NC}"
    if [ -n "$ANDROID_HOME" ]; then
        AVD_COUNT=$(emulator -list-avds 2>/dev/null | wc -l)
        if [ "$AVD_COUNT" -gt 0 ]; then
            echo -e "   ${GREEN}✅ $AVD_COUNT AVD(s) disponível(is)${NC}"
        else
            echo -e "   ${YELLOW}⚠️  Nenhum AVD encontrado${NC}"
        fi
    fi
else
    echo -e "   ${YELLOW}⚠️  Android Emulator não encontrado${NC}"
fi

echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Alguns pré-requisitos estão faltando${NC}"
    echo "   Corrija os problemas acima antes de continuar"
    exit 1
fi

# ============================================
# FASE 4: INICIAR SERVIÇOS
# ============================================
echo -e "${GREEN}🚀 FASE 4: Iniciando serviços${NC}"
echo "----------------------------------------"

# 1. Iniciar Backend Rails
echo "1️⃣ Iniciando Backend Rails..."
if check_port 3000; then
    echo -e "   ${YELLOW}⚠️  Porta 3000 já em uso${NC}"
else
    echo "   Iniciando com foreman (escuta em 0.0.0.0)..."
    cd "$(dirname "$0")/.."
    nohup foreman start -f Procfile.dev web > /tmp/rails.log 2>&1 &
    RAILS_PID=$!
    echo "   PID: $RAILS_PID"
    echo "   Logs: tail -f /tmp/rails.log"
    
    # Aguardar iniciar
    echo "   Aguardando backend iniciar..."
    for i in {1..30}; do
        if check_port 3000; then
            # Verificar se está escutando em 0.0.0.0
            if netstat -tlnp 2>/dev/null | grep -q "0.0.0.0:3000" || ss -tlnp 2>/dev/null | grep -q "0.0.0.0:3000"; then
                echo -e "   ${GREEN}✅ Backend iniciado e acessível na rede${NC}"
            else
                echo -e "   ${YELLOW}⚠️  Backend iniciado mas pode não estar acessível na rede${NC}"
            fi
            break
        fi
        sleep 1
    done
    
    if ! check_port 3000; then
        echo -e "   ${RED}❌ Backend não iniciou. Verifique: tail -f /tmp/rails.log${NC}"
    fi
fi
echo ""

# 2. Iniciar Frontend
echo "2️⃣ Iniciando Frontend React..."
if check_port 5173; then
    echo -e "   ${YELLOW}⚠️  Porta 5173 já em uso${NC}"
else
    echo "   Iniciando Vite..."
    cd FrontEnd
    nohup pnpm dev > /tmp/vite.log 2>&1 &
    VITE_PID=$!
    echo "   PID: $VITE_PID"
    echo "   Logs: tail -f /tmp/vite.log"
    cd ..
    
    # Aguardar iniciar
    echo "   Aguardando frontend iniciar..."
    for i in {1..20}; do
        if check_port 5173; then
            echo -e "   ${GREEN}✅ Frontend iniciado${NC}"
            break
        fi
        sleep 1
    done
    
    if ! check_port 5173; then
        echo -e "   ${RED}❌ Frontend não iniciou. Verifique: tail -f /tmp/vite.log${NC}"
    fi
fi
echo ""

# 3. Iniciar Appium
echo "3️⃣ Iniciando Appium..."
if check_port 4723; then
    echo -e "   ${YELLOW}⚠️  Porta 4723 já em uso${NC}"
else
    export ANDROID_HOME=${ANDROID_HOME:-$HOME/Android/Sdk}
    export ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}
    export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"
    
    echo "   Iniciando Appium Server..."
    nohup appium --allow-insecure chromedriver_autodownload > /tmp/appium.log 2>&1 &
    APPIUM_PID=$!
    echo "   PID: $APPIUM_PID"
    echo "   Logs: tail -f /tmp/appium.log"
    
    # Aguardar iniciar
    echo "   Aguardando Appium iniciar..."
    for i in {1..15}; do
        if curl -s http://localhost:4723/status > /dev/null 2>&1; then
            echo -e "   ${GREEN}✅ Appium iniciado${NC}"
            break
        fi
        sleep 1
    done
    
    if ! curl -s http://localhost:4723/status > /dev/null 2>&1; then
        echo -e "   ${RED}❌ Appium não iniciou. Verifique: tail -f /tmp/appium.log${NC}"
    fi
fi
echo ""

# 4. Iniciar Emulador
echo "4️⃣ Iniciando Emulador Android..."
if adb devices 2>/dev/null | grep -q "emulator.*device"; then
    echo -e "   ${YELLOW}⚠️  Emulador já está rodando${NC}"
else
    # Listar AVDs
    if [ -n "$ANDROID_HOME" ] && command -v emulator &> /dev/null; then
        AVD_LIST=$(emulator -list-avds 2>/dev/null)
        if [ -n "$AVD_LIST" ]; then
            AVD_NAME=$(echo "$AVD_LIST" | head -1)
            echo "   Iniciando emulador: $AVD_NAME"
            nohup emulator -avd "$AVD_NAME" > /tmp/emulator.log 2>&1 &
            EMULATOR_PID=$!
            echo "   PID: $EMULATOR_PID"
            echo "   Logs: tail -f /tmp/emulator.log"
            echo "   ⏳ Aguarde 1-2 minutos para o emulador iniciar completamente..."
        else
            echo -e "   ${YELLOW}⚠️  Nenhum AVD encontrado${NC}"
            echo "   Crie um AVD no Android Studio: Tools → Device Manager → Create Device"
        fi
    else
        echo -e "   ${YELLOW}⚠️  Emulador não disponível${NC}"
    fi
fi
echo ""

# ============================================
# FASE 5: VERIFICAR TUDO
# ============================================
echo -e "${CYAN}✅ FASE 5: Verificando ambiente${NC}"
echo "----------------------------------------"

# Aguardar um pouco para tudo estabilizar
sleep 5

# Verificar Backend
echo "1️⃣ Verificando Backend..."
if check_port 3000; then
    if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Backend está respondendo${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Backend está rodando mas não está respondendo${NC}"
    fi
else
    echo -e "   ${RED}❌ Backend não está rodando${NC}"
fi

# Verificar Frontend
echo "2️⃣ Verificando Frontend..."
if check_port 5173; then
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Frontend está respondendo${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Frontend está rodando mas não está respondendo${NC}"
    fi
else
    echo -e "   ${RED}❌ Frontend não está rodando${NC}"
fi

# Verificar Appium
echo "3️⃣ Verificando Appium..."
if curl -s http://localhost:4723/status > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Appium está respondendo${NC}"
else
    echo -e "   ${RED}❌ Appium não está respondendo${NC}"
fi

# Verificar Dispositivos
echo "4️⃣ Verificando dispositivos Android..."
DEVICES=$(adb devices 2>/dev/null | grep -v "List of devices" | grep "device$" | awk '{print $1}' || echo "")
if [ -n "$DEVICES" ]; then
    echo -e "   ${GREEN}✅ Dispositivos encontrados:${NC}"
    for DEVICE in $DEVICES; do
        if [[ $DEVICE == emulator-* ]]; then
            echo "      🤖 Emulador: $DEVICE"
        else
            DEVICE_NAME=$(adb -s $DEVICE shell getprop ro.product.model 2>/dev/null | tr -d '\r' || echo "Desconhecido")
            echo "      📱 Físico: $DEVICE ($DEVICE_NAME)"
        fi
    done
else
    echo -e "   ${YELLOW}⚠️  Nenhum dispositivo conectado${NC}"
    echo "   Aguarde o emulador iniciar ou conecte um dispositivo físico"
fi

echo ""

# ============================================
# RESUMO FINAL
# ============================================
echo -e "${GREEN}📋 Resumo Final${NC}"
echo "=================================================="
echo ""
echo "Serviços:"
echo "  - Backend:  http://localhost:3000"
echo "  - Frontend: http://localhost:5173"
echo "  - Appium:   http://localhost:4723"
echo ""
echo "Logs:"
echo "  - Backend:  tail -f /tmp/rails.log"
echo "  - Frontend: tail -f /tmp/vite.log"
echo "  - Appium:   tail -f /tmp/appium.log"
echo "  - Emulador: tail -f /tmp/emulator.log"
echo ""
echo "Executar testes:"
echo "  cd AndroidApp/tests/java"
echo "  ./check-environment.sh  # Verificar ambiente"
echo "  ./../../gradlew test    # Executar testes"
echo ""
echo "Parar tudo:"
echo "  ./bin/reset-and-reconfigure.sh  # Reiniciar tudo"
echo "  ./bin/reset-all.sh               # Apenas parar"
echo ""
echo -e "${GREEN}✅ Reset e reconfiguração concluídos!${NC}"
echo ""

