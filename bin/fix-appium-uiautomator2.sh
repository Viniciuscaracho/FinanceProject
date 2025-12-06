#!/bin/bash

# Script para corrigir problemas do UiAutomator2 que crashou
# Uso: ./bin/fix-appium-uiautomator2.sh

echo "🔧 Corrigindo UiAutomator2 Server..."
echo "===================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se há dispositivo conectado
echo -e "${BLUE}1️⃣ Verificando dispositivos conectados...${NC}"
DEVICES=$(adb devices | grep "device$" | grep -v "List" | awk '{print $1}')
if [ -z "$DEVICES" ]; then
    echo -e "   ${RED}❌ Nenhum dispositivo encontrado!${NC}"
    echo "   Execute: ./bin/start-android-emulator.sh"
    exit 1
else
    DEVICE=$(echo $DEVICES | head -1)
    echo -e "   ${GREEN}✅ Dispositivo encontrado: $DEVICE${NC}"
fi
echo ""

# Parar processos UiAutomator2 no dispositivo
echo -e "${BLUE}2️⃣ Limpando processos UiAutomator2 no dispositivo...${NC}"

# Matar processos relacionados ao UiAutomator2
adb -s $DEVICE shell "am force-stop io.appium.uiautomator2.server" 2>/dev/null
adb -s $DEVICE shell "am force-stop io.appium.uiautomator2.server.test" 2>/dev/null
sleep 1
echo -e "   ${GREEN}✅ Processos UiAutomator2 parados${NC}"

# Desinstalar servidor UiAutomator2 (será reinstalado pelo Appium)
echo -e "${BLUE}3️⃣ Desinstalando servidor UiAutomator2 do dispositivo...${NC}"
adb -s $DEVICE uninstall io.appium.uiautomator2.server 2>/dev/null
adb -s $DEVICE uninstall io.appium.uiautomator2.server.test 2>/dev/null
sleep 1
echo -e "   ${GREEN}✅ Servidor UiAutomator2 desinstalado${NC}"
echo ""

# Limpar cache do dispositivo
echo -e "${BLUE}4️⃣ Limpando cache do dispositivo...${NC}"
adb -s $DEVICE shell "pm clear io.appium.uiautomator2.server" 2>/dev/null
adb -s $DEVICE shell "pm clear io.appium.uiautomator2.server.test" 2>/dev/null
echo -e "   ${GREEN}✅ Cache limpo${NC}"
echo ""

# Verificar e parar Appium Server
echo -e "${BLUE}5️⃣ Verificando Appium Server...${NC}"
if curl -s http://localhost:4723/status > /dev/null 2>&1; then
    echo -e "   ${YELLOW}⚠️  Appium Server está rodando${NC}"
    echo "   Recomendado: Pare o Appium Server e reinicie"
    echo ""
    read -p "   Deseja parar o Appium Server agora? (s/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        echo "   Parando Appium Server..."
        pkill -f "appium" 2>/dev/null
        sleep 2
        echo -e "   ${GREEN}✅ Appium Server parado${NC}"
        echo ""
        echo -e "   ${YELLOW}💡 Reinicie o Appium Server com:${NC}"
        echo "      ./bin/start-appium.sh"
        echo "      ou"
        echo "      appium"
    fi
else
    echo -e "   ${YELLOW}⚠️  Appium Server não está rodando${NC}"
    echo "   Isso é normal se você vai iniciar depois"
fi
echo ""

# Limpar logs antigos do UiAutomator2
echo -e "${BLUE}6️⃣ Limpando logs do UiAutomator2...${NC}"
adb -s $DEVICE logcat -c 2>/dev/null
echo -e "   ${GREEN}✅ Logs limpos${NC}"
echo ""

# Reiniciar ADB
echo -e "${BLUE}7️⃣ Reiniciando ADB...${NC}"
adb kill-server 2>/dev/null
sleep 1
adb start-server 2>/dev/null
sleep 1
echo -e "   ${GREEN}✅ ADB reiniciado${NC}"
echo ""

# Verificar se dispositivo ainda está conectado
echo -e "${BLUE}8️⃣ Verificando conexão final...${NC}"
if adb devices | grep -q "$DEVICE.*device"; then
    echo -e "   ${GREEN}✅ Dispositivo ainda conectado: $DEVICE${NC}"
else
    echo -e "   ${RED}❌ Dispositivo desconectado!${NC}"
    echo "   Reconecte o dispositivo ou reinicie o emulador"
    exit 1
fi
echo ""

# Resumo e próximos passos
echo "=================================="
echo -e "${GREEN}✅ Limpeza concluída!${NC}"
echo "=================================="
echo ""
echo "📋 Próximos Passos:"
echo ""
echo "1. Inicie o Appium Server:"
echo -e "   ${BLUE}./bin/start-appium.sh${NC}"
echo "   ou"
echo -e "   ${BLUE}appium${NC}"
echo ""
echo "2. Aguarde o servidor iniciar completamente"
echo ""
echo "3. Crie uma nova sessão no Appium Inspector ou seu teste"
echo ""
echo "4. O UiAutomator2 será reinstalado automaticamente na primeira sessão"
echo ""
echo "💡 Dicas:"
echo "   - Se o problema persistir, tente reiniciar o emulador:"
echo -e "     ${BLUE}adb -s $DEVICE reboot${NC}"
echo ""
echo "   - Para ver logs em tempo real:"
echo -e "     ${BLUE}adb -s $DEVICE logcat | grep -i uiautomator${NC}"
echo ""
echo "   - Para verificar se o servidor foi instalado:"
echo -e "     ${BLUE}adb -s $DEVICE shell pm list packages | grep appium${NC}"
echo ""



