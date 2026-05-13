# Backlog de Melhorias — BarberManagement

> Gerado em 2026-05-04. Cobre melhorias visuais (UX/UI) e de fluxo (casos de uso) mapeadas a partir das funcionalidades existentes.

---

## Legenda de Prioridade

| Sigla | Significado |
|-------|-------------|
| 🔴 Alta | Impacta diretamente a retenção ou conversão |
| 🟡 Média | Melhora experiência sem urgência crítica |
| 🟢 Baixa | Polimento e qualidade de vida |

---

## 1. Agendamentos

### 1.1 Fluxo de Criação de Agendamento
- 🔴 **[FLUXO]** Ao criar um agendamento com um profissional que não tem horário configurado, exibir mensagem orientativa com link direto para `/working-hours` em vez de formulário vazio.✅
- 🔴 **[FLUXO]** Após salvar agendamento, redirecionar para o slot criado no calendário (scroll automático e highlight do card) em vez de recarregar a página sem feedback visual.✅
- 🟡 **[FLUXO]** No formulário de agendamento, pré-selecionar automaticamente o profissional logado quando o usuário tem papel de "profissional".✅
- 🟡 **[FLUXO]** Validar sobreposição de horários em tempo real (client-side) antes de submeter, exibindo alerta inline. ✅
- 🟡 **[FLUXO]** Permitir agendar múltiplos serviços no mesmo horário para o mesmo cliente (combo de serviços), calculando duração total.✅
- 🟢 **[VISUAL]** Adicionar avatar/foto do profissional no card do agendamento no calendário.
- 🟢 **[VISUAL]** Colorir os cards do calendário pela cor configurada no profissional ou serviço para distinção rápida.

### 1.2 Calendário de Agendamentos
- 🔴 **[FLUXO]** Na view semanal, exibir capacidade do dia (X de Y slots ocupados) como barra de progresso no cabeçalho de cada coluna.✅
- 🟡 **[FLUXO]** Drag & drop para reagendar um compromisso arrastando o card para outro horário/dia.✅
- 🟡 **[VISUAL]** Distinguir visualmente status de agendamento por cor/ícone no card: `pending` (cinza), `confirmed` (azul), `completed` (verde), `canceled` (vermelho com risco), `no_show` (laranja).✅
- 🟡 **[VISUAL]** Mini-calendário lateral para navegação rápida de datas (como Google Calendar).✅
- 🟢 **[FLUXO]** Filtro rápido por profissional no topo do calendário (chips clicáveis), persistindo a seleção na sessão.
- 🟢 **[VISUAL]** Tooltip ao hover no card do agendamento mostrando cliente, serviço, valor e status sem precisar abrir.

### 1.3 Agendamento Público (Link `/agendar/:token`)
- 🔴 **[FLUXO]** Confirmação por WhatsApp ou SMS após o cliente concluir o agendamento, não apenas por email.✅
- 🔴 **[FLUXO]** Possibilidade de o cliente cancelar ou reagendar pelo mesmo link de confirmação, dentro de uma janela de tempo configurável. ✅    
- 🟡 **[FLUXO]** Passo de seleção de serviço → profissional → data/hora seguindo um wizard (step-by-step) com barra de progresso visível.
- 🟡 **[VISUAL]** Página pública com identidade visual da barbearia: logo, cor primária e foto de capa configuráveis.
- 🟡 **[FLUXO]** Exibir duração e preço do serviço na tela de seleção de slots.
- 🟢 **[VISUAL]** Slots indisponíveis apresentados como cinza desabilitado com tooltip explicando o motivo (lotado, folga, fora do horário).

### 1.4 Notificações de Agendamento
- 🟡 **[FLUXO]** Configuração granular de lembretes por canal (WhatsApp, Email) e tempo (1h, 24h, 48h) por tipo de serviço.
- 🟡 **[FLUXO]** Reenvio manual de lembrete/confirmação a partir do detalhe do agendamento com um clique, com feedback de "enviado".
- 🟢 **[FLUXO]** Log de notificações enviadas por agendamento (canal, horário, status de entrega) acessível no painel.

---

## 2. Financeiro — Transações

