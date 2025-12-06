# 📋 Planos do Stripe Criados para Testes

## ✅ Planos Criados com Sucesso

### 🟢 Plano Básico
**Produto ID**: `prod_TXhtYYtVHfhTnJ`

- **Mensal**: 
  - Preço ID: `price_1SacTuDeZMTSsvwKEPjiGjJ0`
  - Valor: **R$ 49,00/mês**
  
- **Anual**: 
  - Preço ID: `price_1SacTuDeZMTSsvwK9uPZyn2s`
  - Valor: **R$ 490,00/ano** (economia de 2 meses)

**Descrição**: Plano básico para pequenos negócios. Ideal para iniciantes.

---

### ⭐ Plano Profissional (Popular)
**Produto ID**: `prod_TXhtD2GN4P4dHx`

- **Mensal**: 
  - Preço ID: `price_1SacTvDeZMTSsvwK7nIEjbHo`
  - Valor: **R$ 99,00/mês**
  - ⭐ Marcado como popular
  
- **Anual**: 
  - Preço ID: `price_1SacTvDeZMTSsvwK4avpjARG`
  - Valor: **R$ 990,00/ano** (economia de 2 meses)
  - ⭐ Marcado como popular

**Descrição**: Plano profissional com recursos avançados. Ideal para empresas em crescimento.

---

### 🏢 Plano Empresarial
**Produto ID**: `prod_TXhtPveM4WjsdF`

- **Mensal**: 
  - Preço ID: `price_1SacTwDeZMTSsvwK2Ro650vR`
  - Valor: **R$ 199,00/mês**
  
- **Anual**: 
  - Preço ID: `price_1SacTwDeZMTSsvwKrvj2ZrLk`
  - Valor: **R$ 1.990,00/ano** (economia de 2 meses)

**Descrição**: Plano empresarial com todos os recursos. Ideal para grandes empresas e franquias.

---

## 🧪 Como Testar

### 1. Acessar a Página de Assinatura

Acesse: `http://localhost:5173/subscription`

### 2. Ver os Planos

Você deve ver os 6 planos listados (3 produtos × 2 intervalos cada).

### 3. Testar Checkout

1. Clique em "Assinar Agora" em qualquer plano
2. Você será redirecionado para o Stripe Checkout
3. Use os cartões de teste do Stripe:
   - **Sucesso**: `4242 4242 4242 4242`
   - **Falha**: `4000 0000 0000 0002`
   - **Requer autenticação**: `4000 0025 0000 3155`
   - Data: qualquer data futura (ex: 12/25)
   - CVC: qualquer 3 dígitos (ex: 123)

### 4. Verificar no Stripe Dashboard

Acesse: https://dashboard.stripe.com/test/products

Você verá todos os produtos criados com a marca `barber_management` no metadata.

---

## 📝 Comandos Úteis

### Listar todos os planos

```bash
rails stripe:plans:list
```

### Criar planos novamente (se necessário)

```bash
rails stripe:plans:create_test
```

**Nota**: Se os planos já existirem, o Stripe pode retornar erro. Isso é normal.

---

## 🔍 Verificar Planos via API

No console do Rails:

```ruby
BarberManagement::Stripe::Client.with_api_key do
  products = Stripe::Product.list(active: true, limit: 100)
  products.data.each do |product|
    next unless product.metadata['source'] == 'barber_management'
    puts "#{product.name} - #{product.id}"
  end
end
```

---

## 💳 Cartões de Teste do Stripe

Para testar pagamentos no modo de teste:

| Cenário | Número do Cartão | Resultado |
|---------|------------------|-----------|
| Sucesso | `4242 4242 4242 4242` | Pagamento aprovado |
| Falha | `4000 0000 0000 0002` | Pagamento recusado |
| Requer autenticação | `4000 0025 0000 3155` | Requer 3D Secure |
| Insuficiente | `4000 0000 0000 9995` | Fundos insuficientes |

**Detalhes do cartão de teste:**
- Data de expiração: Qualquer data futura (ex: 12/25)
- CVC: Qualquer 3 dígitos (ex: 123)
- CEP: Qualquer CEP válido (ex: 12345-678)

---

## 🎯 Próximos Passos

1. ✅ Planos criados
2. ✅ Testar checkout na página `/subscription`
3. ⏳ Configurar webhook (quando estiver pronto para produção)
4. ⏳ Testar cancelamento e reativação de assinaturas

---

## 📌 Notas Importantes

- ⚠️ Estes são planos de **teste** (usando `sk_test_...`)
- ✅ Todos os planos têm metadata `source: 'barber_management'`
- ✅ Os planos aparecerão automaticamente na página de assinatura
- ✅ O plano Profissional está marcado como "popular" e aparecerá com badge especial

