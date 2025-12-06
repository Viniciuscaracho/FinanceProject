#!/bin/bash

# Script para detectar dispositivo Android (físico ou emulador)

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔍 Detectando dispositivos Android..."
echo ""

# Verificar se adb está disponível
if ! command -v adb &> /dev/null; then
    echo -e "${RED}❌ ADB não encontrado!${NC}"
    echo "Instale o Android SDK Platform Tools"
    exit 1
fi

# Listar dispositivos
DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | awk '{print $1}')

if [ -z "$DEVICES" ]; then
    echo -e "${RED}❌ Nenhum dispositivo conectado!${NC}"
    echo ""
    echo "Para conectar um dispositivo físico:"
    echo "1. Ative 'Opções do Desenvolvedor' no dispositivo"
    echo "2. Ative 'Depuração USB'"
    echo "3. Conecte o dispositivo via USB"
    echo "4. Autorize a depuração quando solicitado"
    echo ""
    echo "Ou inicie um emulador:"
    echo "./bin/start-android-emulator.sh"
    exit 1
fi

# Detectar tipo de dispositivo
echo -e "${GREEN}✅ Dispositivos encontrados:${NC}"
echo ""

for DEVICE in $DEVICES; do
    if [[ $DEVICE == emulator-* ]]; then
        DEVICE_TYPE="Emulador"
        DEVICE_NAME="$DEVICE"
    else
        DEVICE_TYPE="Físico"
        # Tentar obter nome do dispositivo
        DEVICE_NAME=$(adb -s $DEVICE shell getprop ro.product.model 2>/dev/null || echo "$DEVICE")
        DEVICE_NAME=$(echo $DEVICE_NAME | tr -d '\r')
    fi
    
    # Obter informações do dispositivo
    ANDROID_VERSION=$(adb -s $DEVICE shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
    API_LEVEL=$(adb -s $DEVICE shell getprop ro.build.version.sdk 2>/dev/null | tr -d '\r')
    
    echo -e "  ${YELLOW}📱 $DEVICE_TYPE: $DEVICE_NAME${NC}"
    echo "     ID: $DEVICE"
    echo "     Android: $ANDROID_VERSION (API $API_LEVEL)"
    echo ""
done

# Selecionar dispositivo (se houver múltiplos)
DEVICE_COUNT=$(echo "$DEVICES" | wc -l)
if [ $DEVICE_COUNT -gt 1 ]; then
    echo "Múltiplos dispositivos encontrados. Use o ID do dispositivo nos testes."
    echo "Exemplo: export APPIUM_DEVICE_NAME=<device-id>"
else
    SELECTED_DEVICE=$(echo $DEVICES | head -1)
    echo -e "${GREEN}✅ Usando dispositivo: $SELECTED_DEVICE${NC}"
    export APPIUM_DEVICE_NAME=$SELECTED_DEVICE
    echo "export APPIUM_DEVICE_NAME=$SELECTED_DEVICE"
fi

