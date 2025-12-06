package com.barbermanagement.tests.e2e;

import com.barbermanagement.tests.pages.ProfileModalPage;
import com.barbermanagement.tests.pages.LoginPage;
import com.barbermanagement.tests.pages.DashboardPage;
import com.barbermanagement.tests.utils.AppiumDriverManager;
import com.barbermanagement.tests.utils.Constants;
import io.appium.java_client.android.AndroidDriver;
import org.junit.jupiter.api.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ProfileModalTest {
    private static final Logger logger = LoggerFactory.getLogger(ProfileModalTest.class);
    private static AndroidDriver driver;
    private static LoginPage loginPage;
    private static ProfileModalPage profileModalPage;
    private static DashboardPage dashboardPage;

    @BeforeAll
    public static void setUp() {
        driver = AppiumDriverManager.createDriver(true);
        loginPage = new LoginPage(driver);
        profileModalPage = new ProfileModalPage(driver);
        dashboardPage = new DashboardPage(driver);
    }

    @AfterAll
    public static void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    
    @BeforeEach
    public void resetState() {
        logger.info("=== Resetando estado: Voltando para login ===");
        try {
            try {
                if (dashboardPage.isDisplayed()) {
                    // Fechar modal se estiver aberto antes de fazer logout
                    if (profileModalPage.isProfileModalVisible()) {
                        logger.info("Fechando modal antes de fazer logout...");
                        profileModalPage.closeProfileModal();
                        Thread.sleep(200);
                    }
                    
                    // Fazer logout para voltar ao estado inicial
                    logger.info("Fazendo logout para voltar ao estado inicial...");
                    profileModalPage.openProfileModal();
                    Thread.sleep(200);
                    profileModalPage.logoutProfile();
                    Thread.sleep(500);
                }
            } catch (Exception e) {
                logger.debug("Erro ao fazer logout: {}", e.getMessage());
            }
            try {
                if (loginPage.waitForPageLoad()) {
                    logger.info("✅ Estado resetado: Voltado para página de login");
                    // Fazer login para os testes
                    logger.info("Fazendo login para teste do modal...");
                    loginPage.loginSimple(Constants.TEST_USER_EMAIL, Constants.TEST_USER_PASSWORD);
                    // Aguardar dashboard aparecer (reduzido de 3000ms)
                    Thread.sleep(100);
                } else {
                    logger.warn("⚠️ Não foi possível verificar página de login após reset");
                }
            } catch (Exception e) {
                logger.warn("Erro ao verificar página de login: {}", e.getMessage());
            }
        } catch (Exception e) {
            logger.warn("Erro ao resetar estado, mas continuando: {}", e.getMessage());
        }
    }

    @AfterEach
    public void cleanupAfterTest() {
        logger.info("=== Limpando após teste ===");
        try {
            try {
                if (dashboardPage.isDisplayed()) {
                    if (profileModalPage.isProfileModalVisible()) {
                        logger.info("Fechando modal antes de fazer logout...");
                        profileModalPage.closeProfileModal();
                        Thread.sleep(200);
                    }
                    
                    logger.info("Fazendo logout após teste...");
                    profileModalPage.openProfileModal();
                    Thread.sleep(200);
                    profileModalPage.logoutProfile();
                    Thread.sleep(100);
                }
            } catch (Exception e) {
                logger.debug("Erro ao fazer logout: {}", e.getMessage());
            }
        } catch (Exception e) {
            logger.debug("Erro ao limpar após teste: {}", e.getMessage());
        }
    }

    @Test
    @Order(1)
    @DisplayName("Verifica se o modal de perfil é exibido corretamente")
    public void testProfileModalVisibility() {
        logger.info("Iniciando teste: Verifica se o modal de perfil é exibido corretamente");
        
        assertTrue(dashboardPage.isDisplayed(), "Dashboard não está visível - necessário estar logado");
        
        assertTrue(profileModalPage.openProfileModal(), "Falha ao abrir o modal de perfil");
        
        assertTrue(profileModalPage.isProfileModalVisible(), "O modal de perfil não está visível após a abertura");
        
        logger.info("✅ Teste concluído: Modal está visível");
    }
    
    @Test
    @Order(2)
    @DisplayName("Verifica se o modal de perfil pode ser fechado corretamente")
    public void testCloseProfileModal() {
        logger.info("Iniciando teste: Verifica se o modal de perfil pode ser fechado corretamente");
        
        // Garantir que estamos no dashboard
        assertTrue(dashboardPage.isDisplayed(), "Dashboard não está visível - necessário estar logado");
        
        // Abrir o modal
        assertTrue(profileModalPage.openProfileModal(), "Falha ao abrir o modal de perfil");
        assertTrue(profileModalPage.isProfileModalVisible(), "O modal de perfil não está visível após a abertura");
        
        // Fechar o modal e verificar o retorno
        // O método closeProfileModal já faz todas as verificações internas
        assertTrue(profileModalPage.closeProfileModal(), "Falha ao fechar o modal de perfil");
        
        // Aguardar um pouco adicional para garantir que qualquer animação terminou
        try {
            Thread.sleep(200);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Verificar que o modal foi realmente fechado
        // Usar assertFalse com mensagem clara
        boolean isStillVisible = profileModalPage.isProfileModalVisible();
        assertFalse(isStillVisible, 
            "O modal de perfil ainda está visível após o fechamento. " +
            "Isso pode indicar que o comportamento toggle não está funcionando corretamente.");
        
        logger.info("✅ Teste concluído: Modal foi fechado corretamente");
    }
}
