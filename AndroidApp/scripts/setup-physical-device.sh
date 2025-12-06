#!/bin/bash

# Script para configurar dispositivo físico Android para testes

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📱 Configuração de Dispositivo Físico Android${NC}"
echo "=========================================="
echo ""

# Verificar se adb está disponível
if ! command -v adb &> /dev/null; then
    echo -e "${RED}❌ ADB não encontrado!${NC}"
    echo "Instale o Android SDK Platform Tools"
    exit 1
fi

# Verificar se dispositivo está conectado
DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | awk '{print $1}')

if [ -z "$DEVICES" ]; then
    echo -e "${RED}❌ Nenhum dispositivo conectado!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Passos para conectar dispositivo físico:${NC}"
    echo ""
    echo "1. No seu dispositivo Android:"
    echo "   - Vá em Configurações → Sobre o telefone"
    echo "   - Toque 7 vezes em 'Número da versão' para ativar Opções do Desenvolvedor"
    echo ""
    echo "2. Ative as opções:"
    echo "   - Configurações → Sistema → Opções do Desenvolvedor"
    echo "   - Ative 'Depuração USB'"
    echo "   - Ative 'Instalar via USB' (se disponível)"
    echo ""
    echo "3. Conecte o dispositivo via USB"
    echo ""
    echo "4. No dispositivo, autorize a depuração quando solicitado"
    echo ""
    echo "5. Execute este script novamente"
    exit 1
fi

# Filtrar apenas dispositivos físicos (não emuladores)
PHYSICAL_DEVICES=""
for DEVICE in $DEVICES; do
    if [[ ! $DEVICE == emulator-* ]]; then
        PHYSICAL_DEVICES="$PHYSICAL_DEVICES $DEVICE"
    fi
done

if [ -z "$PHYSICAL_DEVICES" ]; then
    echo -e "${YELLOW}⚠️  Apenas emuladores encontrados${NC}"
    echo "Conecte um dispositivo físico via USB"
    exit 1
fi

echo -e "${GREEN}✅ Dispositivos físicos encontrados:${NC}"
echo ""

for DEVICE in $PHYSICAL_DEVICES; do
    DEVICE_NAME=$(adb -s $DEVICE shell getprop ro.product.model 2>/dev/null | tr -d '\r' || echo "Desconhecido")
    ANDROID_VERSION=$(adb -s $DEVICE shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
    API_LEVEL=$(adb -s $DEVICE shell getprop ro.build.version.sdk 2>/dev/null | tr -d '\r')
    MANUFACTURER=$(adb -s $DEVICE shell getprop ro.product.manufacturer 2>/dev/null | tr -d '\r')
    
    echo -e "  ${GREEN}📱 $MANUFACTURER $DEVICE_NAME${NC}"
    echo "     ID: $DEVICE"
    echo "     Android: $ANDROID_VERSION (API $API_LEVEL)"
    echo ""
done

# Se houver múltiplos dispositivos, usar o primeiro
SELECTED_DEVICE=$(echo $PHYSICAL_DEVICES | awk '{print $1}')
echo -e "${GREEN}✅ Usando dispositivo: $SELECTED_DEVICE${NC}"
echo ""

# Obter IP da máquina na rede local
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo -e "${YELLOW}📡 Configuração de Rede:${NC}"
echo "   IP da máquina: $LOCAL_IP"
echo "   Porta do frontend: 5173"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   O dispositivo físico precisa estar na mesma rede Wi-Fi que o PC"
echo "   E o app precisa ser configurado para usar: http://$LOCAL_IP:5173"
echo "   (ao invés de http://10.0.2.2:5173 que é para emulador)"
echo ""

# Verificar se o app está instalado
APP_INSTALLED=$(adb -s $SELECTED_DEVICE shell pm list packages | grep "com.barbermanagement.app.debug" || echo "")
if [ -z "$APP_INSTALLED" ]; then
    echo -e "${YELLOW}⚠️  App não encontrado no dispositivo${NC}"
    echo "   Instale o app primeiro com: ./bin/install-android-app.sh"
    echo ""
fi

# Exportar variável de ambiente
export APPIUM_DEVICE_NAME=$SELECTED_DEVICE
echo -e "${GREEN}✅ Variável de ambiente configurada:${NC}"
echo "   export APPIUM_DEVICE_NAME=$SELECTED_DEVICE"
echo ""
echo -e "${BLUE}💡 Para usar este dispositivo nos testes:${NC}"
echo "   export APPIUM_DEVICE_NAME=$SELECTED_DEVICE"
echo "   cd AndroidApp/tests/java"
echo "   ./../../gradlew test"
echo ""

