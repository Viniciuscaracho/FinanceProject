/**
 * Feature flags de build (Vite).
 *
 * COACHING_ONLY — modo enxuto de produção. Quando ligado (VITE_COACHING_ONLY=true),
 * a interface expõe apenas o fluxo de coaching: recebimento de áudios/mensagens
 * (WhatsApp) → análise entregue ao coach. Todo o restante da plataforma fica
 * oculto no menu e as rotas correspondentes redirecionam para o Coaching.
 * Reverter = desligar a env e rebuildar. Nada é removido.
 */
export const COACHING_ONLY =
  String(import.meta.env.VITE_COACHING_ONLY ?? '').toLowerCase() === 'true'

/**
 * Rotas protegidas liberadas no modo coaching. Qualquer path fora desta lista
 * é filtrado das rotas e redirecionado para /coaching.
 *   - /coaching        → dashboard de análise (entregue ao coach)
 *   - /contacts        → lista de atletas
 *   - /contacts/:id    → perfil do atleta (timeline de coaching)
 *   - /settings        → conexão do WhatsApp (recebimento de áudio/mensagem) + conta
 *   - /profile         → perfil do usuário (coach)
 *   - /admin           → painel do dono do sistema (observabilidade)
 *   - /admin/accounts/:id → detalhe de conta no admin
 */
export const COACHING_ONLY_ROUTES = [
  '/coaching',
  '/contacts',
  '/contacts/:id',
  '/contacts/:contactId/meal-plans/:planId',
  '/meal-plan-templates',
  '/meal-plan-templates/:templateId',
  '/settings',
  '/profile',
  '/admin',
  '/admin/accounts/:id',
  '/english',
]