### 2.1 Listagem de Transações
- 🔴 **[FLUXO]** Filtros persistentes entre navegações (ao voltar da página de detalhe, os filtros devem ser os mesmos).
- 🟡 **[FLUXO]** Seleção múltipla com ações em lote visíveis imediatamente ao marcar a primeira linha (barra flutuante de ações).
- 🟡 **[VISUAL]** Coluna de saldo acumulado (running balance) opcional na tabela, calculada em tempo real.
- 🟡 **[VISUAL]** Indicador visual de recorrência no ícone da linha (ícone de loop) com tooltip informando a frequência.
- 🟢 **[FLUXO]** Atalho de teclado para criar nova transação (ex.: `N` ou `C`) quando o foco não está em um campo de texto.
- 🟢 **[VISUAL]** Highlight de linha ao passar o mouse, com botões de ação rápida (editar, duplicar, marcar como pago) aparecendo inline.

### 2.2 Criação / Edição de Transação
- 🔴 **[FLUXO]** Campo de valor com máscara monetária automática e suporte a digitar o valor sem ponto/vírgula (ex.: `150` → `R$ 1,50` vs `R$ 150,00` — configurável por preferência).
- 🟡 **[FLUXO]** Ao criar transação recorrente, mostrar preview das próximas datas antes de confirmar.
- 🟡 **[FLUXO]** Ao editar transação parcelada, oferecer opções claras: "editar só esta parcela", "editar esta e as futuras" ou "editar todas".
- 🟡 **[VISUAL]** Formulário em drawer lateral (sheet) em vez de modal/página completa para não perder o contexto da lista.
- 🟢 **[FLUXO]** Sugestão de categoria baseada no nome da transação (últimas categorizações do mesmo contato ou palavras-chave).
- 🟢 **[FLUXO]** Ao clicar em "duplicar transação", abrir o formulário pré-preenchido em modo de edição em vez de duplicar silenciosamente.

### 2.3 Planos de Pagamento / Parcelamento
- 🟡 **[VISUAL]** Timeline horizontal das parcelas com indicador de pagas vs. pendentes vs. atrasadas.
- 🟡 **[FLUXO]** Alerta automático (badge ou banner) quando há parcelas vencidas em aberto no topo da página de transações.
- 🟢 **[FLUXO]** Possibilidade de quitar todas as parcelas restantes com um clique ("quitar tudo agora"), recalculando eventuais juros/desconto.

---

## 3. Financeiro — Relatórios

### 3.1 Dashboard Principal
- 🔴 **[VISUAL]** Widget de "receita do mês atual vs. meta" com barra de progresso e percentual.
- 🔴 **[FLUXO]** Cards clicáveis no dashboard que ao clicar filtram a listagem de transações pelo período/categoria correspondente (deep-link).
- 🟡 **[VISUAL]** Gráfico de tendência de 12 meses (sparkline) em cada card de KPI (receitas, despesas, saldo).
- 🟡 **[FLUXO]** Período selecionável diretamente no dashboard (mês atual, mês anterior, semana, personalizado) sem precisar ir para relatórios.
- 🟢 **[VISUAL]** Modo de exibição de valores: botão de "esconder valores" para privacidade ao compartilhar a tela.

### 3.2 Página de Relatórios
- 🟡 **[FLUXO]** Exportação direta para PDF de qualquer relatório com um clique, mantendo a identidade visual da barbearia.
- 🟡 **[FLUXO]** Comparativo lado a lado de dois períodos no mesmo gráfico (ex.: abril 2025 vs. abril 2026).
- 🟡 **[VISUAL]** Gráficos com tooltips ricos ao hover, mostrando detalhamento por categoria/contato.
- 🟢 **[FLUXO]** Relatório de fluxo de caixa projetado (entradas/saídas futuras já lançadas) com visualização de calendário.

### 3.3 Comissões
- 🔴 **[FLUXO]** Tela de fechamento de comissões com status "aberto / fechado / pago" por profissional por período, gerando automaticamente uma transação de saída.
- 🟡 **[VISUAL]** Card por profissional com total do período, percentual sobre receita e comparativo com período anterior.
- 🟢 **[FLUXO]** Exportação de extrato individual de comissões por profissional em PDF para entregar ao colaborador.

---

## 4. Contatos / Clientes

### 4.1 Listagem de Contatos
- 🟡 **[FLUXO]** Histórico de agendamentos e transações diretamente no perfil do contato (aba "Histórico").
- 🟡 **[VISUAL]** Avatar gerado automaticamente com iniciais e cor aleatória para contatos sem foto.
- 🟡 **[FLUXO]** Busca por telefone ou CPF além de nome, com formatação automática ao digitar.
- 🟢 **[FLUXO]** Importação de contatos via CSV com mapeamento de colunas (drag-and-drop de arquivo).
- 🟢 **[VISUAL]** Badge de "cliente VIP" (configurável por tags ou valor total de transações) na listagem.

