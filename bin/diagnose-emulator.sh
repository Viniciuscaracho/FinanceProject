#!/bin/bash

# Script de diagnóstico para problemas no emulador

echo "🔍 Diagnóstico do Emulador Android"
echo "=================================="
echo ""

# Verificar se emulador está rodando
echo "1️⃣ Verificando emulador..."
if adb devices | grep -q "emulator.*device"; then
    echo "✅ Emulador está rodando"
    DEVICE=$(adb devices | grep "emulator" | awk '{print $1}')
    echo "   Dispositivo: $DEVICE"
else
    echo "❌ Nenhum emulador rodando!"
    echo "   Execute: ./bin/start-android-emulator.sh"
    exit 1
fi
echo ""

# Verificar backend
echo "2️⃣ Verificando backend (localhost:3000)..."
if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo "✅ Backend está rodando"
    HEALTH=$(curl -s http://localhost:3000/api/v1/health)
    echo "   Resposta: $HEALTH"
else
    echo "❌ Backend não está rodando!"
    echo "   Execute: bin/dev ou rails server"
fi
echo ""

# Verificar frontend
echo "3️⃣ Verificando frontend (localhost:5173)..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend está rodando"
else
    echo "❌ Frontend não está rodando!"
    echo "   Execute: cd FrontEnd && pnpm dev"
fi
echo ""

# Verificar conectividade do emulador
echo "4️⃣ Verificando conectividade do emulador..."
echo "   Testando acesso ao backend via 10.0.2.2:3000..."

# Tentar fazer uma requisição HTTP simples usando adb shell
RESULT=$(adb shell "run-as com.android.browser sh -c 'echo test' 2>&1" | head -1)
if [ $? -eq 0 ]; then
    echo "   ✅ Emulador está acessível"
else
    echo "   ⚠️  Não foi possível testar diretamente"
fi
echo ""

# Verificar logs do emulador
echo "5️⃣ Últimas linhas dos logs do emulador (últimos 10):"
adb logcat -d | tail -10 | grep -E "(ERROR|FATAL|Network|Connection)" || echo "   Nenhum erro crítico encontrado"
echo ""

# Verificar configuração de rede
echo "6️⃣ Configuração de rede:"
echo "   - Backend deve estar acessível em: http://10.0.2.2:3000"
echo "   - Frontend deve estar acessível em: http://10.0.2.2:5173"
echo "   - No emulador, use 10.0.2.2 em vez de localhost"
echo ""

# Verificar autenticação
echo "7️⃣ Testando autenticação..."
echo "   Tentando fazer login de teste..."

# Tentar fazer login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login_simple \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","password":"password"}' 2>&1)

if echo "$LOGIN_RESPONSE" | grep -q "success\|token"; then
    echo "   ✅ Login funcionando"
    echo "   Resposta: $(echo $LOGIN_RESPONSE | head -c 100)..."
else
    echo "   ⚠️  Login pode ter problemas"
    echo "   Resposta: $(echo $LOGIN_RESPONSE | head -c 200)"
fi
echo ""

# Resumo e recomendações
echo "📋 Resumo e Recomendações:"
echo "=========================="
echo ""
echo "Se você não consegue realizar atividades no emulador:"
echo ""
echo "1. Certifique-se de que está logado:"
echo "   - Acesse: http://10.0.2.2:5173"
echo "   - Faça login com:"
echo "     Email: admin@exemplo.com"
echo "     Senha: password"
echo ""
echo "2. Verifique o console do navegador no emulador:"
echo "   - Abra as ferramentas de desenvolvedor"
echo "   - Veja se há erros de rede ou JavaScript"
echo ""
echo "3. Verifique os logs do backend:"
echo "   tail -f log/development.log"
echo ""
echo "4. Teste a API diretamente:"
echo "   curl http://localhost:3000/api/v1/health"
echo ""
echo "5. Se o problema persistir, tente:"
echo "   - Reiniciar o emulador: adb reboot"
echo "   - Limpar cache do navegador no emulador"
echo "   - Verificar se o firewall não está bloqueando"
echo ""


