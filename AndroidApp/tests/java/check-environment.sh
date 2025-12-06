#!/bin/bash

# Script para verificar se o ambiente está pronto para executar testes

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verificando ambiente para testes...${NC}"
echo ""

ERRORS=0

# 1. Verificar se há dispositivos conectados
echo "1️⃣ Verificando dispositivos Android..."
DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo "   ❌ Nenhum dispositivo Android conectado!"
    echo "   💡 Soluções:"
    echo "      - Iniciar emulador: ./bin/start-android-emulator.sh"
    echo "      - Ou conectar dispositivo físico via USB"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ $DEVICES dispositivo(s) conectado(s)"
    adb devices | grep "device$"
fi
echo ""

# 2. Verificar se Appium está rodando
echo "2️⃣ Verificando Appium Server..."
if curl -s http://localhost:4723/status > /dev/null 2>&1; then
    echo "   ✅ Appium está rodando"
    STATUS=$(curl -s http://localhost:4723/status | grep -o '"ready":[^,]*' | cut -d: -f2)
    echo "   Status: $STATUS"
else
    echo "   ❌ Appium não está rodando!"
    echo "   💡 Iniciar com: ./bin/start-appium.sh"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 3. Verificar se backend está rodando
echo "3️⃣ Verificando Backend (Rails)..."
if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo "   ✅ Backend está rodando"
    # Verificar se está escutando em 0.0.0.0
    if netstat -tlnp 2>/dev/null | grep -q "0.0.0.0:3000"; then
        echo "   ✅ Backend escutando em 0.0.0.0:3000 (acessível na rede)"
    else
        echo "   ⚠️  Backend pode não estar acessível na rede"
        echo "   💡 Iniciar com: foreman start -f Procfile.dev web"
    fi
else
    echo "   ❌ Backend não está rodando!"
    echo "   💡 Iniciar com: foreman start -f Procfile.dev web"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Verificar se frontend está rodando
echo "4️⃣ Verificando Frontend (Vite)..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend está rodando"
else
    echo "   ⚠️  Frontend não está rodando (opcional para alguns testes)"
    echo "   💡 Iniciar com: cd FrontEnd && pnpm dev"
fi
echo ""

# 5. Verificar variáveis de ambiente Android
echo "5️⃣ Verificando variáveis de ambiente Android..."
if [ -z "$ANDROID_HOME" ]; then
    echo "   ⚠️  ANDROID_HOME não está definido"
    if [ -d "$HOME/Android/Sdk" ]; then
        echo "   💡 Execute: export ANDROID_HOME=\$HOME/Android/Sdk"
    fi
else
    echo "   ✅ ANDROID_HOME: $ANDROID_HOME"
fi
echo ""

# Resumo
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Ambiente pronto para testes!${NC}"
    echo ""
    echo -e "${BLUE}🚀 Executar testes:${NC}"
    echo "   cd tests/java"
    echo "   ./../../gradlew test"
    echo ""
    echo -e "${YELLOW}💡 Ou executar teste específico:${NC}"
    echo "   ./../../gradlew test --tests \"*BackendConnectionTest.testBackendConnection\""
    exit 0
else
    echo -e "${RED}❌ Ambiente não está pronto ($ERRORS erro(s))${NC}"
    echo ""
    echo -e "${YELLOW}📝 Corrija os problemas acima antes de executar os testes${NC}"
    echo ""
    echo -e "${BLUE}💡 Para reiniciar tudo:${NC}"
    echo "   cd ../../.."
    echo "   ./bin/reset-and-reconfigure.sh"
    exit 1
fi

