package com.barbermanagement.tests.pages;

import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;

import static com.barbermanagement.tests.utils.Constants.EXPLICIT_WAIT;
import static com.barbermanagement.tests.utils.AppiumDriverManager.switchToWebView;

/**
 * Classe base para todas as Page Objects
 */
public abstract class BasePage {
    protected static final Logger logger = LoggerFactory.getLogger(BasePage.class);
    protected AndroidDriver driver;
    protected WebDriverWait wait;
    
    public BasePage(AndroidDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(EXPLICIT_WAIT));
    }
    
    /**
     * Verifica se um elemento está presente
     */
    protected boolean isElementPresent(By locator) {
        try {
            wait.until(ExpectedConditions.presenceOfElementLocated(locator));
            return true;
        } catch (Exception e) {
            logger.debug("Elemento não encontrado: {}", locator);
            return false;
        }
    }
    
    /**
     * Verifica se um elemento está visível
     */
    protected boolean isElementVisible(By locator) {
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
            return true;
        } catch (Exception e) {
            logger.debug("Elemento não visível: {}", locator);
            return false;
        }
    }
    
    /**
     * Aguarda um elemento aparecer
     */
    protected WebElement waitForElement(By locator) {
        return wait.until(ExpectedConditions.presenceOfElementLocated(locator));
    }
    
    /**
     * Aguarda um elemento ficar clicável
     */
    protected WebElement waitForElementClickable(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }
    
    /**
     * Aguarda um elemento desaparecer (não estar mais presente ou visível)
     */
    protected boolean waitForElementDisappear(By locator) {
        try {
            wait.until(ExpectedConditions.invisibilityOfElementLocated(locator));
            return true;
        } catch (Exception e) {
            logger.debug("Elemento ainda está visível ou presente: {}", locator);
            return false;
        }
    }
    
    /**
     * Aguarda um elemento não estar mais presente no DOM
     */
    protected boolean waitForElementNotPresent(By locator) {
        try {
            wait.until(ExpectedConditions.not(ExpectedConditions.presenceOfElementLocated(locator)));
            return true;
        } catch (Exception e) {
            logger.debug("Elemento ainda está presente no DOM: {}", locator);
            return false;
        }
    }
    
    /**
     * Garante que estamos no contexto WebView
     * ⚠️ Nota: Esta automação foca em Android Nativo, este método é apenas para fallback
     */
    protected void ensureWebViewContext() {
        // Mantido apenas para compatibilidade, mas foco é Android Nativo
        try {
            switchToWebView(driver);
        } catch (Exception e) {
            logger.debug("WebView não disponível - usando contexto NATIVE");
        }
    }
    
    /**
     * Garante que estamos no contexto Native (Android)
     * Este é o contexto principal para esta automação
     */
    protected void ensureNativeContext() {
        try {
            if (driver instanceof io.appium.java_client.android.AndroidDriver) {
                ((io.appium.java_client.android.AndroidDriver) driver).context("NATIVE_APP");
            }
        } catch (Exception e) {
            logger.debug("Erro ao garantir contexto NATIVE: {}", e.getMessage());
        }
    }
    
    /**
     * Aguarda a página carregar (deve ser implementado por cada página)
     */
    public abstract boolean waitForPageLoad();
    
    /**
     * Verifica se a página está exibida (deve ser implementado por cada página)
     */
    public abstract boolean isDisplayed();
    
    /**
     * Reseta o estado para o inicial (volta para a tela inicial)
     * Pode ser sobrescrito por páginas específicas
     */
    public boolean resetToInitialState() {
        try {
            // Fechar qualquer modal ou popup pressionando back
            ensureNativeContext();
            driver.navigate().back();
            Thread.sleep(200); // Reduzido de 500ms para 200ms
            
            // Tentar voltar mais uma vez se necessário
            try {
                driver.navigate().back();
                Thread.sleep(200); // Reduzido de 500ms para 200ms
            } catch (Exception e) {
                // Ignorar se não conseguir voltar mais
            }
            
            logger.info("Estado resetado para inicial");
            return true;
        } catch (Exception e) {
            logger.debug("Erro ao resetar estado: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Recarrega a página atual (WebView)
     */
    public boolean reloadPage() {
        try {
            ensureWebViewContext();
            driver.navigate().refresh();
            Thread.sleep(1000); // Reduzido de 2000ms para 1000ms
            logger.info("Página recarregada");
            return true;
        } catch (Exception e) {
            logger.debug("Erro ao recarregar página: {}", e.getMessage());
            return false;
        }
    }
}

