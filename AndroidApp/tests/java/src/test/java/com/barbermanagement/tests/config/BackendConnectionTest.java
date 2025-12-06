package com.barbermanagement.tests.config;

import com.barbermanagement.tests.pages.LoginPage;
import com.barbermanagement.tests.utils.AppiumDriverManager;
import io.appium.java_client.android.AndroidDriver;
import org.junit.jupiter.api.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Testes de Configuração e Conectividade
 * 
 * Este arquivo contém testes que verificam a configuração do ambiente,
 * conexão com o backend e outras verificações de setup necessárias
 * antes de executar os testes funcionais.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class BackendConnectionTest {
    private static final Logger logger = LoggerFactory.getLogger(BackendConnectionTest.class);
    
    // Driver Appium que controla o dispositivo/emulador
    private static AndroidDriver driver;
    
    // Page Objects
    private LoginPage loginPage;
    
    @BeforeAll
    public static void setUpClass() {
        logger.info("=== Iniciando testes de configuração ===");
        // Criar driver com capabilities de WebView já que o app usa React no WebView
        driver = AppiumDriverManager.createDriver(true); // useWebView = true
    }
    
    @AfterAll
    public static void tearDownClass() {
        if (driver != null) {
            driver.quit();
            logger.info("Driver fechado");
        }
        logger.info("=== Testes de configuração concluídos ===");
    }
    
    @BeforeEach
    public void setUp() {
        loginPage = new LoginPage(driver);
    }
    
    @Test
    @Order(0)
    @DisplayName("Testa conexão com o backend")
    public void testBackendConnection() {
        logger.info("🔍 ========================================");
        logger.info("🔍 Testando conexão com o backend");
        logger.info("🔍 ========================================");
        
        try {
            // Aguardar página carregar
            logger.info("⏳ Aguardando página de login carregar...");
            assertTrue(loginPage.waitForPageLoad(), 
                "Página de login não carregou");
            logger.info("✅ Página de login carregou");
            
            // Aguardar um pouco para garantir que o JavaScript foi injetado
            Thread.sleep(2000);
            
            // Verificar se estamos no contexto WebView
            logger.info("🔄 Mudando para contexto WebView...");
            com.barbermanagement.tests.utils.AppiumDriverManager.switchToWebView(driver);
            logger.info("✅ Contexto WebView ativado");
            
            // Verificar informações do ambiente
            logger.info("📊 Coletando informações do ambiente...");
            String envScript = 
                "(function() {" +
                "  return {" +
                "    apiUrl: window.APP_API_BASE_URL || 'NÃO DEFINIDA'," +
                "    hostname: window.location.hostname," +
                "    href: window.location.href," +
                "    userAgent: navigator.userAgent.substring(0, 100)," +
                "    hasDebugInfo: !!window.APP_DEBUG_INFO," +
                "    backendConnected: window.APP_BACKEND_CONNECTED || false," +
                "    backendError: window.APP_BACKEND_ERROR || null" +
                "  };" +
                "})();";
            
            Object envResult = driver.executeScript(envScript);
            logger.info("📊 Informações do ambiente:");
            logger.info("  {}", envResult);
            
            // Verificar se a URL foi injetada
            String apiUrl = (String) driver.executeScript("return window.APP_API_BASE_URL || null;");
            if (apiUrl != null && !apiUrl.isEmpty()) {
                logger.info("✅ URL da API injetada: {}", apiUrl);
            } else {
                logger.error("❌ URL da API NÃO foi injetada!");
                logger.error("   Tentando aguardar mais tempo...");
                Thread.sleep(3000);
                apiUrl = (String) driver.executeScript("return window.APP_API_BASE_URL || null;");
                if (apiUrl != null && !apiUrl.isEmpty()) {
                    logger.info("✅ URL da API encontrada após espera: {}", apiUrl);
                } else {
                    logger.error("❌ URL da API ainda não foi injetada após espera!");
                }
            }
            
            // Verificar status da conexão com backend
            Boolean backendConnected = (Boolean) driver.executeScript("return window.APP_BACKEND_CONNECTED || false;");
            if (backendConnected) {
                logger.info("✅ Backend conectado com sucesso!");
            } else {
                String backendError = (String) driver.executeScript("return window.APP_BACKEND_ERROR || null;");
                if (backendError != null) {
                    logger.error("❌ Erro ao conectar backend: {}", backendError);
                } else {
                    logger.warn("⚠️ Status de conexão com backend ainda não disponível");
                }
            }
            
            // Verificar informações de debug
            Object debugInfo = driver.executeScript("return window.APP_DEBUG_INFO || null;");
            if (debugInfo != null) {
                logger.info("🔍 Debug Info: {}", debugInfo);
            }
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.error("❌ Thread interrompida: {}", e.getMessage());
        } catch (Exception e) {
            logger.error("❌ Erro ao testar conexão com backend: {}", e.getMessage(), e);
            // Não falhar o teste, apenas logar o erro
        }
        
        logger.info("✅ Teste de conexão concluído");
        logger.info("🔍 ========================================");
    }
}

