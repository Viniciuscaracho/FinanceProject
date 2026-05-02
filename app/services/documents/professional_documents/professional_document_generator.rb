# frozen_string_literal: true

module Documents
  module ProfessionalDocuments
    class ProfessionalDocumentGenerator < ApplicationService
      before :set_variables

      def call
        content_template = @current_template&.content

        @variable_names&.each do |k, v|
          content_template&.gsub!(k, v.to_s.presence || 'Não informado')
        end

        context.content = content_template
      end

      private

      def set_variables
        @current_account = context.account
        @current_template = context.template
        @current_user = context.user
        @current_contact = context.contact
        @current_appointment = context.appointment

        # Calcular informações de sessões se houver appointment
        session_info = calculate_session_info

        @variable_names = {
          # Variáveis gerais
          '[DATA_ATUAL]' => I18n.l(Date.current),
          '[MES_ATUAL]' => Date.current.strftime('%m/%Y'),
          '[MEU_NOME]' => @current_user.name,
          '[MINHA_EMPRESA]' => @current_account.name,
          '[MINHA_EMPRESA_DOCUMENTO]' => @current_account.company.document_1,
          '[MINHA_EMPRESA_ESTADO]' => @current_account.company.addresses&.first&.state,
          '[MINHA_EMPRESA_CIDADE]' => @current_account.company.addresses&.first&.city,
          '[MINHA_EMPRESA_ENDERECO_COMPLETO]' => @current_account.company.addresses&.first&.full_name,
          '[MINHA_EMPRESA_TELEFONE]' => @current_account.company.phone_number,
          '[MINHA_EMPRESA_CELULAR]' => @current_account.company.cell_phone_number,
          '[REGISTRO_PROFISSIONAL]' => @current_account.company.document_2 || 'Não informado',

          # Variáveis do cliente
          '[NOME_CLIENTE]' => @current_contact&.name || 'Não informado',
          '[DOCUMENTO_CLIENTE]' => @current_contact&.document_1 || 'Não informado',
          '[TELEFONE_CLIENTE]' => @current_contact&.phone_number || 'Não informado',
          '[CELULAR_CLIENTE]' => @current_contact&.cell_phone_number || 'Não informado',
          '[EMAIL_CLIENTE]' => @current_contact&.email || 'Não informado',
          '[ENDERECO_COMPLETO_CLIENTE]' => @current_contact&.addresses&.first&.full_name || 'Não informado',

          # Variáveis de sessões
          '[NUMERO_SESSAO]' => session_info[:session_number] || @current_template&.session_number&.to_s || 'Não informado',
          '[TOTAL_SESSOES]' => session_info[:total_sessions] || @current_template&.session_count&.to_s || 'Não informado',
          '[TIPO_SESSAO]' => session_info[:session_type] || @current_template&.session_type || 'Não informado',
          '[TIPO_PROFISSIONAL]' => @current_template&.professional_type_label || 'Não informado',
          '[SESSOES_RESTANTES]' => session_info[:remaining_sessions] || 'Não informado',
          '[SESSOES_REALIZADAS]' => session_info[:completed_sessions] || 'Não informado',
          '[DATA_SESSAO]' => session_info[:session_date] || 'Não informado',

          # Variáveis de conteúdo (preenchidas pelo usuário ou da anotação)
          '[CONTEUDO_DOCUMENTO]' => context.document_content || @current_appointment&.appointment_note&.notes || 'Conteúdo do documento será preenchido aqui',
          '[PROGRESSO_CLIENTE]' => context.progress || extract_progress_from_notes || 'Progresso do cliente será descrito aqui',
          '[ORIENTACOES]' => context.instructions || extract_instructions_from_tasks || 'Orientações serão fornecidas aqui',
          '[OBSERVACOES]' => context.observations || 'Observações adicionais serão incluídas aqui',

          # Variáveis do appointment (se houver)
          '[DATA_AGENDAMENTO]' => @current_appointment ? I18n.l(@current_appointment.start_time.to_date) : 'Não informado',
          '[HORA_AGENDAMENTO]' => @current_appointment ? @current_appointment.start_time.strftime('%H:%M') : 'Não informado',
          '[SERVICO_AGENDAMENTO]' => @current_appointment&.service&.name || 'Não informado',
          '[PROFISSIONAL_AGENDAMENTO]' => @current_appointment&.account_user&.user&.name || 'Não informado',
          '[VALOR_AGENDAMENTO]' => @current_appointment ? Money.from_cents(@current_appointment.price_cents).format : 'Não informado',
          '[NOTAS_AGENDAMENTO]' => @current_appointment&.appointment_note&.notes || 'Não há notas para este agendamento'
        }
      end

      def calculate_session_info
        return {} unless @current_template&.enable_sessions

        info = {}

        if @current_appointment
          # Se houver appointment, calcular baseado nos appointments do cliente
          client_appointments = @current_account.appointments
            .where(contact_id: @current_contact&.id)
            .where(account_user_id: @current_appointment.account_user_id)
            .order(start_time: :asc)

          completed_appointments = client_appointments.where(status: Appointment::APPOINTMENT_STATUS[:completed])
          total_appointments = client_appointments.count

          info[:session_number] = completed_appointments.count + 1
          info[:total_sessions] = @current_template.session_count || total_appointments
          info[:completed_sessions] = completed_appointments.count
          info[:remaining_sessions] = (info[:total_sessions].to_i - info[:completed_sessions].to_i).to_s
          info[:session_date] = I18n.l(@current_appointment.start_time.to_date)
          info[:session_type] = @current_template.session_type || @current_appointment.service&.name
        else
          # Usar valores do template
          info[:session_number] = @current_template.session_number
          info[:total_sessions] = @current_template.session_count
          info[:session_type] = @current_template.session_type
        end

        info
      end

      def extract_progress_from_notes
        return nil unless @current_appointment&.appointment_note

        note = @current_appointment.appointment_note.notes
        # Tentar extrair seção de progresso se houver padrão específico
        # Por enquanto, retorna nil para usar o valor padrão
        nil
      end

      def extract_instructions_from_tasks
        return nil unless @current_appointment&.appointment_note

        pending_tasks = @current_appointment.appointment_note.pending_tasks
        return nil if pending_tasks.empty?

        # Formatar tarefas pendentes como orientações
        pending_tasks.map { |task| "• #{task['description']}" }.join("\n")
      end
    end
  end
end

