# Sistema de Contraste - Melhorias de Visualização

## Visão Geral

Este sistema foi implementado para resolver problemas de visualização e contraste no sistema financeiro. Ele oferece três níveis de contraste diferentes para melhorar a legibilidade e acessibilidade.

## Níveis de Contraste Disponíveis

### 1. Contraste Normal (Padrão)
- Cores suaves e equilibradas
- Design moderno e limpo
- Adequado para uso diário

### 2. Alto Contraste
- Bordas mais grossas (2px)
- Fontes mais pesadas
- Maior contraste entre elementos
- Sombras mais pronunciadas

### 3. Contraste Máximo
- Bordas muito grossas (3px)
- Fontes extra pesadas
- Contraste extremo (preto sobre branco)
- Sombras muito pronunciadas
- Ideal para problemas visuais severos

## Como Usar

### No Frontend React
1. Um botão flutuante aparecerá no canto inferior direito
2. Clique no botão para alternar entre os níveis de contraste
3. O sistema lembrará sua preferência automaticamente

### No Backend Rails
1. Os estilos são aplicados automaticamente
2. Use o helper `contrast_controls` para adicionar controles
3. Inclua o parcial `_contrast_controls.html.erb` no layout

## Arquivos Implementados

### Backend (Rails)
- `app/assets/stylesheets/components/contrast_fix.scss` - Melhorias gerais de contraste
- `app/assets/stylesheets/components/contrast_levels.scss` - Níveis específicos de contraste
- `app/javascript/controllers/contrast_controller.js` - Controlador Stimulus
- `app/helpers/contrast_helper.rb` - Helper para controles
- `app/views/shared/_contrast_controls.html.erb` - Parcial dos controles

### Frontend (React)
- `frontend/src/components/ContrastControls.jsx` - Componente React
- `frontend/src/App.css` - Estilos CSS para contraste

## Características Técnicas

### Variáveis CSS
O sistema usa variáveis CSS para controlar cores:
```css
--contrast-bg-primary: #ffffff;
--contrast-text-primary: #0f172a;
--contrast-border: #cbd5e1;
```

### Persistência
- As preferências são salvas no localStorage
- O sistema carrega automaticamente a configuração salva
- Funciona independentemente para cada usuário

### Responsividade
- Os controles se adaptam a diferentes tamanhos de tela
- Funciona em dispositivos móveis e desktop

## Melhorias Implementadas

### Texto
- Maior contraste entre texto e fundo
- Fontes mais pesadas nos níveis altos
- Sombras de texto para melhor legibilidade

### Elementos de Interface
- Bordas mais grossas e visíveis
- Sombras mais pronunciadas
- Cores de fundo mais contrastantes

### Formulários
- Campos de entrada com bordas mais visíveis
- Estados de foco mais evidentes
- Placeholders com melhor contraste

### Tabelas
- Cabeçalhos com fundo diferenciado
- Linhas com bordas mais visíveis
- Hover states mais evidentes

### Botões
- Bordas mais grossas
- Cores mais contrastantes
- Estados hover mais visíveis

## Acessibilidade

O sistema segue as diretrizes de acessibilidade:
- Contraste mínimo de 4.5:1 para texto normal
- Contraste mínimo de 3:1 para texto grande
- Estados de foco visíveis
- Indicadores visuais claros

## Personalização

Para adicionar novos níveis de contraste:

1. Adicione as variáveis CSS no arquivo `contrast_levels.scss`
2. Atualize o controlador JavaScript
3. Adicione as opções no componente React
4. Teste em diferentes dispositivos

## Troubleshooting

### Problemas Comuns

1. **Estilos não aplicam**: Verifique se os arquivos CSS estão sendo carregados
2. **Controles não aparecem**: Verifique se o JavaScript está funcionando
3. **Preferências não salvam**: Verifique se o localStorage está disponível

### Debug

Para debugar problemas:
1. Abra o console do navegador
2. Verifique se há erros JavaScript
3. Inspecione as variáveis CSS aplicadas
4. Teste em modo incógnito

## Próximos Passos

1. Adicionar suporte a modo escuro
2. Implementar preferências por usuário no backend
3. Adicionar mais opções de personalização
4. Criar testes automatizados

## Contribuição

Para contribuir com melhorias:
1. Teste em diferentes navegadores
2. Verifique a acessibilidade
3. Mantenha a compatibilidade com dispositivos móveis
4. Documente as mudanças 