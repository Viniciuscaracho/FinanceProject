package com.barbermanagement.tests.pages;

import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.barbermanagement.tests.utils.AppiumDriverManager;
import java.util.Set;

/**
 * Page Object para a página de Login - Android Nativo
 * 
 * Esta classe encapsula todos os elementos e ações da página de login
 * usando seletores Android nativos (UiAutomator).
 * 
 * IMPORTANTE: Esta automação foca em Android Nativo (e depois iOS).
 * Os elementos são identificados usando:
 * - resource-id (recomendado)
 * - XPath com atributos Android
 * - Texto do elemento
 * - Classes Android nativas
 * 
 * Para encontrar os seletores:
 * 1. Use o Appium Inspector no contexto NATIVE_APP
 * 2. Inspecione cada elemento da tela
 * 3. Anote o resource-id, texto, ou outros atributos
 * 4. Adicione os seletores nesta classe
 */
public class LoginPage extends BasePage {
    private static final Logger logger = LoggerFactory.getLogger(LoginPage.class);
    
    // ============================================================
    // IDENTIFICAÇÃO DOS ELEMENTOS - ANDROID NATIVO
    // ============================================================
    // FOCO: Android Nativo (UiAutomator)
    // Todos os seletores abaixo são para Android nativo usando resource-id
    // 
    // Como encontrar seletores:
    // 1. Abra Appium Inspector
    // 2. Conecte ao dispositivo/emulador (contexto NATIVE_APP)
    // 3. Inspecione cada elemento
    // 4. Anote o resource-id mostrado
    // 5. Adicione o seletor aqui usando: By.id("resource-id-encontrado")
    // 
    // Exemplos de seletores Android:
    // - Por resource-id: By.id("email")
    // - Por XPath: By.xpath("//android.widget.EditText[@resource-id='email']")
    // - Por texto: By.xpath("//android.widget.Button[@text='Entrar']")
    
    /**
     * Campo de input para email
     * App React dentro do WebView usa data-testid="email-input"
     * WebView: By.cssSelector("[data-testid='email-input']")
     */
    private final By emailInput = By.cssSelector("[data-testid='email-input']");
    
    /**
     * OPÇÃO 2: Por XPath (alternativa)
     * XPath: //android.widget.EditText[@resource-id="email"]
     * Use este se o By.id() não funcionar
     */
    private final By emailInputXPath = By.xpath("//android.widget.EditText[@resource-id='email']");
    
    /**
     * Campo de input para senha
     * ⚠️ ATUALIZAR: Encontre o resource-id no Inspector
     * Exemplo: Se for "password", use: By.id("password")
     */
    private final By passwordInput = By.cssSelector("[data-testid='password-input']"); // React no WebView
    
    /**
     * Botão de login/entrar
     * ⚠️ ATUALIZAR: Encontre o resource-id no Inspector
     * Exemplo: Se for "login-button", use: By.id("login-button")
     */
    private final By loginButton = By.cssSelector("[data-testid='login-button']"); // React no WebView
    
    /**
     * Container/página de login (para verificar se a página carregou)
     * Use um elemento que sempre aparece na tela de login
     */
    private final By loginPageContainer = By.xpath("email"); // Usa o campo email como referência
    
    /**
     * Botão para selecionar login simples
     * ⚠️ ATUALIZAR: Encontre no Inspector
     * Opção 1: Por resource-id: By.id("login-simple-button")
     * Opção 2: Por texto: By.xpath("//android.widget.Button[@text='Login Simples']")
     */
    private final By loginSimpleButton = By.xpath("//android.widget.Button[@text='Login Simples']"); // TODO: Ajustar
    
    /**
     * Botão para selecionar login completo
     * ⚠️ ATUALIZAR: Encontre no Inspector
     */
    private final By loginFullButton = By.xpath("//android.widget.Button[@text='Login Completo']"); // TODO: Ajustar
    
    /**
     * Alerta/mensagem de erro
     * ⚠️ ATUALIZAR: Encontre no Inspector
     * Pode ser TextView ou outro componente Android
     */
    private final By errorAlert = By.xpath("//android.widget.TextView[@text]"); // TODO: Ajustar para encontrar alertas
    
    /**
     * Botão para criar usuário de teste
     * ⚠️ ATUALIZAR: Encontre no Inspector
     */
    private final By createTestUserButton = By.xpath("//android.widget.Button[@text='Criar Usuário Teste']"); // TODO: Ajustar
    
    public LoginPage(AndroidDriver driver) {
        super(driver);
    }
    
