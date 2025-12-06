#!/bin/bash

# Script para buildar o app Android

echo "🔨 Buildando app Android..."

cd "$(dirname "$0")/../AndroidApp" || exit 1

# Verificar se Android SDK está configurado
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME=$HOME/Android/Sdk
fi

export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Verificar se Gradle está disponível
if ! command -v gradle &> /dev/null; then
    echo "📦 Gradle não encontrado, usando gradlew wrapper..."
    if [ ! -f "./gradlew" ]; then
        echo "❌ gradlew não encontrado. Criando wrapper..."
        # Criar gradlew se não existir
        chmod +x gradlew 2>/dev/null || true
    fi
    GRADLE_CMD="./gradlew"
else
    GRADLE_CMD="gradle"
fi

echo "🚀 Executando build..."
$GRADLE_CMD clean assembleDebug

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📱 APK gerado em: AndroidApp/app/build/outputs/apk/debug/app-debug.apk"
else
    echo "❌ Erro no build"
    exit 1
fi

