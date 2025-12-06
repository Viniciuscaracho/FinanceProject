# 🎯 Guia de Seletores Appium - Lidando com IDs Dinâmicos

## ❌ Problema: IDs Dinâmicos do Radix UI

O Appium Inspector pode retornar seletores como:
```
//android.widget.Button[@resource-id="radix-«r0»"]
//android.widget.Button[@resource-id="radix-«ra»"]
```

**⚠️ Esses IDs são gerados dinamicamente e mudam a cada execução!**

---

## ✅ Soluções Recomendadas

### 1. **Usar WebView com `data-testid` (RECOMENDADO)**

O FrontEnd React já tem `data-testid` nos elementos. Use seletores CSS no contexto WebView:

```java
// ✅ BOM - Estável e confiável
private final By userMenuButton = By.cssSelector("[data-testid='user-menu-trigger']");
private final By modalContainer = By.cssSelector("[data-testid='profile-modal']");
private final By logoutMenuItem = By.cssSelector("[data-testid='logout-menu-item']");

// No código:
ensureWebViewContext(); // Mudar para contexto WebView
WebElement btn = waitForElementClickable(userMenuButton);
btn.click();
```

**Vantagens:**
- ✅ Estável (não muda)
- ✅ Fácil de manter
- ✅ Funciona com React/WebView
- ✅ Já implementado no FrontEnd

---

### 2. **XPath com `starts-with()` para IDs Dinâmicos**

Se precisar usar contexto Native, use XPath com `starts-with()`:

```java
// ✅ BOM - Funciona com IDs dinâmicos
private final By modalContainer = By.xpath("//android.widget.Button[starts-with(@resource-id,'radix-')]");
private final By userMenuButton = By.xpath("//android.widget.Button[starts-with(@resource-id,'radix-')]");

// ❌ RUIM - Não funciona (ID muda)
private final By modalContainer = By.xpath("//android.widget.Button[@resource-id='radix-«r0»']");
```

**Vantagens:**
- ✅ Funciona com IDs dinâmicos
- ✅ Não precisa mudar código quando ID muda

**Desvantagens:**
- ⚠️ Pode pegar múltiplos elementos
- ⚠️ Menos específico

---

### 3. **Seletores por Texto (Fallback)**

Use apenas como última opção:

```java
// ⚠️ Usar apenas se não houver alternativa
private final By logoutButton = By.xpath("//android.view.MenuItem[contains(@text,'Sair')]");
private final By profileButton = By.xpath("//android.view.MenuItem[contains(@text,'Perfil')]");
```

**Desvantagens:**
- ❌ Quebra se texto mudar (tradução, etc)
- ❌ Menos confiável

---

## 🔄 Estratégia Híbrida (Recomendada)

Use WebView primeiro, com fallback para Native:

```java
public boolean openProfileModal() {
    try {
        // Tentar WebView primeiro (mais estável)
        try {
            ensureWebViewContext();
            WebElement userBtn = waitForElementClickable(userMenuButton);
            userBtn.click();
            logger.info("Modal aberto (WEBVIEW)");
            return true;
        } catch (Exception e) {
            // Fallback para Native com XPath starts-with
            logger.debug("WebView não disponível, tentando Native");
            ensureNativeContext();
            WebElement userBtn = waitForElementClickable(userMenuButtonNative);
            userBtn.click();
            logger.info("Modal aberto (NATIVE_APP)");
            return true;
        }
    } catch (Exception e) {
        logger.error("Erro ao abrir modal: {}", e.getMessage());
        return false;
    }
}
```

---

## 📋 Checklist: Como Encontrar Seletores

### No Appium Inspector:

1. **Conecte ao dispositivo/emulador**
2. **Mude para contexto WebView** (se disponível)
   - Procure por: `WEBVIEW_com.barbermanagement.app.debug`
3. **Inspecione o elemento**
4. **Procure por `data-testid`** no HTML
5. **Use CSS Selector**: `[data-testid='nome-do-testid']`

### Se WebView não estiver disponível:

1. **Use contexto NATIVE_APP**
2. **Inspecione o elemento**
3. **Se ID começar com `radix-`**: Use `starts-with(@resource-id,'radix-')`
4. **Se tiver texto visível**: Use `contains(@text,'texto')`
5. **Evite IDs exatos** que contenham caracteres especiais como `«r0»`

---

## 🎨 Exemplos Práticos

### Exemplo 1: Botão de Login

```java
// ✅ RECOMENDADO - WebView com data-testid
private final By loginButton = By.cssSelector("[data-testid='login-button']");

// No método:
ensureWebViewContext();
WebElement btn = waitForElementClickable(loginButton);
btn.click();
```

### Exemplo 2: Modal do Radix UI

```java
// ✅ RECOMENDADO - WebView
private final By modalContainer = By.cssSelector("[data-testid='profile-modal']");

// ⚠️ FALLBACK - Native com starts-with
private final By modalContainerNative = By.xpath("//android.widget.Button[starts-with(@resource-id,'radix-')]");
```

### Exemplo 3: Input Field

```java
// ✅ RECOMENDADO - WebView
private final By emailInput = By.cssSelector("[data-testid='email-input']");

// No método:
ensureWebViewContext();
WebElement input = waitForElement(emailInput);
input.sendKeys("admin@exemplo.com");
```

---

## 🔍 Verificar `data-testid` no FrontEnd

Todos os elementos importantes já têm `data-testid`:

- `data-testid="login-page"`
- `data-testid="email-input"`
- `data-testid="password-input"`
- `data-testid="login-button"`
- `data-testid="user-menu-trigger"`
- `data-testid="profile-modal"`
- `data-testid="profile-menu-item"`
- `data-testid="settings-menu-item"`
- `data-testid="logout-menu-item"`

**Arquivo:** `FrontEnd/src/components/Login.jsx` e `FrontEnd/src/components/layout/Header.jsx`

---

## ⚠️ Erros Comuns

### ❌ ERRADO:
```java
// ID muda a cada execução!
By.xpath("//android.widget.Button[@resource-id='radix-«r0»']")
```

### ✅ CORRETO:
```java
// Usa data-testid (estável)
By.cssSelector("[data-testid='user-menu-trigger']")

// OU XPath com starts-with (funciona com IDs dinâmicos)
By.xpath("//android.widget.Button[starts-with(@resource-id,'radix-')]")
```

---

## 📚 Referências

- [Appium WebView Guide](https://appium.io/docs/en/writing-running-appium/web/hybrid/)
- [XPath Functions](https://www.w3schools.com/xml/xpath_syntax.asp)
- [CSS Selectors](https://www.w3schools.com/cssref/css_selectors.asp)

---

## 🎯 Resumo

1. **✅ PREFERIR**: WebView + `data-testid` (CSS Selector)
2. **⚠️ FALLBACK**: Native + XPath `starts-with()` para IDs dinâmicos
3. **❌ EVITAR**: IDs exatos com caracteres especiais dinâmicos
4. **🔄 ESTRATÉGIA**: Tente WebView primeiro, use Native como fallback

