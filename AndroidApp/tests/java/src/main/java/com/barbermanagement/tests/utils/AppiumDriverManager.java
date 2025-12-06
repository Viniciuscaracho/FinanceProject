package com.barbermanagement.tests.utils;

import com.google.gson.JsonObject;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.android.options.UiAutomator2Options;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.Set;

/**
 * Classe para gerenciar a criação e configuração do driver Appium
 */
public class AppiumDriverManager {
    private static final Logger logger = LoggerFactory.getLogger(AppiumDriverManager.class);
    
    // Timeouts padrão (em segundos)
    private static final int IMPLICIT_WAIT = 10;
    private static final int PAGE_LOAD_TIMEOUT = 30;
    
    /**
     * Cria e retorna uma instância do AndroidDriver
     */
    public static AndroidDriver createDriver() {
        return createDriver(false);
    }
    
    /**
     * Cria e retorna uma instância do AndroidDriver
     * @param useWebView Se true, usa capabilities para WebView
     */
    public static AndroidDriver createDriver(boolean useWebView) {
        String serverUrl = AppiumConfig.getServerUrl();
        logger.info("Conectando ao Appium Server: {}", serverUrl);
        
        // Detectar automaticamente se deve usar dispositivo físico
        boolean usePhysicalDevice = AppiumConfig.shouldUsePhysicalDevice();
        if (usePhysicalDevice) {
            logger.info("📱 Usando dispositivo físico");
        } else {
            logger.info("🤖 Usando emulador");
        }
        
        UiAutomator2Options options = createOptions(useWebView, usePhysicalDevice);
        
        try {
            java.net.URL url = new java.net.URL(serverUrl);
            AndroidDriver driver = new AndroidDriver(url, options);
            
            // Configurar timeouts
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(IMPLICIT_WAIT));
            // pageLoadTimeout não é suportado no Appium para Android nativo
            
            logger.info("Driver criado com sucesso. Session ID: {}", driver.getSessionId());
            return driver;
        } catch (java.net.MalformedURLException e) {
            logger.error("URL do servidor Appium inválida: {}", serverUrl, e);
            throw new RuntimeException("Erro ao criar driver: URL inválida", e);
        }
    }
    
    /**
     * Cria UiAutomator2Options a partir das capabilities configuradas
     */
    private static UiAutomator2Options createOptions(boolean useWebView, boolean usePhysicalDevice) {
        JsonObject caps;
        if (useWebView) {
            caps = AppiumConfig.loadWebViewCapabilities(usePhysicalDevice);
        } else {
            caps = AppiumConfig.loadCapabilities();
        }
        
        // Detectar deviceName automaticamente se não estiver configurado
        String deviceName = System.getProperty("appium.device.name", "");
        if (deviceName.isEmpty()) {
            deviceName = System.getenv("APPIUM_DEVICE_NAME");
        }
        if (deviceName == null || deviceName.isEmpty()) {
            deviceName = AppiumConfig.detectDeviceName();
        }
        
        UiAutomator2Options options = new UiAutomator2Options();
        
        // Configurações básicas
        if (caps.has("platformName")) {
            options.setPlatformName(caps.get("platformName").getAsString());
        }
        
        // Usar deviceName detectado ou do arquivo de configuração
        if (!deviceName.isEmpty()) {
            options.setDeviceName(deviceName);
            logger.info("Usando dispositivo: {}", deviceName);
        } else if (caps.has("appium:deviceName")) {
            options.setDeviceName(caps.get("appium:deviceName").getAsString());
        }
        
        if (caps.has("appium:platformVersion")) {
            options.setPlatformVersion(caps.get("appium:platformVersion").getAsString());
        }
        
        if (caps.has("appium:appPackage")) {
            options.setAppPackage(caps.get("appium:appPackage").getAsString());
        }
        
        if (caps.has("appium:appActivity")) {
            options.setAppActivity(caps.get("appium:appActivity").getAsString());
        }
        
        if (caps.has("appium:automationName")) {
            options.setAutomationName(caps.get("appium:automationName").getAsString());
        }
        
        // Configurações opcionais
        if (caps.has("appium:noReset")) {
            options.setNoReset(caps.get("appium:noReset").getAsBoolean());
        }
        
        if (caps.has("appium:fullReset")) {
            options.setFullReset(caps.get("appium:fullReset").getAsBoolean());
        }
        
        if (caps.has("appium:autoGrantPermissions")) {
            options.setAutoGrantPermissions(caps.get("appium:autoGrantPermissions").getAsBoolean());
        }
        
        if (caps.has("appium:newCommandTimeout")) {
            options.setNewCommandTimeout(Duration.ofSeconds(caps.get("appium:newCommandTimeout").getAsInt()));
        }
        
        // Configurações de WebView
        if (caps.has("appium:webviewDebugging")) {
            options.setChromedriverUseSystemExecutable(false);
        }
        
        // Configurações específicas de ChromeDriver para WebView
        if (useWebView || caps.has("appium:chromedriverAutoDownload")) {
            // Habilitar download automático do ChromeDriver
            options.setChromedriverUseSystemExecutable(false);
            
            // Se chromedriverExecutable estiver configurado, usar ele
            if (caps.has("appium:chromedriverExecutable")) {
                String chromedriverPath = caps.get("appium:chromedriverExecutable").getAsString();
                if (chromedriverPath != null && !chromedriverPath.isEmpty()) {
                    java.io.File chromedriverFile = new java.io.File(chromedriverPath);
                    if (chromedriverFile.exists() && chromedriverFile.canExecute()) {
                        options.setChromedriverExecutable(chromedriverPath);
                        logger.info("Usando ChromeDriver em: {}", chromedriverPath);
                    } else {
                        logger.warn("ChromeDriver especificado não existe ou não é executável: {}", chromedriverPath);
                    }
                }
            }
        }
        
        // Configurações adicionais de WebView
        if (caps.has("appium:ensureWebviewsHavePages")) {
            // Esta capability é processada automaticamente pelo Appium
        }
        
        logger.info("Options criadas com sucesso (useWebView: {}, physicalDevice: {})", useWebView, usePhysicalDevice);
        return options;
    }
    
    /**
     * Muda o contexto para WebView
     */
    public static boolean switchToWebView(AndroidDriver driver) {
        try {
            Set<String> contexts = driver.getContextHandles();
            logger.info("Contextos disponíveis: {}", contexts);
            
            for (String context : contexts) {
                if (context.toUpperCase().contains("WEBVIEW")) {
                    driver.context(context);
                    logger.info("Contexto alterado para: {}", context);
                    return true;
                }
            }
            
            logger.warn("Nenhum contexto WebView encontrado");
            return false;
        } catch (Exception e) {
            logger.error("Erro ao mudar para WebView: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Muda o contexto de volta para Native
     */
    public static boolean switchToNative(AndroidDriver driver) {
        try {
            driver.context("NATIVE_APP");
            logger.info("Contexto alterado para NATIVE_APP");
            return true;
        } catch (Exception e) {
            logger.error("Erro ao mudar para Native: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Tira screenshot e salva
     */
    public static String takeScreenshot(AndroidDriver driver, String filename) {
        try {
            String screenshotPath = "tests/java/e2e/screenshots/" + filename;
            driver.getScreenshotAs(org.openqa.selenium.OutputType.FILE)
                  .renameTo(new java.io.File(screenshotPath));
            logger.info("Screenshot salvo: {}", screenshotPath);
            return screenshotPath;
        } catch (Exception e) {
            logger.error("Erro ao tirar screenshot: {}", e.getMessage());
            return null;
        }
    }
}



