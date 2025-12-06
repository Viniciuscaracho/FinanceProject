package com.barbermanagement.tests.e2e;

import com.barbermanagement.tests.pages.DashboardPage;
import com.barbermanagement.tests.pages.LoginPage;
import com.barbermanagement.tests.utils.AppiumDriverManager;
import com.barbermanagement.tests.utils.Constants;
import io.appium.java_client.android.AndroidDriver;
import org.junit.jupiter.api.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Testes E2E para funcionalidade de Login
 * 
 * ESTE ARQUIVO CONTÉM OS TESTES QUE EXECUTAM AS AÇÕES
 * 
 * ⚠️ IMPORTANTE: Os elementos da tela NÃO são identificados diretamente aqui.
 * Eles são identificados dentro das classes Page Objects:
 * - LoginPage.java - contém os seletores dos elementos da página de login
 * - DashboardPage.java - contém os seletores dos elementos do dashboard
 * 
 * Como funciona:
 * 1. Os elementos são identificados nos Page Objects usando seletores (CSS, XPath, etc)
 * 2. Os métodos dos Page Objects encapsulam as ações (clicar, preencher, etc)
 * 3. Os testes chamam esses métodos, não interagem diretamente com os elementos
 * 
 * Para adicionar novos elementos:
 * 1. Abra o Appium Inspector e inspecione a tela
 * 2. Identifique o seletor do elemento (data-testid, id, class, etc)
 * 3. Adicione o By locator no Page Object correspondente
 * 4. Crie métodos no Page Object para interagir com o elemento
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class LoginTest {
    private static final Logger logger = LoggerFactory.getLogger(LoginTest.class);
    
    // Driver Appium que controla o dispositivo/emulador
    private static AndroidDriver driver;
    
    // Page Objects - essas classes contêm a identificação dos elementos
    private LoginPage loginPage;        // Elementos identificados em: LoginPage.java
    private DashboardPage dashboardPage; // Elementos identificados em: DashboardPage.java
    
    @BeforeAll
    public static void setUpClass() {
        logger.info("=== Iniciando testes de Login ===");
        driver = AppiumDriverManager.createDriver(true); // useWebView = true
    }
    
    @AfterAll
    public static void tearDownClass() {
        if (driver != null) {
            driver.quit();
            logger.info("Driver fechado");
        }
        logger.info("=== Testes de Login concluídos ===");
    }
    
    @BeforeEach
    public void setUp() {
        loginPage = new LoginPage(driver);
        dashboardPage = new DashboardPage(driver);
    }
    
    @Test
    @Order(0)
    @DisplayName("Testa se a página de login carrega corretamente")
    public void testLoginPageLoads() {
        logger.info("Testando carregamento da página de login...");
        
        // ============================================================
        // ONDE OS ELEMENTOS SÃO IDENTIFICADOS:
        // ============================================================
        // O método waitForPageLoad() verifica se os elementos estão presentes.
        // A identificação dos elementos acontece dentro de LoginPage.java:
        // - loginPage: By.cssSelector("[data-testid='login-page']")
        // - emailInput: By.cssSelector("[data-testid='email-input']")
        // - passwordInput: By.cssSelector("[data-testid='password-input']")
        
        assertTrue(loginPage.waitForPageLoad(), 
            "Página de login não carregou");
        
        // O método isDisplayed() verifica se o elemento loginPage está visível
        // Elemento identificado em LoginPage.java como:
        // private final By loginPage = By.cssSelector("[data-testid='login-page']")
        assertTrue(loginPage.isDisplayed(), 
            "Página de login não está visível");
        
        logger.info("✅ Página de login carregou corretamente");
    }
    
    @Test
    @Order(1)
    @DisplayName("Testa login simples com sucesso")
    public void testLoginSimpleSuccess() {
        logger.info("Testando login simples...");
        
        // ============================================================
        // PASSO 1: Aguardar página de login carregar
        // ============================================================
        // Verifica se os elementos principais estão presentes
        // Elementos verificados em LoginPage.waitForPageLoad():
        // - loginPage: By.cssSelector("[data-testid='login-page']")
        // - emailInput: By.cssSelector("[data-testid='email-input']")
        // - passwordInput: By.cssSelector("[data-testid='password-input']")
        assertTrue(loginPage.waitForPageLoad(), 
            "Página de login não carregou");
        
        // ============================================================
        // PASSO 2: Realizar login
        // ============================================================
        // O método loginSimple() faz o seguinte (dentro de LoginPage.java):
        // 1. Seleciona tipo de login: clica em loginSimpleButton
        //    -> Elemento: By.xpath("//button[contains(text(), 'Login Simples')]")
        // 2. Preenche email: envia texto para emailInput
        //    -> Elemento: By.cssSelector("[data-testid='email-input']")
        // 3. Preenche senha: envia texto para passwordInput
        //    -> Elemento: By.cssSelector("[data-testid='password-input']")
        // 4. Clica em login: clica em loginButton
        //    -> Elemento: By.cssSelector("[data-testid='login-button']")
        assertTrue(loginPage.loginSimple(
            Constants.TEST_USER_EMAIL,
            Constants.TEST_USER_PASSWORD
        ), "Falha ao realizar login");
        
        // Aguardar um pouco para o login processar e a página carregar (reduzido de 3000ms para 1000ms)
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // ============================================================
        // PASSO 3: Verificar se chegou no dashboard
        // ============================================================
        // Verifica se os elementos do dashboard estão visíveis
        // Elementos verificados em DashboardPage.isDisplayed():
        // - dashboardContainer: By.cssSelector("[data-testid='dashboard']")
        // - header: By.cssSelector("header")
        assertTrue(dashboardPage.isDisplayed(), 
            "Dashboard não foi exibido após login");
        
        logger.info("✅ Login realizado com sucesso");
    }
    
    @Test
    @Order(2)
    @DisplayName("Testa login com credenciais inválidas")
    public void testLoginWithInvalidCredentials() {
        logger.info("Testando login com credenciais inválidas...");
        
        // ============================================================
        // PASSO 1: Garantir que estamos na página de login
        // ============================================================
        // Se estiver logado, fazer logout primeiro
        try {
            if (dashboardPage.isDisplayed()) {
                // Elementos usados no logout (dentro de DashboardPage.java):
                // - userMenu: By.cssSelector("[data-testid='user-menu']")
                // - logoutButton: By.xpath("//button[contains(text(), 'Sair')]")
                dashboardPage.clickLogout();
                Thread.sleep(500); // Reduzido de 2000ms para 500ms
            }
        } catch (Exception e) {
            logger.debug("Não era necessário fazer logout");
        }
        
        // Aguardar página de login
        // Elementos verificados: loginPage, emailInput, passwordInput
        assertTrue(loginPage.waitForPageLoad(), 
            "Página de login não carregou");
        
        // ============================================================
        // PASSO 2: Tentar login com credenciais inválidas
        // ============================================================
        // Mesmos elementos usados em testLoginSimpleSuccess:
        // - loginSimpleButton
        // - emailInput
        // - passwordInput
        // - loginButton
        assertTrue(loginPage.loginSimple(
            "invalid@email.com",
            "wrongpassword"
        ), "Falha ao tentar fazer login");
        
        // Aguardar mensagem de erro aparecer (reduzido de 2000ms para 500ms)
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // ============================================================
        // PASSO 3: Verificar mensagem de erro
        // ============================================================
        // O método isErrorDisplayed() verifica se o elemento errorAlert existe
        // Elemento identificado em LoginPage.java:
        // - errorAlert: By.cssSelector("[role='alert']")
        assertTrue(loginPage.isErrorDisplayed(), 
            "Mensagem de erro não foi exibida");
        
        // O método getErrorMessage() busca o texto do elemento errorAlert
        // Elemento: By.cssSelector("[role='alert']")
        String errorMessage = loginPage.getErrorMessage();
        assertNotNull(errorMessage, "Mensagem de erro está vazia");
        logger.info("Mensagem de erro exibida: {}", errorMessage);
        
        logger.info("✅ Teste de credenciais inválidas passou");
    }
    
    @Test
    @Order(3)
    @DisplayName("Testa funcionalidade de logout")
    public void testLogoutFunctionality() {
        logger.info("Testando funcionalidade de logout...");
        
        // ============================================================
        // PASSO 1: Fazer login primeiro
        // ============================================================
        // Elementos usados (em LoginPage.java):
        // - loginPage, emailInput, passwordInput, loginButton, loginSimpleButton
        assertTrue(loginPage.waitForPageLoad(), 
            "Página de login não carregou");
        
        assertTrue(loginPage.loginSimple(
            Constants.TEST_USER_EMAIL,
            Constants.TEST_USER_PASSWORD
        ), "Falha ao realizar login");
        
        // Aguardar dashboard carregar (reduzido de 3000ms para 1000ms)
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Verificar se dashboard está visível
        // Elementos verificados (em DashboardPage.java):
        // - dashboardContainer: By.cssSelector("[data-testid='dashboard']")
        // - header: By.cssSelector("header")
        assertTrue(dashboardPage.isDisplayed(), 
            "Dashboard não foi exibido");
        
        // ============================================================
        // PASSO 2: Fazer logout
        // ============================================================
        // O método clickLogout() faz o seguinte (em DashboardPage.java):
        // 1. Abre o menu do usuário: clica em userMenu
        //    -> Elemento: By.cssSelector("[data-testid='user-menu']")
        // 2. Clica no botão de logout: clica em logoutButton
        //    -> Elemento: By.xpath("//button[contains(text(), 'Sair')]")
        assertTrue(dashboardPage.clickLogout(), 
            "Falha ao fazer logout");
        
        // Aguardar redirecionamento para página de login (reduzido de 3000ms para 1000ms)
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // ============================================================
        // PASSO 3: Verificar se voltou para página de login
        // ============================================================
        // Verifica se o elemento loginPage está visível novamente
        // Elemento: By.cssSelector("[data-testid='login-page']") em LoginPage.java
        // 
        // ⚠️ NOTA: Pode precisar fazer refresh no driver para ver a mudança.
        // Para o Appium Inspector, você precisará atualizar manualmente
        // clicando no botão Refresh.
        assertTrue(loginPage.isDisplayed(), 
            "Página de login não foi exibida após logout");
        
        logger.info("✅ Logout funcionou corretamente");
    }
    
    @Test
    @Order(4)
    @DisplayName("Testa criação de usuário de teste")
    public void testCreateTestUser() {
        logger.info("Testando criação de usuário de teste...");
        
        // ============================================================
        // PASSO 1: Aguardar página de login carregar
        // ============================================================
        // Elementos verificados: loginPage, emailInput, passwordInput
        assertTrue(loginPage.waitForPageLoad(), 
            "Página de login não carregou");
        
        // ============================================================
        // PASSO 2: Clicar no botão de criar usuário de teste
        // ============================================================
        // O método createTestUser() clica no botão
        // Elemento identificado em LoginPage.java:
        // - createTestUserButton: By.xpath("//button[contains(text(), 'Criar Usuário Teste')]")
        assertTrue(loginPage.createTestUser(), 
            "Falha ao criar usuário de teste");
        
        // Aguardar ação processar (reduzido de 2000ms para 500ms)
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // ⚠️ NOTA: Este teste apenas verifica se o botão foi clicado.
        // Para verificar se os campos foram preenchidos, você pode adicionar:
        // - Verificação se emailInput tem valor
        // - Verificação se passwordInput tem valor
        // Isso seria feito usando métodos no LoginPage como:
        // loginPage.getEmailValue() e loginPage.getPasswordValue()
        
        logger.info("✅ Usuário de teste criado (verificar campos preenchidos manualmente)");
    }
}