### 4.2 Perfil do Contato
- 🟡 **[FLUXO]** Indicadores resumidos no topo do perfil: total gasto, número de agendamentos, último atendimento, inadimplências.
- 🟡 **[FLUXO]** Aba de anotações livres (notas internas) no perfil do cliente com histórico datado.
- 🟢 **[FLUXO]** Envio de mensagem WhatsApp diretamente do perfil do contato sem precisar abrir o WhatsApp manualmente.

---

## 5. Profissionais e Serviços

### 5.1 Profissionais
- 🟡 **[FLUXO]** Painel individual do profissional mostrando: agendamentos do dia, comissões do mês, avaliação média.
- 🟡 **[FLUXO]** Definição de dias de folga/férias individuais com reflexo automático nos slots disponíveis do agendamento público.
- 🟢 **[VISUAL]** Foto de perfil do profissional com upload direto (drag & drop).

### 5.2 Serviços
- 🟡 **[FLUXO]** Configuração de buffers de tempo por serviço (ex.: 15 min de limpeza entre atendimentos).
- 🟢 **[VISUAL]** Ordenação drag & drop dos serviços para controlar a ordem de exibição na tela de agendamento público.
- 🟢 **[FLUXO]** Ativação/desativação de serviço com toggle inline na listagem (sem abrir formulário de edição).

### 5.3 Horários de Funcionamento
- 🟡 **[VISUAL]** Visualização semanal compacta dos horários configurados com indicação de dias fechados em destaque.
- 🟢 **[FLUXO]** Botão "copiar configuração de segunda para todos os dias úteis" para agilizar o setup inicial.

---

## 6. Documentos e Templates

### 6.1 Editor de Templates
- 🟡 **[FLUXO]** Preview ao vivo do documento com dados reais de exemplo (não apenas variáveis vazias `{{cliente}}`).
- 🟡 **[FLUXO]** Biblioteca de variáveis disponíveis com busca e inserção via clique, visível ao lado do editor.
- 🟢 **[VISUAL]** Botão de "enviar por email" diretamente na tela de preview do documento gerado.
- 🟢 **[FLUXO]** Duplicar template com um clique para criar variações sem partir do zero.

### 6.2 Geração de Documentos (Recibo, Contrato, Invoice)
- 🟡 **[FLUXO]** Ao concluir um agendamento, oferecer ação "gerar recibo" com um clique que pré-preenche os dados do atendimento.
- 🟢 **[FLUXO]** Histórico de documentos gerados por agendamento/transação com links para download.

---

## 7. Integrações

### 7.1 Google Calendar
- 🟡 **[FLUXO]** Feedback claro do status de sincronização: última sincronização bem-sucedida, eventuais erros e botão de "sincronizar agora".
- 🟢 **[FLUXO]** Opção de escolher qual calendário do Google deve receber os eventos (para usuários com múltiplos calendários).

### 7.2 Pluggy (Banco)
- 🟡 **[FLUXO]** Tela de conciliação bancária com interface de arrastar e soltar para vincular itens do extrato à transação correta.
- 🟡 **[VISUAL]** Indicador do saldo atual de cada conta bancária diretamente no header da página financeira.
- 🟢 **[FLUXO]** Alerta de divergência de saldo (saldo calculado vs. saldo no banco) com drill-down para encontrar a diferença.

### 7.3 WhatsApp
- 🟡 **[VISUAL]** Status da conexão WhatsApp visível no menu de navegação (ícone com indicador verde/vermelho).
- 🟡 **[FLUXO]** Templates de mensagem editáveis para cada tipo de notificação (confirmação, lembrete, cobrança).
- 🟢 **[FLUXO]** Log de mensagens enviadas com status de entrega (enviado, lido, erro) acessível no painel.

---

## 8. Configurações

### 8.1 Configurações da Conta / Empresa
- 🟡 **[FLUXO]** Wizard de onboarding para novas contas guiando: cadastro da empresa → profissionais → serviços → horários → link público. Com indicador de progresso e possibilidade de retomar depois.
- 🟡 **[VISUAL]** Checklist de configuração ("Getting Started") no dashboard para contas novas com checkmarks de itens concluídos.
- 🟢 **[FLUXO]** Pré-visualização em tempo real da página de agendamento público ao editar as configurações da empresa.

