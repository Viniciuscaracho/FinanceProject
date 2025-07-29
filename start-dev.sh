#!/bin/bash

echo "🚀 Iniciando ambiente de desenvolvimento..."

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Iniciar o backend (Rails)
echo "📦 Iniciando backend Rails..."
cd /home/baby/Documents/FinancialProject
./bin/dev &
BACKEND_PID=$!

# Aguardar o backend inicializar
echo "⏳ Aguardando backend inicializar..."
sleep 10

# Verificar se o backend está rodando
if curl -s http://localhost:3000/api/v1/health > /dev/null; then
    echo "✅ Backend iniciado com sucesso!"
else
    echo "❌ Erro ao iniciar o backend"
    exit 1
fi

# Iniciar o frontend (React)
echo "⚛️  Iniciando frontend React..."
cd FrontEnd
npm run dev &
FRONTEND_PID=$!

echo "🎉 Ambiente de desenvolvimento iniciado!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3000"
echo "📊 Admin: http://localhost:3000/admin"
echo ""
echo "Pressione Ctrl+C para parar todos os serviços"

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Manter o script rodando
wait 