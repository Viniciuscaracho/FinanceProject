# frozen_string_literal: true

module Coaching
  # Resolve o contato correto a partir do nome extraído pela IA da transcrição.
  #
  # Problema: a IA pode extrair "Joao" de um áudio onde o contato está cadastrado
  # como "João", ou dizer "Rafa" quando o cadastro é "Rafael Costa". Sem matching
  # robusto, cada variação cria um novo contato duplicado.
  #
  # Estratégias em cascata (mais barata → mais fuzzy):
  #   1. Exato pós-normalização de acentos (unaccent + lowercase)
  #   2. Substring bidirecional: nome extraído ⊂ nome completo ou vice-versa
  #      — "Marcos" encontra "Marcos Vinicius"; "Rafa" encontra "Rafael Costa"
  #      — Retorna nil se houver ambiguidade (>1 candidato igualmente válido)
  #   3. Trigram similarity via pg_trgm — tolera erros de digitação e sons parecidos
  #      — Threshold conservador (0.35) para evitar falsos positivos
  #
  # Fallback final: telefone do remetente → último CoachingProfile ativo.
  # Nunca cria contatos — isso é responsabilidade do treinador via app.
  class ContactResolverService
    SIMILARITY_THRESHOLD = 0.35
    MIN_WORD_LENGTH      = 3

    def initialize(account, extracted_name:, from_phone: nil)
      @account        = account
      @extracted_name = extracted_name.to_s.strip
      @from_phone     = from_phone.to_s.strip
    end

    def call
      if @extracted_name.blank?
        Rails.logger.info "[ContactResolverService] Nome não extraído — usando fallback de telefone/recente"
        return phone_or_fallback
      end

      result =
        by_exact      ||
        by_substring  ||
        by_trigram    ||
        phone_or_fallback

      if result
        Rails.logger.info "[ContactResolverService] '#{@extracted_name}' → #{result.name} (##{result.id})"
      else
        Rails.logger.warn "[ContactResolverService] Nenhum contato encontrado para '#{@extracted_name}'"
      end

      result
    end

    private

    # ── Helpers SQL ────────────────────────────────────────────────────────────

    # Expressão SQL do nome completo concatenado
    FULL_NAME_SQL = "CONCAT(first_name, ' ', COALESCE(last_name, ''))".freeze

    # Normaliza no banco: remove acentos, lowercase, trim
    def pg_norm(expr)
      "unaccent(LOWER(TRIM(#{expr})))"
    end

    def base_scope
      @account.contacts.kept
    end

    # ── Pass 1: exato após normalização ────────────────────────────────────────

    def by_exact
      base_scope.find_by(
        "#{pg_norm(FULL_NAME_SQL)} = #{pg_norm('?')}",
        @extracted_name
      )
    end

    # ── Pass 2: substring bidirecional ─────────────────────────────────────────

    def by_substring
      normalized = rb_norm(@extracted_name)

      # Tenta o nome completo extraído como substring do nome cadastrado
      direct = base_scope.where(
        "#{pg_norm(FULL_NAME_SQL)} LIKE ?",
        "%#{normalized}%"
      ).to_a

      return direct.first if direct.one?

      # Ambiguidade no nome completo: tenta cada palavra significativa (>= 3 chars)
      return nil if direct.many?

      words = normalized.split.select { |w| w.length >= MIN_WORD_LENGTH }
                        .sort_by(&:length).reverse  # palavras mais longas primeiro

      words.each do |word|
        matches = base_scope.where(
          "#{pg_norm(FULL_NAME_SQL)} LIKE ?", "%#{word}%"
        ).to_a
        return matches.first if matches.one?
      end

      nil
    end

    # ── Pass 3: trigram similarity (pg_trgm) ───────────────────────────────────

    def by_trigram
      normalized = rb_norm(@extracted_name)
      quoted     = ActiveRecord::Base.connection.quote(normalized)

      base_scope
        .where(
          "similarity(#{pg_norm(FULL_NAME_SQL)}, unaccent(LOWER(?))) > ?",
          normalized, SIMILARITY_THRESHOLD
        )
        .order(Arel.sql(
          "similarity(#{pg_norm(FULL_NAME_SQL)}, unaccent(LOWER(#{quoted}))) DESC"
        ))
        .first
    end

    # ── Fallback ───────────────────────────────────────────────────────────────

    def phone_or_fallback
      find_by_phone || fallback_recent
    end

    def find_by_phone
      return nil if @from_phone.blank?

      suffix = @from_phone.gsub(/\D/, '').last(8)
      return nil if suffix.blank?

      @account.contacts.find_by(
        "REGEXP_REPLACE(cell_phone_number, '[^0-9]', '', 'g') LIKE ?",
        "%#{suffix}"
      )
    end

    def fallback_recent
      CoachingProfile.where(account: @account)
                     .order(updated_at: :desc)
                     .first
                     &.contact
    end

    # ── Ruby-side normalization (I18n.transliterate) ───────────────────────────

    def rb_norm(str)
      I18n.transliterate(str.downcase.strip.gsub(/\s+/, ' '))
    end
  end
end
