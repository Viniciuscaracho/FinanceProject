#!/bin/bash

# Script para iniciar tudo: servidores e emulador

echo "🚀 Iniciando tudo..."
echo "===================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se as portas estão livres
check_port() {
    local port=$1
    if lsof -ti:$port >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Porta $port já está em uso${NC}"
        return 1
    fi
    return 0
}

# 1. Verificar portas
echo "1️⃣ Verificando portas..."
if ! check_port 3000; then
    echo "   Execute: ./bin/reset-all.sh para parar tudo primeiro"
    exit 1
fi

if ! check_port 5173; then
    echo "   Execute: ./bin/reset-all.sh para parar tudo primeiro"
    exit 1
fi

echo -e "   ${GREEN}✅ Portas livres${NC}"
echo ""

# 2. Iniciar servidor Rails
echo "2️⃣ Iniciando servidor Rails..."
cd /home/baby/Documents/BarberManagement

# Verificar se bin/dev existe
if [ -f "bin/dev" ]; then
    echo "   Iniciando com bin/dev (Rails + Frontend)..."
    nohup bin/dev > /tmp/barber-dev.log 2>&1 &
    DEV_PID=$!
    echo "   PID: $DEV_PID"
    echo "   Logs: tail -f /tmp/barber-dev.log"
else
    echo "   bin/dev não encontrado, iniciando separadamente..."
    
    # Iniciar Rails
    echo "   Iniciando Rails..."
    nohup bundle exec rails server > /tmp/rails.log 2>&1 &
    RAILS_PID=$!
    echo "   Rails PID: $RAILS_PID"
    
    # Iniciar Frontend
    echo "   Iniciando Frontend..."
    cd FrontEnd
    nohup pnpm dev > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "   Frontend PID: $FRONTEND_PID"
    cd ..
fi

echo -e "   ${GREEN}✅ Servidores iniciados${NC}"
echo ""

# 3. Aguardar servidores iniciarem
echo "3️⃣ Aguardando servidores iniciarem (10 segundos)..."
sleep 10

# Verificar se estão rodando
if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Backend está respondendo${NC}"
else
    echo -e "   ${YELLOW}⚠️  Backend ainda não está respondendo, aguarde mais um pouco${NC}"
fi

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Frontend está respondendo${NC}"
else
    echo -e "   ${YELLOW}⚠️  Frontend ainda não está respondendo, aguarde mais um pouco${NC}"
fi
echo ""

# 4. Iniciar emulador
echo "4️⃣ Iniciando emulador Android..."
if [ -f "bin/start-android-emulator.sh" ]; then
    echo "   Executando script de inicialização do emulador..."
    ./bin/start-android-emulator.sh &
    echo -e "   ${GREEN}✅ Emulador iniciando em background${NC}"
    echo "   Aguarde 1-2 minutos para o emulador iniciar completamente"
else
    echo -e "   ${YELLOW}⚠️  Script de emulador não encontrado${NC}"
    echo "   Execute manualmente: ./bin/start-android-emulator.sh"
fi
echo ""

# 5. Resumo
echo "📋 Resumo:"
echo "=========="
echo -e "${GREEN}✅ Tudo iniciado!${NC}"
echo ""
echo "Servidores:"
echo "  - Backend: http://localhost:3000"
echo "  - Frontend: http://localhost:5173"
echo ""
echo "Emulador:"
echo "  - Aguarde 1-2 minutos para iniciar"
echo "  - Acesse: http://10.0.2.2:5173 no emulador"
echo ""
echo "Logs:"
echo "  - Servidores: tail -f /tmp/barber-dev.log"
echo "  - Rails: tail -f /tmp/rails.log"
echo "  - Frontend: tail -f /tmp/frontend.log"
echo ""
echo "Para parar tudo:"
echo "  ./bin/reset-all.sh"
echo ""


