package com.barbermanagement.tests.pages;

import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static com.barbermanagement.tests.utils.AppiumDriverManager.switchToWebView;

/**
 * Page Object para a página de Dashboard
 */
public class DashboardPage extends BasePage {
    private static final Logger logger = LoggerFactory.getLogger(DashboardPage.class);
    
    // Locators - ajuste conforme os elementos reais da sua aplicação
    private final By dashboardContainer = By.cssSelector("[data-testid='dashboard']");
    private final By header = By.cssSelector("header");
    private final By userMenu = By.cssSelector("[data-testid='user-menu']");
    private final By logoutButton = By.xpath("//button[contains(text(), 'Sair')]");
    private final By transactionsLink = By.xpath("//a[contains(text(), 'Transações')]");
    private final By contactsLink = By.xpath("//a[contains(text(), 'Contatos')]");
    
    public DashboardPage(AndroidDriver driver) {
        super(driver);
    }
    
    @Override
    public boolean waitForPageLoad() {
        try {
            switchToWebView(driver);
            waitForElement(header);
            logger.info("Página de dashboard carregada com sucesso");
            return true;
        } catch (Exception e) {
            logger.error("Erro ao aguardar página de dashboard: {}", e.getMessage());
            return false;
        }
    }
    
    @Override
    public boolean isDisplayed() {
        return isElementPresent(dashboardContainer) || isElementPresent(header);
    }
    
    /**
     * Clica no botão de logout
     * Usa o ProfileModalPage para abrir o modal e fazer logout
     */
    public boolean clickLogout() {
        try {
            ensureWebViewContext();
            
            // Usar o seletor correto do menu do usuário (mesmo do ProfileModalPage)
            By userMenuTrigger = By.cssSelector("[data-testid='user-menu-trigger']");
            WebElement menu = waitForElementClickable(userMenuTrigger);
            menu.click();
            
            // Aguardar modal abrir (reduzido de 1000ms para 300ms)
            Thread.sleep(300);
            
            // Clicar em logout usando o seletor correto do ProfileModalPage
            By logoutMenuItem = By.cssSelector("[data-testid='logout-menu-item']");
            WebElement logoutBtn = waitForElementClickable(logoutMenuItem);
            logoutBtn.click();
            
            logger.info("Logout realizado");
            return true;
        } catch (Exception e) {
            logger.error("Erro ao fazer logout: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Navega para a página de transações
     */
    public boolean navigateToTransactions() {
        try {
            ensureWebViewContext();
            WebElement link = waitForElementClickable(transactionsLink);
            link.click();
            logger.info("Navegado para página de transações");
            return true;
        } catch (Exception e) {
            logger.error("Erro ao navegar para transações: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Navega para a página de contatos
     */
    public boolean navigateToContacts() {
        try {
            ensureWebViewContext();
            WebElement link = waitForElementClickable(contactsLink);
            link.click();
            logger.info("Navegado para página de contatos");
            return true;
        } catch (Exception e) {
            logger.error("Erro ao navegar para contatos: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Reseta o estado: volta para o dashboard inicial
     */
    @Override
    public boolean resetToInitialState() {
        try {
            ensureWebViewContext();
            
            // Tentar navegar para home/dashboard
            try {
                driver.executeScript("window.location.href = '/';");
                Thread.sleep(1000); // Reduzido de 2000ms para 1000ms
                logger.info("Navegado para dashboard inicial");
            } catch (Exception e) {
                logger.debug("Não foi possível navegar via JS, tentando recarregar");
                reloadPage();
            }
            
            // Verificar se está no dashboard
            waitForPageLoad();
            return true;
        } catch (Exception e) {
            logger.debug("Erro ao resetar dashboard: {}", e.getMessage());
            return super.resetToInitialState();
        }
    }
}




