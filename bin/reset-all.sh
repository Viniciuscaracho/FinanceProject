#!/bin/bash

# Script para resetar tudo: servidores e emulador

echo "🔄 Resetando tudo..."
echo "===================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para matar processos na porta
kill_port() {
    local port=$1
    local name=$2
    echo -n "   Parando $name na porta $port... "
    
    # Encontrar e matar processos na porta
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pids" ]; then
        kill -9 $pids 2>/dev/null
        sleep 1
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${YELLOW}⚠️  Nenhum processo encontrado${NC}"
    fi
}

# 1. Parar emulador
echo "1️⃣ Parando emulador Android..."
if adb devices | grep -q "emulator.*device"; then
    echo "   Emulador encontrado, parando..."
    adb emu kill 2>/dev/null
    sleep 2
    
    # Verificar se ainda está rodando
    if adb devices | grep -q "emulator.*device"; then
        echo -e "   ${YELLOW}⚠️  Emulador ainda rodando, forçando parada...${NC}"
        pkill -9 qemu-system 2>/dev/null
        pkill -9 emulator 2>/dev/null
    fi
    echo -e "   ${GREEN}✅ Emulador parado${NC}"
else
    echo -e "   ${YELLOW}⚠️  Nenhum emulador rodando${NC}"
fi
echo ""

# 2. Parar servidor Rails (porta 3000)
echo "2️⃣ Parando servidor Rails (porta 3000)..."
kill_port 3000 "Rails"
echo ""

# 3. Parar servidor Frontend (porta 5173)
echo "3️⃣ Parando servidor Frontend (porta 5173)..."
kill_port 5173 "Vite/Frontend"
echo ""

# 4. Parar outros processos relacionados
echo "4️⃣ Parando outros processos relacionados..."
pkill -9 rails 2>/dev/null
pkill -9 puma 2>/dev/null
pkill -9 node 2>/dev/null
pkill -9 vite 2>/dev/null
pkill -9 pnpm 2>/dev/null
sleep 1
echo -e "   ${GREEN}✅ Processos relacionados parados${NC}"
echo ""

# 5. Limpar processos do ADB
echo "5️⃣ Limpando processos ADB..."
adb kill-server 2>/dev/null
sleep 1
adb start-server 2>/dev/null
echo -e "   ${GREEN}✅ ADB reiniciado${NC}"
echo ""

# 6. Verificar se tudo foi parado
echo "6️⃣ Verificando se tudo foi parado..."
echo ""

# Verificar porta 3000
if lsof -ti:3000 >/dev/null 2>&1; then
    echo -e "   ${RED}❌ Ainda há processos na porta 3000${NC}"
else
    echo -e "   ${GREEN}✅ Porta 3000 livre${NC}"
fi

# Verificar porta 5173
if lsof -ti:5173 >/dev/null 2>&1; then
    echo -e "   ${RED}❌ Ainda há processos na porta 5173${NC}"
else
    echo -e "   ${GREEN}✅ Porta 5173 livre${NC}"
fi

# Verificar emulador
if adb devices | grep -q "emulator.*device"; then
    echo -e "   ${RED}❌ Emulador ainda rodando${NC}"
else
    echo -e "   ${GREEN}✅ Emulador parado${NC}"
fi
echo ""

# 7. Aguardar um pouco
echo "7️⃣ Aguardando 3 segundos..."
sleep 3
echo ""

# 8. Resumo
echo "📋 Resumo:"
echo "=========="
echo -e "${GREEN}✅ Reset completo!${NC}"
echo ""
echo "Agora você pode:"
echo "  1. Iniciar servidores: bin/dev"
echo "  2. Iniciar emulador: ./bin/start-android-emulator.sh"
echo ""
echo "Ou executar tudo de uma vez:"
echo "  ./bin/start-all.sh"
echo ""


