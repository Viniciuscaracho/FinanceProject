#!/bin/bash

# Script para instalar o app Android no emulador/dispositivo

echo "📱 Instalando app Android..."

cd "$(dirname "$0")/.." || exit 1

# Verificar se Android SDK está configurado
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME=$HOME/Android/Sdk
fi

export PATH=$PATH:$ANDROID_HOME/platform-tools

APK_PATH="AndroidApp/app/build/outputs/apk/debug/app-debug.apk"

# Verificar se APK existe
if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK não encontrado. Buildando primeiro..."
    ./bin/build-android-app.sh
fi

# Verificar se há dispositivo conectado
if ! adb devices | grep -q "device$"; then
    echo "❌ Nenhum dispositivo/emulador conectado!"
    echo "📝 Inicie o emulador primeiro: ./bin/start-android-emulator.sh"
    exit 1
fi

echo "🚀 Instalando APK..."
adb install -r "$APK_PATH"

if [ $? -eq 0 ]; then
    echo "✅ App instalado com sucesso!"
    echo "🎯 Para abrir o app:"
    echo "   adb shell am start -n com.barbermanagement.app.debug/com.barbermanagement.app.MainActivity"
    
    # Abrir app automaticamente
    read -p "Deseja abrir o app agora? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        adb shell am start -n com.barbermanagement.app.debug/com.barbermanagement.app.MainActivity
    fi
else
    echo "❌ Erro ao instalar app"
    exit 1
fi

