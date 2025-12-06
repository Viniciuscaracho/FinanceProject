#!/bin/bash

# Script para testar conexão do dispositivo com o backend

echo "🔍 Testando conexão do dispositivo com backend..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Verificar se há dispositivo conectado
echo "1️⃣ Verificando dispositivos..."
DEVICES=$(adb devices 2>/dev/null | grep -v "List of devices" | grep "device$" | awk '{print $1}' || echo "")

if [ -z "$DEVICES" ]; then
    echo -e "${RED}❌ Nenhum dispositivo conectado!${NC}"
    exit 1
fi

DEVICE=$(echo "$DEVICES" | head -1)
echo -e "${GREEN}✅ Dispositivo encontrado: $DEVICE${NC}"

# Detectar se é emulador ou físico
if [[ $DEVICE == emulator-* ]]; then
    BACKEND_URL="http://10.0.2.2:3000/api/v1/health"
    echo "   Tipo: Emulador"
    echo "   URL do backend: $BACKEND_URL"
else
    # Obter IP da máquina
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    BACKEND_URL="http://$LOCAL_IP:3000/api/v1/health"
    echo "   Tipo: Dispositivo Físico"
    echo "   IP da máquina: $LOCAL_IP"
    echo "   URL do backend: $BACKEND_URL"
fi
echo ""

# 2. Verificar se backend está acessível localmente
echo "2️⃣ Verificando backend localmente..."
if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend está rodando localmente${NC}"
else
    echo -e "${RED}❌ Backend não está rodando!${NC}"
    echo "   Inicie com: foreman start -f Procfile.dev web"
    exit 1
fi

# 3. Verificar se backend está escutando em 0.0.0.0
echo "3️⃣ Verificando se backend está acessível na rede..."
if netstat -tlnp 2>/dev/null | grep -q "0.0.0.0:3000" || ss -tlnp 2>/dev/null | grep -q "0.0.0.0:3000"; then
    echo -e "${GREEN}✅ Backend está escutando em 0.0.0.0:3000${NC}"
else
    echo -e "${RED}❌ Backend NÃO está acessível na rede!${NC}"
    echo "   Está escutando apenas em localhost (127.0.0.1)"
    echo "   Reinicie com: foreman start -f Procfile.dev web"
    exit 1
fi

# 4. Testar acesso pela rede (se dispositivo físico)
if [[ ! $DEVICE == emulator-* ]]; then
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    echo "4️⃣ Testando acesso pela rede (IP: $LOCAL_IP)..."
    if curl -s "http://$LOCAL_IP:3000/api/v1/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend acessível pela rede${NC}"
        HEALTH=$(curl -s "http://$LOCAL_IP:3000/api/v1/health")
        echo "   Resposta: $HEALTH"
    else
        echo -e "${RED}❌ Backend NÃO acessível pela rede!${NC}"
        echo "   Verifique firewall: sudo ufw allow 3000/tcp"
    fi
    echo ""
fi

# 5. Verificar logs do app
echo "5️⃣ Verificando logs do app..."
echo "   Procurando por erros de conexão..."
RECENT_ERRORS=$(adb logcat -d -s MainActivity:E 2>/dev/null | tail -5)
if [ -n "$RECENT_ERRORS" ]; then
    echo -e "${YELLOW}⚠️  Erros recentes encontrados:${NC}"
    echo "$RECENT_ERRORS"
else
    echo -e "${GREEN}✅ Nenhum erro recente encontrado${NC}"
fi
echo ""

# 6. Verificar URL injetada (se app estiver rodando)
echo "6️⃣ Para verificar URL injetada no app:"
echo "   1. Abra chrome://inspect no Chrome"
echo "   2. Clique em 'inspect' no WebView do app"
echo "   3. No console, digite: window.APP_API_BASE_URL"
echo ""

# 7. Teste manual via adb shell
echo "7️⃣ Testando conectividade do dispositivo..."
if [[ $DEVICE == emulator-* ]]; then
    echo "   Emulador: Testando acesso a 10.0.2.2:3000..."
    # Tentar fazer curl via adb shell (se curl estiver disponível)
    TEST_RESULT=$(adb shell "curl -s http://10.0.2.2:3000/api/v1/health 2>&1" 2>/dev/null || echo "curl não disponível")
    if echo "$TEST_RESULT" | grep -q "status"; then
        echo -e "${GREEN}✅ Dispositivo consegue acessar backend${NC}"
    else
        echo -e "${YELLOW}⚠️  Não foi possível testar diretamente (curl pode não estar disponível)${NC}"
    fi
else
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    echo "   Dispositivo físico: Testando acesso a $LOCAL_IP:3000..."
    TEST_RESULT=$(adb shell "curl -s http://$LOCAL_IP:3000/api/v1/health 2>&1" 2>/dev/null || echo "curl não disponível")
    if echo "$TEST_RESULT" | grep -q "status"; then
        echo -e "${GREEN}✅ Dispositivo consegue acessar backend${NC}"
    else
        echo -e "${YELLOW}⚠️  Não foi possível testar diretamente (curl pode não estar disponível)${NC}"
        echo "   Isso é normal - o teste real é via WebView no app"
    fi
fi
echo ""

# Resumo
echo -e "${BLUE}📋 Resumo:${NC}"
echo "=========="
echo "Dispositivo: $DEVICE"
if [[ $DEVICE == emulator-* ]]; then
    echo "Backend URL: http://10.0.2.2:3000/api/v1"
else
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    echo "Backend URL: http://$LOCAL_IP:3000/api/v1"
fi
echo ""
echo -e "${GREEN}✅ Teste concluído!${NC}"
echo ""
echo "Se ainda houver 'failed to fetch':"
echo "  1. Recompile o app: cd AndroidApp && ./gradlew assembleDebug"
echo "  2. Reinstale: adb install -r app/build/outputs/apk/debug/app-debug.apk"
echo "  3. Verifique logs: adb logcat -s MainActivity:D"
echo "  4. Inspecione WebView: chrome://inspect"

