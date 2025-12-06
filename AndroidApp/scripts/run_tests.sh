#!/bin/bash

# Script para executar testes Appium
# Uso: ./scripts/run_tests.sh [python|java] [test_file]

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diretório base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BASE_DIR"

# Parâmetros
LANGUAGE=${1:-python}
TEST_FILE=${2:-""}

echo -e "${GREEN}🧪 Executando Testes Appium${NC}"
echo "================================"
echo ""

# Verificar se Appium está rodando
echo -e "${YELLOW}Verificando Appium Server...${NC}"
if ! curl -s http://localhost:4723/status > /dev/null; then
    echo -e "${RED}❌ Appium Server não está rodando!${NC}"
    echo "Execute: ./bin/start-appium.sh"
    exit 1
fi
echo -e "${GREEN}✅ Appium Server está rodando${NC}"
echo ""

# Verificar se emulador está conectado
echo -e "${YELLOW}Verificando emulador...${NC}"
if ! adb devices | grep -q "emulator.*device"; then
    echo -e "${RED}❌ Nenhum emulador conectado!${NC}"
    echo "Execute: ./bin/start-android-emulator.sh"
    exit 1
fi
DEVICE=$(adb devices | grep "emulator" | head -1 | awk '{print $1}')
echo -e "${GREEN}✅ Emulador conectado: $DEVICE${NC}"
echo ""

# Executar testes baseado na linguagem
if [ "$LANGUAGE" == "python" ]; then
    echo -e "${YELLOW}Executando testes Python...${NC}"
    
    # Verificar se há ambiente virtual
    if [ ! -d "tests/python/venv" ]; then
        echo "Criando ambiente virtual..."
        cd tests/python
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        cd ../..
    else
        source tests/python/venv/bin/activate
    fi
    
    # Executar testes
    cd tests/python
    if [ -z "$TEST_FILE" ]; then
        pytest e2e/ -v --html=e2e/reports/report.html
    else
        pytest "$TEST_FILE" -v --html=e2e/reports/report.html
    fi
    
elif [ "$LANGUAGE" == "java" ]; then
    echo -e "${YELLOW}Executando testes Java...${NC}"
    
    # Voltar para diretório base
    cd "$BASE_DIR"
    
    # Executar testes com Gradle
    if [ -z "$TEST_FILE" ]; then
        ./gradlew test --tests "com.barbermanagement.tests.*"
    else
        ./gradlew test --tests "$TEST_FILE"
    fi
else
    echo -e "${RED}❌ Linguagem não suportada: $LANGUAGE${NC}"
    echo "Use: python ou java"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Testes concluídos!${NC}"

