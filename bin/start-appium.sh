#!/bin/bash

# Script para iniciar Appium com variáveis de ambiente configuradas

echo "🚀 Iniciando Appium Server..."
echo ""

# Configurar variáveis de ambiente Android
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

echo "📱 Configuração Android:"
echo "   ANDROID_HOME: $ANDROID_HOME"
echo "   ANDROID_SDK_ROOT: $ANDROID_SDK_ROOT"
echo ""

# Verificar se Android SDK existe
if [ ! -d "$ANDROID_HOME" ]; then
    echo "❌ Android SDK não encontrado em: $ANDROID_HOME"
    echo "   Instale o Android SDK ou ajuste ANDROID_HOME"
    exit 1
fi

# Verificar se emulador está rodando
if ! adb devices | grep -q "emulator.*device"; then
    echo "⚠️  Nenhum emulador rodando!"
    echo "   Execute: ./bin/start-android-emulator.sh"
    echo ""
fi

# Configurar ChromeDriver para download automático
# O Appium tentará baixar automaticamente o ChromeDriver correto
export CHROMEDRIVER_AUTO_DOWNLOAD=1

echo "✅ Iniciando Appium Server..."
echo "   Acesse em: http://localhost:4723"
echo "   ChromeDriver: Download automático habilitado"
echo ""

# Iniciar Appium
appium


