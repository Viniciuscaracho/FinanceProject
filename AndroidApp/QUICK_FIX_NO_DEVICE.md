# 🚨 Fix Rápido: "Could not find a connected Android device"

## Problema
```
Could not find a connected Android device in 20000ms
```

## Solução Rápida

### Opção 1: Iniciar Emulador (Recomendado)

```bash
# Na raiz do projeto
./bin/start-android-emulator.sh
```

Este script:
- Lista AVDs disponíveis
- Inicia o emulador automaticamente
- Aguarda até estar pronto

### Opção 2: Verificar Ambiente Completo

```bash
# Verificar tudo de uma vez
cd AndroidApp/tests/java
./check-environment.sh
```

Este script verifica:
- ✅ Dispositivos conectados
- ✅ Appium rodando
- ✅ Backend rodando
- ✅ Frontend rodando
- ✅ Variáveis de ambiente

## Passo a Passo Manual

### 1. Iniciar Emulador

```bash
# Verificar AVDs disponíveis
emulator -list-avds

# Iniciar emulador (substitua pelo nome do seu AVD)
emulator -avd Medium_Phone_API_36.0 &

# Aguardar emulador iniciar (pode levar 1-2 minutos)
adb wait-for-device
```

### 2. Verificar se Emulador Está Pronto

```bash
# Deve mostrar o emulador como "device"
adb devices
```

Saída esperada:
```
List of devices attached
emulator-5554    device
```

### 3. Verificar Appium

```bash
# Verificar se está rodando
curl http://localhost:4723/status

# Se não estiver, iniciar:
./bin/start-appium.sh
```

### 4. Executar Testes

```bash
cd AndroidApp/tests/java
./../../gradlew test
```

## Troubleshooting

### Problema: "adb server version doesn't match"

```bash
# Parar servidor ADB
adb kill-server

# Reiniciar
adb start-server

# Verificar dispositivos
adb devices
```

### Problema: Emulador não inicia

1. Verificar se há AVDs criados:
   ```bash
   emulator -list-avds
   ```

2. Se não houver, criar no Android Studio:
   - Abrir Android Studio
   - Tools → Device Manager
   - Create Device
   - Escolher um dispositivo (ex: Pixel 5)
   - Escolher uma imagem do sistema (ex: API 33 ou 34)
   - Finish

### Problema: Appium não encontra dispositivo

1. Verificar se dispositivo está conectado:
   ```bash
   adb devices
   ```

2. Verificar se Appium está rodando:
   ```bash
   curl http://localhost:4723/status
   ```

3. Reiniciar Appium:
   ```bash
   # Parar Appium (Ctrl+C ou kill)
   pkill -f appium
   
   # Iniciar novamente
   ./bin/start-appium.sh
   ```

### Problema: Timeout ao conectar

Aumentar timeout nos testes ou aguardar mais tempo:

```bash
# Aguardar emulador estar totalmente pronto
adb wait-for-device
sleep 10

# Verificar se está respondendo
adb shell getprop sys.boot_completed
# Deve retornar: 1
```

## Scripts Úteis

### Verificar tudo de uma vez

```bash
cd AndroidApp/tests/java
./check-environment.sh
```

### Iniciar ambiente completo

```bash
# Na raiz do projeto
./bin/start-test-environment.sh
```

Este script inicia:
- Backend Rails
- Frontend React  
- Appium
- Detecta dispositivos

## Próximos Passos

Após resolver o problema do dispositivo:

1. ✅ Verificar ambiente:
   ```bash
   cd AndroidApp/tests/java
   ./check-environment.sh
   ```

2. ✅ Executar teste de conexão:
   ```bash
   ./../../gradlew test --tests "*BackendConnectionTest.testBackendConnection"
   ```

3. ✅ Ver logs:
   ```bash
   adb logcat -s MainActivity:D
   ```

