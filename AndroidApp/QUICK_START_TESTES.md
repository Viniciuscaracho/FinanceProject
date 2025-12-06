# ⚡ Quick Start - Testes E2E

## 🚀 Iniciar Tudo de Uma Vez

```bash
# 1. Iniciar ambiente completo
./bin/start-test-environment.sh

# 2. Aguardar ~10 segundos para serviços iniciarem

# 3. Configurar dispositivo
export APPIUM_DEVICE_NAME=$(adb devices | grep -v emulator | grep device | awk '{print $1}' | head -1)

# 4. Executar testes
cd AndroidApp/tests/java
./../../gradlew test
```

## ✅ Verificar se Está Tudo Pronto

```bash
# Backend
curl http://localhost:3000/api/v1/health

# Frontend  
curl http://localhost:5173

# Appium
curl http://localhost:4723/status

# Dispositivo
adb devices
```

## 📱 Configuração Automática

O sistema detecta automaticamente:
- ✅ **Emulador vs Dispositivo Físico** - Ajusta URLs automaticamente
- ✅ **IP do Backend** - Frontend detecta e usa IP correto
- ✅ **Device Name** - Usa variável de ambiente ou detecta automaticamente

## 🎯 Testes que Precisam de Backend

Todos os testes de **login real** precisam do backend:
- `testLoginSimpleSuccess` ✅
- `testLoginWithInvalidCredentials` ✅  
- `testCreateTestUser` ✅

O teste `testLoginPageLoads` não precisa (apenas verifica UI).

## 🐛 Problemas Comuns

**Backend não acessível?**
```bash
bin/rails server -p 3000 -b 0.0.0.0
```

**Frontend não carrega?**
```bash
cd FrontEnd && pnpm dev
```

**Appium não conecta?**
```bash
appium --allow-insecure chromedriver_autodownload
```

