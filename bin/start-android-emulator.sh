#!/bin/bash

# Script para iniciar emulador Android e abrir o app

echo "🤖 Iniciando Emulador Android..."

# Verificar se Android SDK está instalado
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ANDROID_HOME não está definido"
    echo "📝 Configure o ANDROID_HOME apontando para o diretório do Android SDK"
    echo "   Exemplo: export ANDROID_HOME=\$HOME/Android/Sdk"
    echo ""
    echo "🔍 Tentando encontrar Android SDK em locais comuns..."
    
    # Tentar encontrar em locais comuns
    POSSIBLE_PATHS=(
        "$HOME/Android/Sdk"
        "$HOME/Library/Android/sdk"
        "/opt/android-sdk"
        "/usr/local/android-sdk"
    )
    
    # Verificar se já existe em ~/Android/Sdk (mais comum)
    if [ -d "$HOME/Android/Sdk" ] && [ -d "$HOME/Android/Sdk/emulator" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
        export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"
        echo "✅ Usando Android SDK em: $ANDROID_HOME"
    fi
    
    for path in "${POSSIBLE_PATHS[@]}"; do
        if [ -d "$path" ] && [ -d "$path/emulator" ]; then
            echo "✅ Encontrado em: $path"
            export ANDROID_HOME="$path"
            export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"
            break
        fi
    done
fi

# Verificar se emulador está disponível
if ! command -v emulator &> /dev/null && [ -n "$ANDROID_HOME" ]; then
    export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"
fi

# Listar AVDs disponíveis
echo ""
echo "📱 AVDs disponíveis:"
if command -v emulator &> /dev/null; then
    emulator -list-avds
    echo ""
    read -p "Digite o nome do AVD que deseja iniciar (ou pressione Enter para o primeiro): " AVD_NAME
    
    if [ -z "$AVD_NAME" ]; then
        AVD_NAME=$(emulator -list-avds | head -1)
    fi
    
    if [ -z "$AVD_NAME" ]; then
        echo "❌ Nenhum AVD encontrado!"
        echo "📝 Crie um AVD no Android Studio: Tools → Device Manager → Create Device"
        exit 1
    fi
    
    echo "🚀 Iniciando emulador: $AVD_NAME"
    emulator -avd "$AVD_NAME" &
    EMULATOR_PID=$!
    
    echo "⏳ Aguardando emulador iniciar (pode levar 1-2 minutos)..."
    
    # Aguardar emulador estar pronto
    timeout=120
    counter=0
    while ! adb devices | grep -q "emulator.*device"; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            echo "❌ Timeout aguardando emulador iniciar"
            exit 1
        fi
        echo -n "."
    done
    
    echo ""
    echo "✅ Emulador iniciado!"
    
    # Aguardar mais um pouco para garantir que está totalmente pronto
    sleep 5
    
    # Verificar se backend está rodando
    if ! curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
        echo "⚠️  Backend não está rodando na porta 3000"
        echo "📝 Inicie o backend com: bin/dev ou rails server"
    fi
    
    # Verificar se frontend está rodando
    if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "⚠️  Frontend não está rodando na porta 5173"
        echo "📝 Inicie o frontend com: cd FrontEnd && pnpm dev"
    fi
    
    # Abrir navegador no emulador
    echo ""
    echo "🌐 Abrindo app no emulador..."
    adb shell am start -a android.intent.action.VIEW -d "http://10.0.2.2:5173" com.android.browser
    
    if [ $? -eq 0 ]; then
        echo "✅ App aberto no navegador do emulador!"
        echo "📱 URL: http://10.0.2.2:5173"
    else
        echo "⚠️  Não foi possível abrir automaticamente"
        echo "📝 Abra manualmente o navegador no emulador e acesse: http://10.0.2.2:5173"
    fi
    
    echo ""
    echo "🎉 Emulador rodando!"
    echo "📱 Para parar o emulador, pressione Ctrl+C ou feche a janela"
    echo ""
    echo "💡 Dicas:"
    echo "   - Frontend: http://10.0.2.2:5173"
    echo "   - API: http://10.0.2.2:3000"
    echo "   - Para ver logs: adb logcat"
    
    # Manter script rodando
    wait $EMULATOR_PID
else
    echo "❌ Emulador não encontrado!"
    echo ""
    echo "📝 Instale o Android SDK:"
    echo "   1. Baixe o Android Studio: https://developer.android.com/studio"
    echo "   2. Instale o Android SDK via Android Studio"
    echo "   3. Configure ANDROID_HOME:"
    echo "      export ANDROID_HOME=\$HOME/Android/Sdk"
    echo "      export PATH=\$PATH:\$ANDROID_HOME/emulator:\$ANDROID_HOME/platform-tools"
    echo "   4. Crie um AVD: Tools → Device Manager → Create Device"
    echo ""
    echo "🔧 Ou use o Android Studio para iniciar o emulador manualmente"
fi

