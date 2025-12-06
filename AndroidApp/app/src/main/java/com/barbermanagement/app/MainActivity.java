package com.barbermanagement.app;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;
import java.net.URL;
import java.net.MalformedURLException;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    
    // URL do frontend - detecta automaticamente se é emulador ou dispositivo físico
    private static final String FRONTEND_URL_EMULATOR = "http://10.0.2.2:5173";
    private static final String FRONTEND_URL_PHYSICAL = "http://192.168.201.56:5173"; // IP da máquina na rede local
    
    /**
     * Detecta se está rodando em emulador ou dispositivo físico
     */
    private boolean isEmulator() {
        return android.os.Build.FINGERPRINT.startsWith("generic")
                || android.os.Build.FINGERPRINT.startsWith("unknown")
                || android.os.Build.MODEL.contains("google_sdk")
                || android.os.Build.MODEL.contains("Emulator")
                || android.os.Build.MODEL.contains("Android SDK built for x86")
                || android.os.Build.MANUFACTURER.contains("Genymotion")
                || (android.os.Build.BRAND.startsWith("generic") && android.os.Build.DEVICE.startsWith("generic"))
                || "google_sdk".equals(android.os.Build.PRODUCT);
    }
    
    /**
     * Obtém a URL do frontend baseado no tipo de dispositivo
     */
    private String getFrontendUrl() {
        if (isEmulator()) {
            return FRONTEND_URL_EMULATOR;
        } else {
            // Para dispositivo físico, você pode:
            // 1. Usar um IP fixo (ajuste FRONTEND_URL_PHYSICAL acima)
            // 2. Ou usar SharedPreferences para configurar dinamicamente
            return FRONTEND_URL_PHYSICAL;
        }
    }
    
    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        
        // Configurar WebView
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        
        // Permitir requisições HTTP (para desenvolvimento)
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // WebViewClient para controlar navegação
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                android.util.Log.i("MainActivity", "📄 Página iniciando: " + url);
            }
            
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                android.util.Log.d("MainActivity", "🔗 Carregando URL: " + url);
                view.loadUrl(url);
                return true;
            }
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                android.util.Log.i("MainActivity", "✅ Página carregada: " + url);
                
                // Determinar URL da API baseado no tipo de dispositivo
                String apiBaseUrl;
                boolean isEmulatorDevice = isEmulator();
                
                android.util.Log.i("MainActivity", "🔍 Detectando ambiente:");
                android.util.Log.i("MainActivity", "  - É emulador: " + isEmulatorDevice);
                android.util.Log.i("MainActivity", "  - URL do frontend: " + getFrontendUrl());
                
                if (isEmulatorDevice) {
                    // Emulador: usa 10.0.2.2 para acessar localhost do host
                    apiBaseUrl = "http://10.0.2.2:3000/api/v1";
                    android.util.Log.i("MainActivity", "🤖 Usando URL do emulador: " + apiBaseUrl);
                } else {
                    // Dispositivo físico: extrai o hostname da URL do frontend
                    try {
                        URL frontendUrl = new URL(getFrontendUrl());
                        String host = frontendUrl.getHost();
                        apiBaseUrl = "http://" + host + ":3000/api/v1";
                        android.util.Log.i("MainActivity", "📱 Usando URL do dispositivo físico: " + apiBaseUrl);
                    } catch (MalformedURLException e) {
                        // Fallback: usa IP fixo se não conseguir fazer parse
                        android.util.Log.e("MainActivity", "❌ Erro ao fazer parse da URL do frontend: " + e.getMessage());
                        String frontendHost = FRONTEND_URL_PHYSICAL.replace("http://", "").replace(":5173", "");
                        apiBaseUrl = "http://" + frontendHost + ":3000/api/v1";
                        android.util.Log.w("MainActivity", "⚠️ Usando fallback: " + apiBaseUrl);
                    }
                }
                
                // Injetar URL da API e variáveis para o JavaScript (múltiplas tentativas)
                injectApiUrl(view, apiBaseUrl, 0);
            }
            
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                android.util.Log.e("MainActivity", "❌ Erro ao carregar página: " + errorCode + " - " + description);
                android.util.Log.e("MainActivity", "   URL que falhou: " + failingUrl);
            }
        });
        
        // Adicionar console para capturar logs do JavaScript
        webView.setWebChromeClient(new android.webkit.WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                android.util.Log.d("MainActivity", "🌐 JS Console: " + consoleMessage.message() + 
                    " -- From line " + consoleMessage.lineNumber() + " of " + consoleMessage.sourceId());
                return true;
            }
        });
        
        // Carregar o frontend (detecta automaticamente emulador ou dispositivo físico)
        String frontendUrl = getFrontendUrl();
        android.util.Log.d("MainActivity", "Carregando frontend de: " + frontendUrl + " (Emulador: " + isEmulator() + ")");
        webView.loadUrl(frontendUrl);
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
    
    /**
     * Injeta a URL da API no JavaScript (com retry)
     */
    private void injectApiUrl(WebView view, String apiBaseUrl, int attempt) {
        if (attempt >= 3) {
            android.util.Log.e("MainActivity", "❌ Falha ao injetar URL da API após 3 tentativas");
            return;
        }
        
        String injectScript = String.format(
            "(function() {" +
            "  try {" +
            "    window.APP_API_BASE_URL = '%s';" +
            "    window.appiumReady = true;" +
            "    window.APP_DEBUG_INFO = {" +
            "      apiUrl: '%s'," +
            "      hostname: window.location.hostname," +
            "      userAgent: navigator.userAgent," +
            "      timestamp: new Date().toISOString()" +
            "    };" +
            "    console.log('🔧 API Base URL injetada:', window.APP_API_BASE_URL);" +
            "    console.log('📱 Appium ready');" +
            "    console.log('🔍 Debug Info:', window.APP_DEBUG_INFO);" +
            "    " +
            "    // Testar conexão com backend" +
            "    fetch(window.APP_API_BASE_URL + '/health')" +
            "      .then(response => response.json())" +
            "      .then(data => {" +
            "        console.log('✅ Backend conectado:', data);" +
            "        window.APP_BACKEND_CONNECTED = true;" +
            "      })" +
            "      .catch(error => {" +
            "        console.error('❌ Erro ao conectar backend:', error);" +
            "        window.APP_BACKEND_CONNECTED = false;" +
            "        window.APP_BACKEND_ERROR = error.message;" +
            "      });" +
            "  } catch (e) {" +
            "    console.error('❌ Erro ao injetar URL:', e);" +
            "  }" +
            "})();",
            apiBaseUrl, apiBaseUrl
        );
        
        view.evaluateJavascript(injectScript, new android.webkit.ValueCallback<String>() {
            @Override
            public void onReceiveValue(String value) {
                android.util.Log.i("MainActivity", "✅ Script de injeção executado (tentativa " + (attempt + 1) + ")");
                
                // Verificar se foi injetado corretamente após um delay
                view.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        view.evaluateJavascript(
                            "(function() { return window.APP_API_BASE_URL || null; })();",
                            new android.webkit.ValueCallback<String>() {
                                @Override
                                public void onReceiveValue(String result) {
                                    if (result == null || "null".equals(result)) {
                                        android.util.Log.w("MainActivity", "⚠️ URL não foi injetada, tentando novamente...");
                                        injectApiUrl(view, apiBaseUrl, attempt + 1);
                                    } else {
                                        android.util.Log.i("MainActivity", "✅ URL da API confirmada: " + result);
                                    }
                                }
                            }
                        );
                    }
                }, 500);
            }
        });
        
        android.util.Log.i("MainActivity", "🔧 Injetando URL da API: " + apiBaseUrl + " (tentativa " + (attempt + 1) + ")");
    }
    
    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}

