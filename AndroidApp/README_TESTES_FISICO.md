# 📱 Testes em Dispositivo Físico Android

## Configuração Rápida

### 1. Conectar Dispositivo Físico

```bash
# Execute o script de configuração
cd AndroidApp
./scripts/setup-physical-device.sh
```

O script irá:
- ✅ Detectar dispositivos físicos conectados
- ✅ Mostrar informações do dispositivo
- ✅ Configurar variável de ambiente `APPIUM_DEVICE_NAME`

### 2. Configurar IP do Frontend

**IMPORTANTE**: Dispositivos físicos não podem usar `10.0.2.2` (apenas emuladores).

**Opção A: IP Fixo (Recomendado)**
1. Descubra o IP da sua máquina:
   ```bash
   hostname -I | awk '{print $1}'
   ```

2. Edite `AndroidApp/app/src/main/java/com/barbermanagement/app/MainActivity.java`:
   ```java
   private static final String FRONTEND_URL_PHYSICAL = "http://SEU_IP_AQUI:5173";
   ```

3. Recompile o app:
   ```bash
   ./bin/build-android-app.sh
   ./bin/install-android-app.sh
   ```

**Opção B: Mesma Rede Wi-Fi**
- Certifique-se que o PC e o dispositivo estão na mesma rede Wi-Fi
- Use o IP local da máquina (ex: `192.168.1.100`)

### 3. Executar Testes

```bash
# Configurar dispositivo
export APPIUM_DEVICE_NAME=$(adb devices | grep -v emulator | grep device | awk '{print $1}' | head -1)

# Executar testes
cd AndroidApp/tests/java
./../../gradlew test
```

## Diferenças: Emulador vs Dispositivo Físico

| Aspecto | Emulador | Dispositivo Físico |
|---------|----------|-------------------|
| **URL Frontend** | `http://10.0.2.2:5173` | `http://IP_DA_REDE:5173` |
| **Conexão** | Sempre disponível | Precisa conectar via USB |
| **Performance** | Mais lento | Mais rápido |
| **Debugging** | Fácil | Requer autorização USB |
| **Rede** | Redirecionamento automático | Precisa mesma rede Wi-Fi |

## Troubleshooting

### Dispositivo não detectado

```bash
# Verificar se ADB detecta o dispositivo
adb devices

# Se aparecer "unauthorized":
# 1. No dispositivo, autorize a depuração USB
# 2. Verifique se "Depuração USB" está ativada
```

### Frontend não carrega no dispositivo físico

1. **Verificar IP**: Certifique-se que o IP está correto no `MainActivity.java`
2. **Verificar rede**: PC e dispositivo devem estar na mesma rede
3. **Verificar firewall**: Permita conexões na porta 5173
4. **Testar no navegador do celular**: Acesse `http://IP_DA_MAQUINA:5173` no navegador do celular

### App não instala

```bash
# Reinstalar app
adb uninstall com.barbermanagement.app.debug
./bin/install-android-app.sh
```

## Scripts Úteis

```bash
# Detectar dispositivos
./scripts/detect-device.sh

# Configurar dispositivo físico
./scripts/setup-physical-device.sh

# Verificar conexão
adb devices
adb shell getprop ro.product.model
```

## Vantagens do Dispositivo Físico

- ✅ **Performance real**: Testa em hardware real
- ✅ **Mais rápido**: Geralmente mais rápido que emulador
- ✅ **Testes reais**: Sensores, câmera, GPS funcionam
- ✅ **Bateria**: Testa consumo real de bateria

## Desvantagens

- ❌ **Requer hardware**: Precisa de dispositivo físico
- ❌ **Configuração de rede**: Precisa configurar IP
- ❌ **Autorização USB**: Precisa autorizar depuração

