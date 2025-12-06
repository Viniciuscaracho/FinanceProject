# API de Reconciliações - Endpoints Disponíveis

## Endpoints de Statements (Extratos/Reconciliações)

### 1. Listar Statements
```
GET /api/v1/statements
Authorization: Bearer <token>
Query params: ?page=1&per_page=20
```

### 2. Ver Statement específico
```
GET /api/v1/statements/:id
Authorization: Bearer <token>
```

### 3. Criar Statement
```
POST /api/v1/statements
Authorization: Bearer <token>
Content-Type: application/json

{
  "statement": {
    "bank_account_id": 1,
    "starts_at": "2025-01-01",
    "ends_at": "2025-01-31",
    "type_cd": 0,
    "file": [arquivo OFX]
  }
}
```

### 4. Atualizar Statement
```
PUT/PATCH /api/v1/statements/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "statement": {
    "starts_at": "2025-01-01",
    "ends_at": "2025-01-31"
  }
}
```

### 5. Deletar Statement
```
DELETE /api/v1/statements/:id
Authorization: Bearer <token>
```

### 6. Finalizar Reconciliação
```
POST /api/v1/statements/:id/finish
Authorization: Bearer <token>
```

## Endpoints de Statement Items (Itens do Extrato)

### 1. Listar Itens de um Statement
```
GET /api/v1/statements/:statement_id/statement_items
Authorization: Bearer <token>
Query params: 
  - ?status=pending (pending|confirmed|ignored|reconciled|unreconciled)
  - ?q=termo_busca
  - ?page=1&per_page=50
```

### 2. Ver Item específico
```
GET /api/v1/statements/:statement_id/statement_items/:id
Authorization: Bearer <token>
```

### 3. Atualizar Item
```
PUT/PATCH /api/v1/statements/:statement_id/statement_items/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "statement_item": {
    "name": "Nome",
    "due_date": "2025-01-15",
    "contact_id": 1,
    "category_id": 2,
    "transaction_type_cd": 1
  }
}
```

### 4. Confirmar Item
```
POST /api/v1/statements/:statement_id/statement_items/:id/confirm
Authorization: Bearer <token>
```

### 5. Ignorar Item
```
POST /api/v1/statements/:statement_id/statement_items/:id/ignore
Authorization: Bearer <token>
```

### 6. Resetar Item
```
POST /api/v1/statements/:statement_id/statement_items/:id/reset
Authorization: Bearer <token>
```

### 7. Reconciliar Item
```
POST /api/v1/statements/:statement_id/statement_items/:id/reconcile
Authorization: Bearer <token>
```

### 8. Confirmar múltiplos itens
```
POST /api/v1/statements/:statement_id/statement_items/bulk_confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "item_ids": [1, 2, 3]
}
```

### 9. Ignorar múltiplos itens
```
POST /api/v1/statements/:statement_id/statement_items/bulk_ignore
Authorization: Bearer <token>
Content-Type: application/json

{
  "item_ids": [1, 2, 3]
}
```

## Estrutura de Resposta

### Statement
```json
{
  "statement": {
    "id": 1,
    "bank_account_id": 1,
    "starts_at": "2025-01-01",
    "ends_at": "2025-01-31",
    "type_cd": 0,
    "workflow_state": "pending",
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z",
    "confirmed_count": 5,
    "ignored_count": 2,
    "pending_count": 10,
    "reconciled_count": 5,
    "unreconciled_count": 0,
    "bank_account": { ... }
  }
}
```

### Statement Item
```json
{
  "statement_item": {
    "id": 1,
    "statement_id": 1,
    "name": "Descrição",
    "memo": "Memo",
    "amount_cents": 10000,
    "amount_currency": "BRL",
    "status_cd": 0,
    "type_cd": 0,
    "transaction_type_cd": 1,
    "posted_at": "2025-01-15",
    "due_date": "2025-01-15",
    "document_number": "123",
    "confirmed_at": null,
    "ignored_at": null,
    "reconciled_at": null,
    "contact": { ... },
    "category": { ... },
    "related_transaction": { ... },
    "bank_account_source": { ... },
    "bank_account_target": { ... }
  }
}
```

## Notas

- Todos os endpoints requerem autenticação via Bearer token
- Os valores monetários estão em centavos (amount_cents)
- Os status dos itens:
  - 0: new
  - 1: suggested
  - 2: confirmed
  - 3: ignored
  - 4: reconciled
  - 5: unreconciled

