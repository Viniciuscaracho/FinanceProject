"""
Helper para inicializar e gerenciar o driver Appium
"""
import json
import logging
from pathlib import Path
from appium import webdriver
from appium.options.android import UiAutomator2Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

from .constants import (
    APPIUM_SERVER_URL,
    CAPABILITIES_FILE,
    CAPABILITIES_WEBVIEW_FILE,
    IMPLICIT_WAIT,
    EXPLICIT_WAIT
)

logger = logging.getLogger(__name__)


def load_capabilities(file_path: Path = None, webview: bool = False) -> dict:
    """Carrega capabilities de um arquivo JSON"""
    if file_path is None:
        file_path = CAPABILITIES_WEBVIEW_FILE if webview else CAPABILITIES_FILE
    
    with open(file_path, 'r') as f:
        return json.load(f)


def create_driver(capabilities: dict = None, webview: bool = False):
    """Cria e retorna uma instância do driver Appium"""
    if capabilities is None:
        capabilities = load_capabilities(webview=webview)
    
    # Converter para UiAutomator2Options
    options = UiAutomator2Options()
    
    # Configurar capabilities básicas
    options.platform_name = capabilities.get('platformName', 'Android')
    options.device_name = capabilities.get('appium:deviceName', 'emulator-5554')
    options.app_package = capabilities.get('appium:appPackage')
    options.app_activity = capabilities.get('appium:appActivity')
    options.automation_name = capabilities.get('appium:automationName', 'UiAutomator2')
    
    # Configurações opcionais
    if 'appium:noReset' in capabilities:
        options.no_reset = capabilities['appium:noReset']
    if 'appium:fullReset' in capabilities:
        options.full_reset = capabilities['appium:fullReset']
    if 'appium:autoGrantPermissions' in capabilities:
        options.auto_grant_permissions = capabilities['appium:autoGrantPermissions']
    if 'appium:newCommandTimeout' in capabilities:
        options.new_command_timeout = capabilities['appium:newCommandTimeout']
    
    # Criar driver
    driver = webdriver.Remote(
        command_executor=APPIUM_SERVER_URL,
        options=options
    )
    
    # Configurar timeouts
    driver.implicitly_wait(IMPLICIT_WAIT)
    
    logger.info(f"Driver Appium criado com sucesso: {driver.session_id}")
    return driver


def switch_to_webview(driver, timeout: int = EXPLICIT_WAIT):
    """Muda o contexto para WebView"""
    try:
        wait = WebDriverWait(driver, timeout)
        
        # Aguardar WebView estar disponível
        wait.until(lambda d: len(d.contexts) > 1)
        
        contexts = driver.contexts
        webview_context = None
        
        for context in contexts:
            if 'WEBVIEW' in context.upper():
                webview_context = context
                break
        
        if webview_context:
            driver.switch_to.context(webview_context)
            logger.info(f"Contexo alterado para: {webview_context}")
            return True
        else:
            logger.warning("Nenhum contexto WebView encontrado")
            return False
            
    except TimeoutException:
        logger.error(f"Timeout ao aguardar WebView (timeout: {timeout}s)")
        return False
    except Exception as e:
        logger.error(f"Erro ao mudar para WebView: {e}")
        return False


def switch_to_native(driver):
    """Muda o contexto de volta para Native"""
    try:
        driver.switch_to.context('NATIVE_APP')
        logger.info("Contexto alterado para NATIVE_APP")
        return True
    except Exception as e:
        logger.error(f"Erro ao mudar para Native: {e}")
        return False


def take_screenshot(driver, filename: str = None):
    """Tira screenshot e salva no diretório de screenshots"""
    from .constants import SCREENSHOTS_DIR
    from datetime import datetime
    
    if filename is None:
        filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    
    screenshot_path = SCREENSHOTS_DIR / filename
    driver.save_screenshot(str(screenshot_path))
    logger.info(f"Screenshot salvo: {screenshot_path}")
    return screenshot_path













