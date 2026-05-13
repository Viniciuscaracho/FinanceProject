#!/bin/bash

PROJECT_DIR="/home/baby/Documents/BarberManagement"

echo "🚀 Iniciando ambiente de desenvolvimento..."

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Configurar ADB reverse para celular via USB
echo "📱 Verificando dispositivo Android conectado via USB..."
if command -v adb > /dev/null 2>&1; then
    ADB_DEVICES=$(adb devices | grep -v "List of devices" | grep -c "device$")
    if [ "$ADB_DEVICES" -gt 0 ]; then
        adb reverse tcp:5173 tcp:5173 > /dev/null 2>&1
        echo "✅ Dispositivo Android detectado! Porta redirecionada via USB."
        echo "   Acesse no celular: http://localhost:5173"
    else
        echo "⚠️  Nenhum dispositivo USB detectado."
        echo "   Para acesso via Wi-Fi: http://192.168.0.31:5173"
    fi
else
    echo "⚠️  ADB não instalado. Sem suporte a USB."
fi

# Iniciar o backend (Rails)
echo "📦 Iniciando backend Rails..."
cd "$PROJECT_DIR" || exit 1
./bin/dev &
BACKEND_PID=$!

# Aguardar o backend inicializar
echo "⏳ Aguardando backend inicializar..."
sleep 10

# Verificar se o backend está rodando
if curl -s http://localhost:3000/api/v1/health > /dev/null; then
    echo "✅ Backend iniciado com sucesso!"
else
    echo "⚠️  Backend pode ainda estar subindo, continuando..."
fi

# Iniciar o frontend (React/Vite)
echo "⚛️  Iniciando frontend React..."
cd "$PROJECT_DIR/FrontEnd" || exit 1
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Ambiente de desenvolvimento iniciado!"
echo "📱 Frontend (celular USB): http://localhost:5173"
echo "🔧 Backend:                http://localhost:3000"
echo "📊 Admin:                  http://localhost:3000/admin"
echo ""
echo "Pressione Ctrl+C para parar todos os serviços"

# Limpar processos e redirecionamentos ADB ao sair
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    if command -v adb > /dev/null 2>&1; then
        adb reverse --remove tcp:5173 > /dev/null 2>&1
    fi
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

wait
