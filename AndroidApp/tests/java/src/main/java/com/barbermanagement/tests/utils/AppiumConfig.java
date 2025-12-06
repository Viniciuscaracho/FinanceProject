package com.barbermanagement.tests.utils;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Classe para carregar configurações do Appium a partir de arquivos JSON
 */
public class AppiumConfig {
    private static final Logger logger = LoggerFactory.getLogger(AppiumConfig.class);
    
    private static final String CONFIG_DIR = "config/appium";
    private static final String CAPABILITIES_FILE = "capabilities.json";
    private static final String CAPABILITIES_WEBVIEW_FILE = "capabilities.webview.json";
    private static final String CAPABILITIES_PHYSICAL_FILE = "capabilities.physical.json";
    private static final String SERVER_CONFIG_FILE = "server.json";
    
    /**
     * Carrega capabilities padrão
     */
    public static JsonObject loadCapabilities() {
        return loadJsonFile(CAPABILITIES_FILE);
    }
    
    /**
     * Carrega capabilities para WebView
     */
    public static JsonObject loadWebViewCapabilities() {
        return loadWebViewCapabilities(false);
    }
    
    /**
     * Carrega capabilities para WebView
     * @param usePhysicalDevice Se true, usa capabilities para dispositivo físico
     */
    public static JsonObject loadWebViewCapabilities(boolean usePhysicalDevice) {
        if (usePhysicalDevice) {
            JsonObject physical = loadJsonFile(CAPABILITIES_PHYSICAL_FILE);
            if (physical.size() > 0) {
                return physical;
            }
        }
        return loadJsonFile(CAPABILITIES_WEBVIEW_FILE);
    }
    
    /**
     * Detecta automaticamente se deve usar dispositivo físico ou emulador
     * @return true se deve usar dispositivo físico
     */
    public static boolean shouldUsePhysicalDevice() {
        String deviceName = System.getProperty("appium.device.name", "");
        if (deviceName.isEmpty()) {
            deviceName = System.getenv("APPIUM_DEVICE_NAME");
        }
        
        // Se deviceName não começa com "emulator-", assume dispositivo físico
        return deviceName != null && !deviceName.isEmpty() && !deviceName.startsWith("emulator-");
    }
    
    /**
     * Obtém o nome do dispositivo automaticamente via ADB
     */
    public static String detectDeviceName() {
        try {
            Process process = Runtime.getRuntime().exec("adb devices");
            java.io.BufferedReader reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(process.getInputStream())
            );
            
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.contains("device") && !line.contains("List of devices")) {
                    String deviceId = line.split("\\s+")[0];
                    if (!deviceId.startsWith("emulator-")) {
                        return deviceId; // Dispositivo físico
                    }
                }
            }
        } catch (Exception e) {
            logger.debug("Erro ao detectar dispositivo: {}", e.getMessage());
        }
        return "emulator-5554"; // Default para emulador
    }
    
    /**
     * Carrega configuração do servidor
     */
    public static JsonObject loadServerConfig() {
        return loadJsonFile(SERVER_CONFIG_FILE);
    }
    
    /**
     * Carrega um arquivo JSON
     */
    private static JsonObject loadJsonFile(String filename) {
        try {
            // Tentar caminho relativo primeiro (quando executado do diretório de testes)
            Path configPath = Paths.get("../../config/appium", filename);
            
            if (!configPath.toFile().exists()) {
                // Tentar caminho relativo do diretório de testes
                configPath = Paths.get("AndroidApp", CONFIG_DIR, filename);
            }
            
            if (!configPath.toFile().exists()) {
                // Tentar caminho relativo
                configPath = Paths.get(CONFIG_DIR, filename);
            }
            
            if (!configPath.toFile().exists()) {
                // Tentar caminho absoluto
                String projectRoot = System.getProperty("user.dir");
                // Se estamos no diretório de testes, subir dois níveis
                if (projectRoot.endsWith("tests/java")) {
                    projectRoot = Paths.get(projectRoot, "..", "..").normalize().toString();
                }
                configPath = Paths.get(projectRoot, "AndroidApp", CONFIG_DIR, filename);
            }
            
            Gson gson = new Gson();
            try (FileReader reader = new FileReader(configPath.toFile())) {
                JsonObject json = gson.fromJson(reader, JsonObject.class);
                logger.info("Configuração carregada: {}", filename);
                return json;
            }
        } catch (IOException e) {
            logger.error("Erro ao carregar configuração {}: {}", filename, e.getMessage());
            return new JsonObject(); // Retorna objeto vazio em caso de erro
        }
    }
    
    /**
     * Obtém a URL do servidor Appium
     */
    public static String getServerUrl() {
        JsonObject serverConfig = loadServerConfig();
        if (serverConfig.has("server")) {
            JsonObject server = serverConfig.getAsJsonObject("server");
            String host = server.has("host") ? server.get("host").getAsString() : "127.0.0.1";
            int port = server.has("port") ? server.get("port").getAsInt() : 4723;
            String path = server.has("path") ? server.get("path").getAsString() : "/";
            return String.format("http://%s:%d%s", host, port, path);
        }
        return "http://127.0.0.1:4723/";
    }
}




