/**
 * Funções de formatação
 */

/**
 * Formata valor em centavos para moeda
 */
export function formatCurrency(cents, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(cents / 100)
}


