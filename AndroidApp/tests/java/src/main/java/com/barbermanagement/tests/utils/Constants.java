package com.barbermanagement.tests.utils;

/**
 * Constantes usadas nos testes
 */
public class Constants {
    
    // Timeouts (em segundos)
    public static final int IMPLICIT_WAIT = 10;
    public static final int EXPLICIT_WAIT = 20;
    public static final int PAGE_LOAD_TIMEOUT = 30;
    
    // URLs
    public static final String FRONTEND_URL_EMULATOR = "http://10.0.2.2:5173";
    public static final String FRONTEND_URL_LOCALHOST = "http://localhost:5173";
    
    // Package e Activity do App
    public static final String APP_PACKAGE = "com.barbermanagement.app.debug";
    public static final String APP_ACTIVITY = "com.barbermanagement.app.MainActivity";
    
    // Credenciais de teste
    public static final String TEST_USER_EMAIL = "admin@exemplo.com";
    public static final String TEST_USER_PASSWORD = "password";
    
    // Diretórios
    public static final String SCREENSHOTS_DIR = "tests/java/e2e/screenshots/";
    public static final String REPORTS_DIR = "tests/java/e2e/reports/";
    
    // Locators comuns
    public static class Locators {
        public static final String LOGIN_PAGE = "[data-testid='login-page']";
        public static final String EMAIL_INPUT = "[data-testid='email-input']";
        public static final String PASSWORD_INPUT = "[data-testid='password-input']";
        public static final String LOGIN_BUTTON = "[data-testid='login-button']";
    }
}







