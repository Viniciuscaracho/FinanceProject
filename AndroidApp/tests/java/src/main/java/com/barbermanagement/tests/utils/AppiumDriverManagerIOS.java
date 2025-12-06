package com.barbermanagement.tests.utils;

import com.google.gson.JsonObject;
import io.appium.java_client.ios.IOSDriver;
import io.appium.java_client.ios.options.XCUITestOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;

/**
 * Classe para gerenciar a criação e configuração do driver Appium para iOS
 * 
 * ⚠️ PREPARADO PARA FUTURO: Esta classe será usada quando implementar testes iOS
 */
public class AppiumDriverManagerIOS {
    private static final Logger logger = LoggerFactory.getLogger(AppiumDriverManagerIOS.class);
    
    // Timeouts padrão (em segundos)
    private static final int IMPLICIT_WAIT = 10;
    private static final int PAGE_LOAD_TIMEOUT = 30;
    
    /**
     * Cria e retorna uma instância do IOSDriver
     * 
     * ⚠️ ATUALIZAR quando implementar iOS:
     * 1. Configure capabilities iOS em config/appium/capabilities.ios.json
     * 2. Ajuste os valores abaixo conforme necessário
     */
    public static IOSDriver createDriver() {
        String serverUrl = AppiumConfig.getServerUrl();
        logger.info("Conectando ao Appium Server (iOS): {}", serverUrl);
        
        XCUITestOptions options = createOptions();
        
        try {
            java.net.URL url = new java.net.URL(serverUrl);
            IOSDriver driver = new IOSDriver(url, options);
            
            // Configurar timeouts
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(IMPLICIT_WAIT));
            // pageLoadTimeout não é suportado no Appium para iOS nativo
            
            logger.info("Driver iOS criado com sucesso. Session ID: {}", driver.getSessionId());
            return driver;
        } catch (java.net.MalformedURLException e) {
            logger.error("URL do servidor Appium inválida: {}", serverUrl, e);
            throw new RuntimeException("Erro ao criar driver iOS: URL inválida", e);
        }
    }
    
    /**
     * Cria XCUITestOptions a partir das capabilities configuradas
     */
    private static XCUITestOptions createOptions() {
        // TODO: Carregar de config/appium/capabilities.ios.json quando implementar
        // JsonObject caps = AppiumConfig.loadIOSCapabilities();
        
        XCUITestOptions options = new XCUITestOptions();
        
        // Configurações básicas - ATUALIZAR quando implementar iOS
        options.setPlatformName("iOS");
        options.setDeviceName("iPhone 15");
        options.setPlatformVersion("17.0");
        options.setAutomationName("XCUITest");
        
        // TODO: Configurar bundleId, udid, etc. quando implementar
        
        logger.info("Options iOS criadas (placeholder)");
        return options;
    }
    
    /**
     * Tira screenshot e salva
     */
    public static String takeScreenshot(IOSDriver driver, String filename) {
        try {
            String screenshotPath = "tests/java/e2e/screenshots/ios_" + filename;
            driver.getScreenshotAs(org.openqa.selenium.OutputType.FILE)
                  .renameTo(new java.io.File(screenshotPath));
            logger.info("Screenshot iOS salvo: {}", screenshotPath);
            return screenshotPath;
        } catch (Exception e) {
            logger.error("Erro ao tirar screenshot iOS: {}", e.getMessage());
            return null;
        }
    }
}



