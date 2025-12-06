# frozen_string_literal: true

module Api
  module V1
    class ImportsController < ApplicationController
      before_action :set_import, only: [:show, :destroy, :discard, :undiscard]

      def index
        query = Current.account.imports.kept.order(created_at: :desc)
        
        # Busca simples por nome do arquivo (se houver parâmetro q)
        if params[:q].present?
          search_term = "%#{params[:q]}%"
          # Buscar por ID ou tentar buscar por nome de arquivo via joins do ActiveStorage
          query = query.joins("LEFT JOIN active_storage_attachments ON active_storage_attachments.record_id = imports.id AND active_storage_attachments.record_type = 'Import'")
                      .joins("LEFT JOIN active_storage_blobs ON active_storage_blobs.id = active_storage_attachments.blob_id")
                      .where("imports.id::text ILIKE ? OR active_storage_blobs.filename ILIKE ?", 
                             search_term, search_term)
                      .distinct
        end

        # Filtro por estado
        if params[:state].present?
          state_mapping = {
            'waiting' => 3,
            'in_progress' => 0,
            'done' => 1,
            'failed' => 2
          }
          state_cd = state_mapping[params[:state]]
          query = query.where(state_cd: state_cd) if state_cd
        end

        # Filtro por fonte
        if params[:source].present?
          source_mapping = {
            'zero_paper' => 0,
            'xlsx_contacts' => 1,
            'xlsx_default' => 2
          }
          source_cd = source_mapping[params[:source]]
          query = query.where(source_cd: source_cd) if source_cd
        end

        @imports = query.page(params[:page]).per(params[:per_page] || 20)

        render json: {
          imports: @imports.map { |import| import_json(import) },
          meta: {
            current_page: @imports.current_page,
            total_pages: @imports.total_pages,
            total_count: @imports.total_count
          }
        }
      end

      def show
        render json: { import: import_json(@import) }
      end

      def create
        # Verificar se há import pendente
        if Current.account.imports.exists?(state_cd: [0, 3])
          render json: { 
            error: 'Já existe uma importação em andamento. Aguarde a conclusão antes de iniciar uma nova.' 
          }, status: :unprocessable_entity
          return
        end

        @import = Current.account.imports.new(import_params)
        @import.state = :waiting
        @import.progress_total = 0
        @import.progress_number = 0

        if @import.save
          render json: { import: import_json(@import) }, status: :created
        else
          render json: { errors: @import.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActionController::ParameterMissing => e
        render json: { error: "Parâmetro obrigatório ausente: #{e.param}" }, status: :unprocessable_entity
      end

      def destroy
        if @import.able_to_destroy?
          @import.destroy
          render json: { message: 'Importação removida com sucesso' }
        else
          render json: { 
            error: 'Esta importação não pode ser removida. Apenas importações concluídas ou falhadas com menos de 30 dias podem ser removidas.' 
          }, status: :unprocessable_entity
        end
      end

      def discard
        if @import.able_to_discard?
          @import.discard
          render json: { import: import_json(@import), message: 'Importação arquivada com sucesso' }
        else
          render json: { 
            error: 'Esta importação não pode ser arquivada. Apenas importações concluídas ou falhadas podem ser arquivadas.' 
          }, status: :unprocessable_entity
        end
      end

      def undiscard
        @import.undiscard
        render json: { import: import_json(@import), message: 'Importação restaurada com sucesso' }
      end

      private

      def set_import
        @import = Current.account.imports.find(params[:id])
      end

      def import_json(import)
        file_url = nil
        if import.file.attached?
          begin
            # Gerar URL completa do arquivo
            file_url = Rails.application.routes.url_helpers.rails_blob_url(import.file, only_path: false)
          rescue StandardError => e
            Rails.logger.error "Erro ao gerar URL do arquivo: #{e.message}"
            # Fallback para path relativo
            file_url = Rails.application.routes.url_helpers.rails_blob_path(import.file, only_path: true)
          end
        end

        {
          id: import.id,
          state: import.state.to_s,
          source: import.source.to_s,
          progress: import.current_progress,
          progress_number: import.progress_number,
          progress_total: import.progress_total,
          message: import.message,
          file_name: import.file.attached? ? import.file.filename.to_s : nil,
          file_url: file_url,
          created_at: import.created_at,
          updated_at: import.updated_at,
          discarded_at: import.discarded_at,
          able_to_destroy: import.able_to_destroy?,
          able_to_discard: import.able_to_discard?,
          transactions_count: import.transactions.count
        }
      end

      def import_params
        # Para FormData, os parâmetros podem vir diretamente ou dentro de :import
        if params[:import].present?
          params.require(:import).permit(:source, :file)
        else
          # Se não vier dentro de :import, criar hash manualmente
          permitted = {}
          permitted[:source] = params[:source] if params[:source].present?
          permitted[:file] = params[:file] if params[:file].present?
          permitted
        end
      end
    end
  end
end

