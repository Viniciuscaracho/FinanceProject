package com.barbermanagement.tests.pages;

import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.barbermanagement.tests.utils.AppiumDriverManager;

public class ProfileModalPage extends BasePage {
    private static final Logger logger = LoggerFactory.getLogger(ProfileModalPage.class);

    // ============================================================
    // SELETORES WEBVIEW (Recomendado - mais estável)
    // ============================================================
    // ✅ PREFERIR: Usar seletores WebView com data-testid (mais estável)
    // Os elementos React têm data-testid definidos no FrontEnd
    
    // Botão que abre o modal (avatar do usuário)
    private final By userMenuButton = By.cssSelector("[data-testid='user-menu-trigger']");
    
    // Modal container
    private final By modalContainer = By.cssSelector("[data-testid='profile-modal']");
    
    // Itens do menu
    private final By profileMenuItem = By.cssSelector("[data-testid='profile-menu-item']");
    private final By settingsMenuItem = By.cssSelector("[data-testid='settings-menu-item']");
    private final By logoutMenuItem = By.cssSelector("[data-testid='logout-menu-item']");

    public ProfileModalPage(AndroidDriver driver) {
        super(driver);
    }

    @Override
    public boolean waitForPageLoad() {
        try {
            ensureWebViewContext();
            waitForElement(modalContainer);
            logger.info("Modal de perfil carregado (WEBVIEW)");
            return true;
        } catch (Exception e) {
            logger.error("Erro ao aguardar modal: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public boolean isDisplayed() {
        try {
            ensureWebViewContext();
            return isElementPresent(modalContainer) || 
                   isElementPresent(profileMenuItem) || 
                   isElementPresent(logoutMenuItem);
        } catch (Exception e) {
            logger.debug("Modal não está visível: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Abre o modal de perfil clicando no botão do usuário
     */
    public boolean openProfileModal() {
        try {
            ensureWebViewContext();
            WebElement userBtn = waitForElementClickable(userMenuButton);
            userBtn.click();
            // Aguardar modal aparecer usando wait explícito ao invés de sleep fixo
            try {
                waitForElement(modalContainer);
            } catch (Exception e) {
                // Se modal não aparecer imediatamente, aguardar um pouco
                Thread.sleep(200);
            }
            logger.info("Modal de perfil aberto (WEBVIEW)");
            return true;
        } catch (Exception e) {
            logger.error("Erro ao abrir modal: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Verifica se o modal de perfil está visível
     */
    public boolean isProfileModalVisible() {
        try {
            ensureWebViewContext();
            return isElementVisible(modalContainer) || 
                   isElementVisible(profileMenuItem) || 
                   isElementVisible(logoutMenuItem);
        } catch (Exception e) {
            logger.error("Erro ao verificar modal: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Clica em "Meu Perfil"
     */
    public boolean clickProfile() {
        try {
            ensureWebViewContext();
            WebElement btn = waitForElementClickable(profileMenuItem);
            btn.click();
            logger.info("Clicou em Meu Perfil (WEBVIEW)");
            return true;
        } catch (Exception e) {
            logger.error("Erro ao clicar em Meu Perfil: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Clica em "Configurações"
     */
    public boolean clickSettings() {
        try {
            ensureWebViewContext();
            WebElement btn = waitForElementClickable(settingsMenuItem);
            btn.click();
            logger.info("Clicou em Configurações (WEBVIEW)");
            return true;
        } catch (Exception e) {
            logger.error("Erro ao clicar em Configurações: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Realiza logout do perfil
     */
    public boolean logoutProfile() {
        try {
            ensureWebViewContext();
            WebElement logoutBtn = waitForElementClickable(logoutMenuItem);
            logoutBtn.click();
            logger.info("Logout realizado (WEBVIEW)");
            return true;
        } catch (Exception e) {
            logger.error("Erro ao fazer logout: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Fecha o modal de perfil
     * Nota: O DropdownMenu fecha ao clicar novamente no trigger (comportamento toggle)
     */
    public boolean closeProfileModal() {
        try {
            ensureWebViewContext();
            
            if (!isProfileModalVisible()) {
                logger.info("Modal já estava fechado");
                return true;
            }
            
            WebElement userBtn = waitForElementClickable(userMenuButton);
            userBtn.click();
            
           boolean disappeared = false;
            try {
                disappeared = waitForElementDisappear(modalContainer);
            } catch (Exception e) {
                logger.debug("Wait for disappear falhou, tentando outras estratégias: {}", e.getMessage());
            }
            
            if (!disappeared) {
                try {
                    Thread.sleep(400); // Dar tempo para animação de fechamento
                    // Verificar se os elementos do menu não estão mais visíveis
                    boolean menuItemsInvisible = !isElementVisible(profileMenuItem) && 
                                                 !isElementVisible(logoutMenuItem);
                    if (menuItemsInvisible) {
                        disappeared = true;
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            
            // Estratégia 3: Verificação final usando isProfileModalVisible
            if (!disappeared) {
                // Aguardar mais um pouco e verificar novamente
                try {
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                disappeared = !isProfileModalVisible();
            }
            
            if (disappeared) {
                logger.info("Modal fechado com sucesso");
                return true;
            } else {
                logger.warn("Modal ainda está visível após tentativa de fechar");
                // Tentar clicar novamente como último recurso
                try {
                    userBtn = waitForElementClickable(userMenuButton);
                    userBtn.click();
                    Thread.sleep(300);
                    if (!isProfileModalVisible()) {
                        logger.info("Modal fechado na segunda tentativa");
                        return true;
                    }
                } catch (Exception e) {
                    logger.debug("Segunda tentativa de fechar falhou: {}", e.getMessage());
                }
                return false;
            }
        } catch (Exception e) {
            logger.error("Erro ao fechar modal: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Reseta o estado: fecha o modal se estiver aberto
     * Nota: O logout deve ser feito no teste, não aqui
     */
    @Override
    public boolean resetToInitialState() {
        try {
            // Apenas fechar modal se estiver aberto
            if (isProfileModalVisible()) {
                closeProfileModal();
                // Reduzido de 500ms para 200ms
                Thread.sleep(200);
                logger.info("Modal fechado");
            } else {
                logger.debug("Modal não estava aberto");
            }
            return true;
        } catch (Exception e) {
            logger.debug("Erro ao resetar estado do modal: {}", e.getMessage());
            return false;
        }
    }
}
