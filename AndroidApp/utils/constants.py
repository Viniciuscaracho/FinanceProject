"""
Constantes usadas nos testes Appium
"""
import os
from pathlib import Path

# Caminhos
BASE_DIR = Path(__file__).parent.parent
CONFIG_DIR = BASE_DIR / "config" / "appium"
TEST_DIR = BASE_DIR / "tests"
REPORTS_DIR = TEST_DIR / "python" / "e2e" / "reports"
SCREENSHOTS_DIR = TEST_DIR / "python" / "e2e" / "screenshots"

# Configurações do Appium
APPIUM_SERVER_URL = "http://127.0.0.1:4723"
APPIUM_SERVER_PATH = "/"

# Capabilities padrão
CAPABILITIES_FILE = CONFIG_DIR / "capabilities.json"
CAPABILITIES_WEBVIEW_FILE = CONFIG_DIR / "capabilities.webview.json"

# Configurações do App
APP_PACKAGE = "com.barbermanagement.app.debug"
APP_ACTIVITY = "com.barbermanagement.app.MainActivity"
APP_PATH = BASE_DIR.parent.parent / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk"

# URLs
FRONTEND_URL_EMULATOR = "http://10.0.2.2:5173"
FRONTEND_URL_LOCALHOST = "http://localhost:5173"

# Timeouts (em segundos)
IMPLICIT_WAIT = 10
EXPLICIT_WAIT = 20
PAGE_LOAD_TIMEOUT = 30

# Credenciais de teste
TEST_USER_EMAIL = "admin@exemplo.com"
TEST_USER_PASSWORD = "password"

# Criar diretórios se não existirem
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)




