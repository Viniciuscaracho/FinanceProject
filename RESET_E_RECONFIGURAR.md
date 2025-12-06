# 🔄 Reset e Reconfiguração Completa do Ambiente

## 🚀 Solução Rápida

Para **reiniciar tudo e reconfigurar** o ambiente de testes, execute:

```bash
./bin/reset-and-reconfigure.sh
```

Este script faz **TUDO** automaticamente:
1. ✅ Para todos os serviços (Backend, Frontend, Appium, Emulador)
2. ✅ Limpa processos e portas
3. ✅ Reinicia ADB
4. ✅ Configura variáveis de ambiente
5. ✅ Verifica pré-requisitos
6. ✅ Inicia todos os serviços na ordem correta
7. ✅ Verifica se tudo está funcionando

## 📋 O que o script faz

### Fase 1: Parar Tudo
- Para emulador Android
- Para Appium (porta 4723)
- Para Backend Rails (porta 3000)
- Para Frontend Vite (porta 5173)
- Limpa processos relacionados
- Reinicia ADB

### Fase 2: Configurar Variáveis
- Configura `ANDROID_HOME`
- Configura `ANDROID_SDK_ROOT`
- Adiciona Android SDK ao PATH

### Fase 3: Verificar Pré-requisitos
- Verifica Bundler (Ruby)
- Verifica pnpm (Node)
- Verifica Appium
- Verifica Android Emulator
- Lista AVDs disponíveis

### Fase 4: Iniciar Serviços
- Inicia Backend Rails (com foreman, escuta em 0.0.0.0)
- Inicia Frontend Vite
- Inicia Appium Server
- Inicia Emulador Android

### Fase 5: Verificar Ambiente
- Testa conexão com Backend
- Testa conexão com Frontend
- Testa conexão com Appium
- Lista dispositivos conectados

## 📝 Uso

### Reset Completo (Recomendado)

```bash
# Na raiz do projeto
./bin/reset-and-reconfigure.sh
```

### Verificar Ambiente Após Reset

```bash
cd AndroidApp/tests/java
./check-environment.sh
```

### Executar Testes

```bash
cd AndroidApp/tests/java

# Teste de conexão
./../../gradlew test --tests "*LoginTest.testBackendConnection"

# Todos os testes
./../../gradlew test
```

## 🔍 Logs

Todos os logs são salvos em `/tmp/`:

```bash
# Backend
tail -f /tmp/rails.log

# Frontend
tail -f /tmp/vite.log

# Appium
tail -f /tmp/appium.log

# Emulador
tail -f /tmp/emulator.log
```

## ⚠️ Troubleshooting

### Problema: Script não executa

```bash
# Dar permissão de execução
chmod +x bin/reset-and-reconfigure.sh
```

### Problema: Portas ainda em uso

O script tenta parar tudo, mas se ainda houver problemas:

```bash
# Parar manualmente
pkill -9 rails puma vite node pnpm appium
pkill -9 qemu-system emulator

# Verificar portas
lsof -ti:3000
lsof -ti:5173
lsof -ti:4723
```

### Problema: Emulador não inicia

1. Verificar se há AVDs:
   ```bash
   emulator -list-avds
   ```

2. Se não houver, criar no Android Studio:
   - Tools → Device Manager → Create Device

3. Verificar variáveis de ambiente:
   ```bash
   echo $ANDROID_HOME
   ```

### Problema: Backend não acessível na rede

O script usa `foreman` que deve escutar em `0.0.0.0:3000`. Se não funcionar:

```bash
# Verificar se está escutando em 0.0.0.0
netstat -tlnp | grep :3000

# Se mostrar 127.0.0.1:3000, parar e reiniciar
pkill -9 rails puma
foreman start -f Procfile.dev web
```

## 📊 Status dos Serviços

Após executar o script, você verá:

```
✅ Backend está respondendo
✅ Frontend está respondendo
✅ Appium está respondendo
✅ Dispositivos encontrados: emulator-5554
```

## 🎯 Próximos Passos

1. **Executar o reset:**
   ```bash
   ./bin/reset-and-reconfigure.sh
   ```

2. **Aguardar emulador iniciar** (1-2 minutos)

3. **Verificar ambiente:**
   ```bash
   cd AndroidApp/tests/java
   ./check-environment.sh
   ```

4. **Executar testes:**
   ```bash
   ./../../gradlew test --tests "*LoginTest.testBackendConnection"
   ```

## 💡 Dicas

- O script é **idempotente**: pode executar várias vezes sem problemas
- Se algo falhar, o script mostra exatamente o que está errado
- Todos os serviços são iniciados em **background** (nohup)
- Os logs são salvos em `/tmp/` para fácil acesso

## 🔄 Outros Scripts Úteis

- `./bin/reset-all.sh` - Apenas para tudo (não reinicia)
- `./bin/start-all.sh` - Inicia tudo (sem parar antes)
- `./bin/start-test-environment.sh` - Inicia ambiente de testes
- `AndroidApp/tests/java/check-environment.sh` - Verifica ambiente

