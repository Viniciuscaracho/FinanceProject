# frozen_string_literal: true

module Imports
  class XlsxContacts < ApplicationService
    include ActionView::Helpers::NumberHelper

    OBJECT_MAP = {
      first_name: 'Nome',
      contact_type_cd: 'Tipo do Contato',
      person_type_cd: 'Tipo de Pessoa',
      document_1: 'CNPJ/CPF',
      document_2: 'RG/Inscrição Estadual',
      email: 'E-mail',
      phone_number: 'Telefone',
      cell_phone_number: 'Celular',
      birth_date: 'Data de nascimento',
      description: 'Observações',
      district: 'Bairro',
      address_line1: 'Endereço',
      address_number: 'Número',
      address_line2: 'Complemento',
      postcode: 'CEP'
    }.freeze

    HEADERS = ['Nome', 'Tipo do Contato',
               'Tipo de Pessoa', 'CNPJ/CPF',
               'RG/Inscrição Estadual', 'E-mail',
               'Telefone', 'Celular',
               'Data de nascimento', 'Observações',
               'Endereço', 'Número',
               'Complemento', 'Bairro',
               'CEP'].freeze

    PERSON_TYPES = {
      'Indeterminada' => 0,
      'Pessoa física' => 1,
      'Pessoa jurídica' => 2
    }.freeze

    CONTACT_TYPES = {
      'Outros' => 0,
      'Cliente' => 1,
      'Colaborador' => 2,
      'Fornecedor' => 3,
      'Sócio' => 4,
      'Associado' => 5
    }.freeze

    def call
      import = context.import
      begin
        process_contact_file(import:)
      rescue StandardError => e
        Rails.logger.error(e)
        import.message = 'Arquivo incompatível! Verifique se o aquivo está no formato correto.'
        import.state = :failed
        import.save!
      end
    end

    # @param [Import] import
    def process_contact_file(import:)
      import.file.open do |file|
        worksheet = get_worksheet(file:)

        reset_import_progress(import:, worksheet:)
        start_import_processing(worksheet:, import:)
        finish_import_progress(import:)
      end
    end

    def get_worksheet(file:)
      workbook = SimpleXlsxReader.open(file)
      workbook.sheets.first
    end

    # @param [SimpleXlsxReader::Document::Sheet] worksheet
    def start_import_processing(worksheet:, import:)
      process_worksheet(worksheet:, import:)
      context.fail!(error: I18n.t('imports.create.fail_import')) if import.progress_number.zero?
    end

    # @param [SimpleXlsxReader::Document::Sheet] worksheet
    # @param [Import] import
    # @param [Integer] index
    def process_worksheet(worksheet:, import:, index: 0)
      contacts = []
      worksheet.rows.each(headers: ->(row) { (HEADERS & row).any? }) do |row|

        # monta os attributos do contato para cada linha da planilha
        # e atualiza/insere um contato
        contact = upsert_contact(attributes: build_attributes(row:))
        contacts << contact if contact.present?

        # increment import progress
        increment_import_progress(import:)
        index += 1

        # Update import
        next unless (index % 50).zero?

        ActiveRecord::Base.transaction do
          contacts.each do |c|
            c.skip_publish!
            c.save!
          end
          import.save!
        end

        contacts = []
      end

      return unless index.positive?

      ActiveRecord::Base.transaction do
        contacts.each do |c|
          c.skip_publish!
          c.save!
        end
        import.save!
      end
    end

    # @param [Hash] row
    # @return [Hash{Symbol->Array<Hash{Symbol->String (frozen)}>}]
    def build_attributes(row:)
      attributes = OBJECT_MAP.each_pair.with_object({ addresses_attributes: [{ country: 'BR' }] }) do |(key, header), attrs|
        case header
        when 'CNPJ/CPF'
          attrs[key] = format_document(row[header]) if row[header].present?
        when 'Tipo do Contato'
          attrs[key] = CONTACT_TYPES[row[header]]
        when 'Tipo de Pessoa'
          attrs[key] = PERSON_TYPES[row[header]]
        when 'Telefone', 'Celular'
          attrs[key] = format_phone(row[header]) if row[header].present?
        when 'Bairro', 'Endereço', 'Complemento', 'Número', 'CEP'
          attrs[:addresses_attributes][0][key] = row[header] if row[header].present?
        when 'Data de nascimento'
          if row[header].present?
            if valid_birth_date?(row[header])
              attrs[key] = row[header]
            else
              attrs[key] = nil
            end
          end
        else
          value = row[header]
          attrs[key] = (value.is_a?(String) ? value.strip : value).presence
        end
      end

      # Remove os atributos com valor nulo
      compacted_attributes = attributes.compact
      addresses_attributes = compacted_attributes[:addresses_attributes].first
      addresses_attributes&.compact!

      # Retorna os attributos do contato
      compacted_attributes
    end

    def format_phone(phone_number)
      case phone_number.length
      when 11
        number_to_phone(phone_number, pattern: /(\d{1,2})(\d{5})(\d{4})$/, area_code: true)
      when 10
        number_to_phone(phone_number, pattern: /(\d{1,2})(\d{4})(\d{4})$/, area_code: true)
      when 9
        number_to_phone(phone_number, pattern: /(\d{5})(\d{4})$/)
      when 8
        number_to_phone(phone_number, pattern: /(\d{4})(\d{4})$/)
      else
        phone_number
      end
    end

    def valid_birth_date?(birth_date)
      birth_date.is_a?(Date) && birth_date < Time.zone.today
    end

    def format_document(document)
      document = document.gsub(/\D/, '')
      case document.length
      when 11
        document.gsub(/(\d{3})(\d{3})(\d{3})(\d{2})/, '\1.\2.\3-\4')
      when 14
        document.gsub(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '\1.\2.\3/\4-\5')
      else
        document
      end
    end


    def upsert_contact(attributes:)
      # Busca um contato pelo Primeiro Nome
      # Se não encontrou, cria um novo contato
      contact = context.account.contacts.find_by(first_name: attributes[:first_name])
      if contact.blank?
        contact = context.account.contacts.new(attributes)
      else
        contact.assign_attributes(contact.attributes.deep_merge(attributes).compact)
      end
      # Se alterou alguma informação, atualiza, senão segue para a próxima linha
      return contact if contact.changed? && contact.valid?

      nil
    end

    def reset_import_progress(import:, worksheet:)
      import.progress_total = worksheet.rows.count - 1
      import.progress_number = 0
      import.state = :in_progress
      import.save!
    end

    def increment_import_progress(import:)
      import.progress_number = (import.progress_number + 1)
    end

    def finish_import_progress(import:)
      import.state = :done if context.success?
      import.save!
    end
  end
end
