# frozen_string_literal: true

module Documents
  module Contracts
    class ContractGenerator < ApplicationService
      before :set_variables

      def call
        content_template = @current_template&.content

        @variable_names&.each do |k, v|
          content_template&.gsub!(k, v.to_s.presence ||
            '<input class="px-1 w-32 flex h-4 inline-flex rounded-md empty:bg-gray-100 mx-1 empty:placeholder-opacity-100 disabled:cursor-not-allowed placeholder:text-sm disabled:placeholder-opacity-100 empty:ring-1 ring-gray-300" placeholder="Preencher depois" disabled="true" id="input">')
        end

        context.content = content_template
      end

      private

      def set_variables
        @current_account = context.account
        @current_template = context.template
        @current_user = context.user
        @current_contact = context.contact

        @variable_names =
          {
            '[DATA_ATUAL]' => I18n.l(Date.current),
            '[MES_ATUAL]' => Date.current.strftime('%m/%Y'),
            '[MEU_NOME]' => @current_user.name,
            '[MINHA_EMPRESA]' => @current_account.name,
            '[MINHA_EMPRESA_CPF/CNPJ]' => @current_account.company.document_1,
            '[MINHA_EMPRESA_NOME_FANTASIA]' => @current_account.company.screen_name,
            '[MINHA_EMPRESA_RG/INS_ESTADUAL]' => set_rg_or_ie,
            '[MINHA_EMPRESA_INSCRICAO_MUNICIPAL]' => @current_account.company.document_3,
            '[MINHA_EMPRESA_TELEFONE]' => @current_account.company.phone_number,
            '[MINHA_EMPRESA_CELULAR]' => @current_account.company.cell_phone_number,
            '[MINHA_EMPRESA_ESTADO]' => @current_account.company.addresses&.first&.state,
            '[MINHA_EMPRESA_CIDADE]' => @current_account.company.addresses&.first&.city,
            '[MINHA_EMPRESA_ENDERECO_COMPLETO]' => @current_account.company.addresses&.first&.full_name,
            '[MINHA_EMPRESA_ENDERECO]' => @current_account.company.addresses&.first&.address_line1,
            '[MINHA_EMPRESA_NUMERO_ENDERECO]' => @current_account.company.addresses&.first&.address_number,
            '[MINHA_EMPRESA_COMPLEMENTO_ENDERECO]' => @current_account.company.addresses&.first&.address_line2,
            '[MINHA_EMPRESA_BAIRRO]' => @current_account.company.addresses&.first&.district,
            '[MINHA_EMPRESA_CEP]' => @current_account.company.addresses&.first&.postcode,
            '[NOME_CLIENTE]' => @current_contact&.name,
            '[CPF/CNPJ_CLIENTE]' => @current_contact&.document_1,
            '[RG/INS_ESTADUAL_CLIENTE]' => @current_contact&.document_2,
            '[TELEFONE_CLIENTE]' => @current_contact&.phone_number,
            '[CELULAR_CLIENTE]' => @current_contact&.cell_phone_number,
            '[EMAIL_CLIENTE]' => @current_contact&.email,
            '[DESCRICAO_CLIENTE]' => @current_contact&.description,
            '[ENDERECO_COMPLETO_CLIENTE]' => @current_contact&.addresses&.first&.full_name,
            '[ENDERECO_SIMPLIFICADO_CLIENTE]' => @current_contact&.addresses&.first&.address_line1,
            '[ENDERECO_CLIENTE]' => @current_contact&.addresses&.first&.address_line1,
            '[NUMERO_ENDERECO_CLIENTE]' => @current_contact&.addresses&.first&.address_number,
            '[COMPLEMENTO_ENDERECO_CLIENTE]' => @current_contact&.addresses&.first&.address_line2,
            '[BAIRRO_ENDERECO_CLIENTE]' => @current_contact&.addresses&.first&.district,
            '[CEP_ENDERECO_CLIENTE]' => @current_contact&.addresses&.first&.postcode,
            '[ESTADO_ENDERECO_CLIENTE]' => CS.states(@current_contact&.addresses&.first&.country)[@current_contact&.addresses&.first&.state&.to_sym],
            '[CIDADE_ENDERECO_CLIENTE]' => @current_contact&.addresses&.first&.city
          }
      end

      def set_rg_or_ie

        if @current_account.company.business?
          # mask for ie
          @current_account.company.document_2&.gsub(/(\d{3})(\d{3})(\d{3})(\d{3})/, '\1.\2.\3.\4')

        else
          # mask for rg
          @current_account.company.document_2&.gsub(/(\d{2})(\d{3})(\d{3})(\d{1})/, '\1.\2.\3-\4')
        end
      end
    end

  end
end