### 8.2 Usuários e Permissões
- 🟡 **[FLUXO]** Tela de convite com definição clara de papel (admin, profissional, financeiro, somente leitura) e permissões associadas.
- 🟢 **[VISUAL]** Indicador de "último acesso" na listagem de usuários da conta.

---

## 9. Assinatura / Planos

- 🔴 **[FLUXO]** Bloqueio gradual ao invés de hard-block ao atingir limites do plano: alerta 3 dias antes, modo leitura ao expirar, dados preservados por 30 dias.
- 🟡 **[VISUAL]** Banner não intrusivo de upsell contextual (ex.: ao tentar criar o 3º profissional no plano básico, mostrar upgrade inline).
- 🟢 **[FLUXO]** Comparação de planos lado a lado acessível em `/subscription` sem sair da plataforma.

---

## 10. Mobile / Responsividade

- 🔴 **[VISUAL]** Tabelas de transações e contatos com scroll horizontal ou modo card em viewports < 768px (atualmente algumas quebram o layout).
- 🔴 **[VISUAL]** Calendário de agendamentos com view "agenda do dia" como padrão no mobile, não a view semanal.
- 🟡 **[VISUAL]** Bottom navigation com badge de notificações pendentes (parcelas vencidas, agendamentos sem confirmar).
- 🟡 **[FLUXO]** Formulários de criação (transação, agendamento) otimizados para teclado virtual: campos numéricos com `inputmode="numeric"`, campos de data com picker nativo.
- 🟢 **[VISUAL]** PWA: adicionar `manifest.json` e service worker básico para permitir "adicionar à tela inicial" com ícone e splash screen.

---

## 11. Performance e UX Global

- 🔴 **[FLUXO]** Estados de carregamento skeleton (em vez de spinner genérico) em todas as listagens principais para reduzir percepção de lentidão.
- 🟡 **[FLUXO]** Paginação com scroll infinito ou "carregar mais" nas listagens longas (transações, contatos, agendamentos) em vez de paginação por número.
- 🟡 **[VISUAL]** Empty states informativos em todas as listagens: ilustração + texto explicativo + botão de ação primária (ex.: "Nenhum agendamento hoje — [Criar agendamento]").
- 🟡 **[FLUXO]** Pesquisa global (cmd+K) para buscar transações, contatos, agendamentos e navegar para qualquer página.
- 🟢 **[VISUAL]** Transições de navegação entre páginas (fade ou slide suave) para reduzir sensação de "piscar".
- 🟢 **[FLUXO]** Confirmações de ações destrutivas (excluir, cancelar) usando modal com campo de confirmação para ações irreversíveis de alto impacto.

---

## 12. Acessibilidade

- 🟡 **[VISUAL]** Contraste mínimo WCAG AA em textos de placeholder e labels desabilitados.
- 🟡 **[VISUAL]** Foco visível (outline) em todos os elementos interativos para navegação por teclado.
- 🟢 **[FLUXO]** `aria-label` e `role` corretos nos componentes de calendário e gráficos para leitores de tela.

---

## 13. Observabilidade para o Usuário

- 🟡 **[FLUXO]** Histórico de alterações (audit log) acessível pelo próprio usuário em registros sensíveis (transações, agendamentos): "editado por X em DD/MM às HH:MM".
- 🟢 **[FLUXO]** Central de notificações in-app (sininho no header) para alertas de parcelas vencidas, agendamentos do dia, falhas de sincronização.
- 🟢 **[FLUXO]** Tela de "atividade recente" resumindo as últimas ações realizadas na conta pelo usuário.

---

## Resumo por Módulo

| Módulo | 🔴 Alta | 🟡 Média | 🟢 Baixa | Total |
|--------|--------|---------|---------|-------|
| Agendamentos | 3 | 9 | 5 | 17 |
| Transações | 3 | 7 | 4 | 14 |
| Relatórios / Comissões | 2 | 6 | 2 | 10 |
| Contatos | 0 | 4 | 3 | 7 |
| Profissionais / Serviços | 0 | 4 | 4 | 8 |
| Documentos | 0 | 3 | 3 | 6 |
| Integrações | 0 | 5 | 3 | 8 |
| Configurações / Onboarding | 1 | 3 | 2 | 6 |
| Assinatura | 1 | 1 | 1 | 3 |
| Mobile / Responsividade | 2 | 3 | 1 | 6 |
| Performance / UX Global | 1 | 3 | 2 | 6 |
| Acessibilidade | 0 | 2 | 1 | 3 |
| Observabilidade | 0 | 1 | 2 | 3 |
| **Total** | **13** | **51** | **33** | **97** |
