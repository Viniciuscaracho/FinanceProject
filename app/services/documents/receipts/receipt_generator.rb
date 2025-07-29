module Documents
  module Receipts
    class ReceiptGenerator < ApplicationService
      before :set_variables

      def call

        content_template = @current_template&.content

        @variable_names&.each { | k, v | content_template&.gsub!(k, v.to_s.presence || "Não informado")}

        context.content = content_template
      end

      def set_variables
        @current_account = context.account
        @current_template = context.template
        @current_user = context.user
        @current_transaction = context.transaction

        @variable_names =
          {
            "[DATA_ATUAL]"                    => I18n.l(Date.current),
            "[MES_ATUAL]"                     => Date.current.strftime("%m/%Y"),
            "[MEU_NOME]"                      => @current_user.name,
            "[MINHA_EMPRESA]"                 => @current_account.name,
            "[MINHA_EMPRESA_DOCUMENTO]"       => @current_account.company.document_1,
            "[MINHA_EMPRESA_ESTADO]"          => @current_account.company.addresses&.first&.state,
            "[MINHA_EMPRESA_CIDADE]"          => @current_account.company.addresses&.first&.city,
            "[CODIGO_ITEM]"                   => @current_transaction.id,
            "[CONTA_BANCARIA_ITEM]"           => @current_transaction.bank_account.name,
            "[DATA_ITEM]"                     => I18n.l(@current_transaction.due_date.to_date),
            "[VALOR_ITEM]"                    => Money.from_cents(@current_transaction.exchanged_amount_cents).format,
            "[NUMERO_DOCUMENTO_ITEM]"         => @current_transaction.document_number,
            "[FORMA_PAGAMENTO_ITEM]"          => I18n.t("enums.payment_method.#{@current_transaction.payment_method}"),
            "[DESCRICAO_ITEM]"                => @current_transaction.name,
            "[DETALHES_ITEM]"                 => @current_transaction.description,
            "[CATEGORIA_ITEM]"                => @current_transaction&.category&.name,
            "[NOME_CLIENTE]"                  => @current_transaction.contact&.name,
            "[DOCUMENTO_CLIENTE]"             => @current_transaction.contact&.document_1,
            "[TELEFONE_CLIENTE]"              => @current_transaction.contact&.phone_number,
            "[CELULAR_CLIENTE]"               => @current_transaction.contact&.cell_phone_number,
            "[EMAIL_CLIENTE]"                 => @current_transaction.contact&.email,
            "[DESCRICAO_CLIENTE]"             => @current_transaction.contact&.description,
            "[ENDERECO_COMPLETO_CLIENTE]"     => @current_transaction.contact&.addresses&.first&.full_name,
            "[ENDERECO_SIMPLIFICADO_CLIENTE]" => @current_transaction.contact&.addresses&.first&.address_line1,
            "[COMP_ENDERECO_CLIENTE]"         => @current_transaction.contact&.addresses&.first&.address_line2,
            "[BAIRRO_ENDERECO_CLIENTE]"       => @current_transaction.contact&.addresses&.first&.district,
            "[CEP_ENDERECO_CLIENTE]"          => @current_transaction.contact&.addresses&.first&.postcode,
            "[ESTADO_ENDERECO_CLIENTE]"       => CS.states(@current_transaction.contact&.addresses&.first&.country)[@current_transaction.contact&.addresses&.first&.state&.to_sym],
            "[CIDADE_ENDERECO_CLIENTE]"       => @current_transaction.contact&.addresses&.first&.city,
          }

      end

    end
  end
end