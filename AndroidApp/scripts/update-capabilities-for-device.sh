#!/bin/bash

# Script para atualizar capabilities com UDID do dispositivo físico para uso no Appium Inspector

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CONFIG_DIR="$(cd "$(dirname "$0")/../config/appium" && pwd)"

echo -e "${BLUE}🔧 Configurando capabilities para dispositivo externo${NC}"
echo ""

# Verificar se adb está disponível
if ! command -v adb &> /dev/null; then
    echo -e "${RED}❌ ADB não encontrado!${NC}"
    echo "Instale o Android SDK Platform Tools"
    exit 1
fi

# Listar dispositivos físicos (não emuladores)
PHYSICAL_DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | awk '{print $1}' | grep -v "emulator-")

if [ -z "$PHYSICAL_DEVICES" ]; then
    echo -e "${RED}❌ Nenhum dispositivo físico conectado!${NC}"
    echo ""
    echo "Para conectar um dispositivo físico:"
    echo "1. Ative 'Opções do Desenvolvedor' no dispositivo"
    echo "2. Ative 'Depuração USB'"
    echo "3. Conecte o dispositivo via USB"
    echo "4. Autorize a depuração quando solicitado"
    exit 1
fi

# Selecionar dispositivo
DEVICE_COUNT=$(echo "$PHYSICAL_DEVICES" | wc -l)
if [ $DEVICE_COUNT -gt 1 ]; then
    echo -e "${YELLOW}⚠️  Múltiplos dispositivos físicos encontrados:${NC}"
    echo ""
    I=1
    for DEVICE in $PHYSICAL_DEVICES; do
        DEVICE_NAME=$(adb -s $DEVICE shell getprop ro.product.model 2>/dev/null | tr -d '\r' || echo "$DEVICE")
        echo "  $I. $DEVICE_NAME ($DEVICE)"
        I=$((I+1))
    done
    echo ""
    read -p "Selecione o número do dispositivo (1-$DEVICE_COUNT): " SELECTION
    SELECTED_DEVICE=$(echo "$PHYSICAL_DEVICES" | sed -n "${SELECTION}p")
else
    SELECTED_DEVICE=$(echo "$PHYSICAL_DEVICES" | head -1)
fi

DEVICE_NAME=$(adb -s $SELECTED_DEVICE shell getprop ro.product.model 2>/dev/null | tr -d '\r' || echo "$SELECTED_DEVICE")
ANDROID_VERSION=$(adb -s $SELECTED_DEVICE shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')

echo ""
echo -e "${GREEN}✅ Dispositivo selecionado:${NC}"
echo "   Nome: $DEVICE_NAME"
echo "   UDID: $SELECTED_DEVICE"
echo "   Android: $ANDROID_VERSION"
echo ""

# Função para atualizar capabilities
update_capabilities() {
    local file=$1
    local udid=$2
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Arquivo não encontrado: $file${NC}"
        return 1
    fi
    
    # Usar Python para atualizar o JSON de forma segura
    python3 << EOF
import json
import sys

file_path = "$file"
udid = "$udid"

try:
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    # Atualizar udid
    if 'appium:udid' in data:
        data['appium:udid'] = udid
    else:
        data['appium:udid'] = udid
    
    # Atualizar deviceName se necessário
    if 'appium:deviceName' in data:
        data['appium:deviceName'] = "Android Device"
    
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"✅ Atualizado: {file_path}")
except Exception as e:
    print(f"❌ Erro ao atualizar {file_path}: {e}", file=sys.stderr)
    sys.exit(1)
EOF
}

# Atualizar arquivos de capabilities
echo -e "${BLUE}📝 Atualizando arquivos de capabilities...${NC}"
echo ""

update_capabilities "$CONFIG_DIR/capabilities.json" "$SELECTED_DEVICE"
update_capabilities "$CONFIG_DIR/capabilities.webview.json" "$SELECTED_DEVICE"
update_capabilities "$CONFIG_DIR/capabilities.physical.json" "$SELECTED_DEVICE"

echo ""
echo -e "${GREEN}✅ Configuração concluída!${NC}"
echo ""
echo -e "${YELLOW}📋 Para usar no Appium Inspector:${NC}"
echo "   1. Abra o Appium Inspector"
echo "   2. Configure o servidor:"
echo "      Host: 127.0.0.1"
echo "      Port: 4723"
echo "   3. Use as capabilities do arquivo:"
echo "      $CONFIG_DIR/capabilities.json"
echo "   4. O campo 'appium:udid' já está configurado com: $SELECTED_DEVICE"
echo ""
echo -e "${BLUE}💡 Dica: Se precisar usar outro dispositivo, execute este script novamente.${NC}"