    @Override
    public boolean waitForPageLoad() {
        try {
            // Aguardar app inicializar (reduzido de 5000ms para 2000ms)
            Thread.sleep(2000);
            
            // Verificar contextos disponíveis
            Set<String> contexts = driver.getContextHandles();
            logger.info("Contextos disponíveis: {}", contexts);
            
            // Tentar WebView (app React dentro do WebView nativo)
            // Aguardar um pouco mais para garantir que o WebView está pronto (reduzido de 3000ms para 1000ms)
            Thread.sleep(1000);
            
            // Verificar contextos novamente (podem aparecer depois que o WebView carrega)
            contexts = driver.getContextHandles();
            logger.info("Contextos disponíveis após aguardar: {}", contexts);
            
            for (String context : contexts) {
                if (context.toUpperCase().contains("WEBVIEW")) {
                    logger.info("Tentando trocar para contexto WebView: {}", context);
                    try {
                        // Tentar mudar para o contexto WebView
                        driver.context(context);
                        logger.info("Contexto WebView ativado, aguardando React carregar...");
                        
                        // Aguardar WebView e React carregar (reduzido de 10000ms para 3000ms)
                        Thread.sleep(3000);
                        
                        // Tentar encontrar a página de login com múltiplas tentativas
                        By loginPageSelector = By.cssSelector("[data-testid='login-page']");
                        int maxRetries = 3; // Reduzido de 5 para 3
                        for (int i = 0; i < maxRetries; i++) {
                            try {
                                if (isElementPresent(loginPageSelector)) {
                                    logger.info("✅ Página de login encontrada!");
                                    // Verificar se o campo de email também está presente
                                    if (isElementPresent(emailInput)) {
                                        logger.info("✅ Campo de email encontrado - página totalmente carregada!");
                                        return true;
                                    }
                                }
                                Thread.sleep(1000); // Reduzido de 2000ms para 1000ms
                            } catch (Exception e) {
                                logger.debug("Tentativa {} de {} falhou: {}", i + 1, maxRetries, e.getMessage());
                                if (i < maxRetries - 1) {
                                    Thread.sleep(1000); // Reduzido de 2000ms para 1000ms
                                }
                            }
                        }
                        
                        // Se chegou aqui, tentar verificar se pelo menos algum elemento está presente
                        logger.warn("Página de login não encontrada com seletor padrão, tentando alternativas...");
                        if (isElementPresent(emailInput) || isElementPresent(passwordInput)) {
                            logger.info("✅ Elementos de login encontrados (sem página completa)");
                            return true;
                        }
                        
                    } catch (org.openqa.selenium.WebDriverException webViewError) {
                        String errorMsg = webViewError.getMessage();
                        if (errorMsg != null && errorMsg.contains("Chromedriver")) {
                            logger.error("Erro do ChromeDriver: {} - O Appium precisa baixar o ChromeDriver automaticamente", errorMsg);
                            logger.info("Sugestão: Verifique se o Appium está configurado para baixar ChromeDriver automaticamente");
                            // Não retornar false ainda, pode ser que o ChromeDriver esteja sendo baixado
                            Thread.sleep(5000); // Reduzido de 10000ms para 5000ms
                            // Tentar novamente
                            try {
                                driver.context(context);
                                Thread.sleep(2000); // Reduzido de 5000ms para 2000ms
                                if (isElementPresent(emailInput)) {
                                    logger.info("✅ Conseguiu acessar WebView após aguardar ChromeDriver");
                                    return true;
                                }
                            } catch (Exception retryError) {
                                logger.error("Falha ao tentar novamente após erro do ChromeDriver: {}", retryError.getMessage());
                            }
                        } else {
                            logger.error("Erro ao usar WebView: {}", webViewError.getMessage());
                        }
                    } catch (Exception webViewError) {
                        logger.error("Erro ao usar WebView: {} - tentando aguardar mais tempo", webViewError.getMessage());
                        // Tentar aguardar mais e verificar novamente
                        try {
                            Thread.sleep(2000); // Reduzido de 5000ms para 2000ms
                            By loginPageSelector = By.cssSelector("[data-testid='login-page']");
                            if (isElementPresent(loginPageSelector)) {
                                logger.info("✅ Página de login encontrada após aguardar mais tempo");
                                return true;
                            }
                        } catch (Exception retryError) {
                            logger.error("Falha ao aguardar WebView: {}", retryError.getMessage());
                        }
                    }
                }
            }
            
            logger.error("Não foi possível carregar a página de login no WebView");
            return false;
        } catch (Exception e) {
            logger.error("Erro ao aguardar página de login: {}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean isDisplayed() {
        // Verificar se estamos no contexto WebView e se o elemento está presente
        try {
            AppiumDriverManager.switchToWebView(driver);
            By loginPageSelector = By.cssSelector("[data-testid='login-page']");
            return isElementPresent(loginPageSelector) || isElementPresent(emailInput);
        } catch (Exception e) {
            logger.debug("Erro ao verificar se página está exibida: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Seleciona o tipo de login
     * WebView React: usa seletores CSS
     * Nota: Se não houver botões de seleção de tipo, este método pode ser simplificado
     */
    public boolean selectLoginType(String loginType) {
        try {
            // Garantir contexto WebView
            AppiumDriverManager.switchToWebView(driver);
            
            // Se houver botões de seleção de tipo no React, usar seletores CSS
            // Por enquanto, apenas loga o tipo (pode não ser necessário no React)
            logger.info("Tipo de login selecionado (WebView React): {}", loginType);
            return true;
        } catch (Exception e) {
            logger.error("Erro ao selecionar tipo de login: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Preenche o campo de email
     * WebView React: usa seletores CSS com data-testid
     */
    public boolean enterEmail(String email) {
        try {
            // Garantir que estamos no contexto WebView (React)
            AppiumDriverManager.switchToWebView(driver);
            
            // Usar seletor CSS para WebView
            WebElement emailField = waitForElement(emailInput);
            emailField.clear();
            emailField.sendKeys(email);
            logger.info("Email preenchido (WebView React): {}", email);
            return true;
        } catch (Exception e) {
            logger.error("Erro ao preencher email: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Preenche o campo de senha
     * WebView React: usa seletores CSS com data-testid
     */
    public boolean enterPassword(String password) {
        try {
            // Garantir que estamos no contexto WebView (React)
            AppiumDriverManager.switchToWebView(driver);
            
            // Encontrar e preencher o campo de senha
            WebElement passwordField = waitForElement(passwordInput);
            passwordField.clear();
            passwordField.sendKeys(password);
            logger.info("Senha preenchida (WebView React)");
            return true;
        } catch (Exception e) {
            logger.error("Erro ao preencher senha: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Clica no botão de login
     * WebView React: usa seletores CSS com data-testid
     */
    public boolean clickLogin() {
        try {
            // Garantir que estamos no contexto WebView (React)
            AppiumDriverManager.switchToWebView(driver);
            
            // Clicar no botão de login
            waitForElementClickable(loginButton).click();
            logger.info("Botão de login clicado (WebView React)");
            return true;
        } catch (Exception e) {
            logger.error("Erro ao clicar no botão de login: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Realiza login completo
     */
    public boolean login(String email, String password, String loginType) {
        if (!waitForPageLoad()) {
            return false;
        }
        
        selectLoginType(loginType);
        enterEmail(email);
        enterPassword(password);
        return clickLogin();
    }
    
    /**
     * Realiza login simples (método conveniente)
     */
    public boolean loginSimple(String email, String password) {
        return login(email, password, "simple");
    }
    
    /**
     * Retorna a mensagem de erro, se houver
     * WebView React: procura por elementos com data-testid de erro
     */
    public String getErrorMessage() {
        try {
            AppiumDriverManager.switchToWebView(driver);
            // Tentar encontrar mensagem de erro usando seletores CSS
            // Tentar múltiplos seletores possíveis
            try {
                By errorSelector = By.cssSelector("[data-testid='error-message']");
                WebElement errorElement = waitForElement(errorSelector);
                return errorElement.getText();
            } catch (Exception e1) {
                try {
                    By errorSelector = By.cssSelector(".error, [role='alert']");
                    WebElement errorElement = waitForElement(errorSelector);
                    return errorElement.getText();
                } catch (Exception e2) {
                    logger.debug("Nenhuma mensagem de erro encontrada");
                    return null;
                }
            }
        } catch (Exception e) {
            logger.debug("Nenhuma mensagem de erro encontrada");
            return null;
        }
    }
    
    /**
     * Verifica se há mensagem de erro visível
     */
    public boolean isErrorDisplayed() {
        return getErrorMessage() != null;
    }
    
    /**
     * Clica no botão de criar usuário de teste
     * WebView React: usa seletores CSS ou XPath
     */
    public boolean createTestUser() {
        try {
            AppiumDriverManager.switchToWebView(driver);
            // Tentar primeiro com data-testid, depois com XPath para texto
            try {
                By createTestUserButtonCss = By.cssSelector("[data-testid='create-test-user-button']");
                waitForElementClickable(createTestUserButtonCss).click();
                logger.info("Botão de criar usuário de teste clicado (WebView React - CSS)");
                return true;
            } catch (Exception e1) {
                // Se não encontrar por data-testid, tentar com XPath
                By createTestUserButtonXPath = By.xpath("//button[contains(text(), 'Criar Usuário Teste')]");
                waitForElementClickable(createTestUserButtonXPath).click();
                logger.info("Botão de criar usuário de teste clicado (WebView React - XPath)");
                return true;
            }
        } catch (Exception e) {
            logger.error("Erro ao clicar no botão de criar usuário: {}", e.getMessage());
            return false;
        }
    }
}

