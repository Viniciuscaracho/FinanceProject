#!/bin/bash

# Script rápido para abrir o app no emulador já rodando

echo "🌐 Abrindo app no emulador..."

# Verificar se há emulador rodando
if ! adb devices | grep -q "emulator.*device"; then
    echo "❌ Nenhum emulador rodando!"
    echo "📝 Execute primeiro: ./bin/start-android-emulator.sh"
    exit 1
fi

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

# Tentar abrir no navegador padrão do emulador
echo "🚀 Abrindo http://10.0.2.2:5173 no emulador..."

# Tentar diferentes navegadores
BROWSERS=("com.android.browser" "com.android.chrome" "com.google.android.apps.chrome")

for browser in "${BROWSERS[@]}"; do
    if adb shell pm list packages | grep -q "$browser"; then
        echo "✅ Usando navegador: $browser"
        adb shell am start -a android.intent.action.VIEW -d "http://10.0.2.2:5173" "$browser" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ App aberto!"
            exit 0
        fi
    fi
done

# Se não conseguiu abrir automaticamente, mostrar instruções
echo "⚠️  Não foi possível abrir automaticamente"
echo ""
echo "📝 Abra manualmente:"
echo "   1. Abra o navegador no emulador"
echo "   2. Digite: http://10.0.2.2:5173"
echo ""
echo "💡 Ou use o comando:"
echo "   adb shell am start -a android.intent.action.VIEW -d 'http://10.0.2.2:5173'"

