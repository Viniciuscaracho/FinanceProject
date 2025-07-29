# frozen_string_literal: true

module Contacts
  class ContractsController < ApplicationController

    before_action :set_current_account
    before_action :set_contact
    before_action :set_contract, only: %i[ show destroy edit replace ]

    def index
      @current_contracts = @contact.contracts
    end

    def show
      @contract = @contact.contracts.find(params[:id])
    end

    def edit; end

    def create
      authorize! :create, Contract

      save = if !params[:id].nil? && @contact.contracts.find(params[:id])
               @contract = @contact.contracts.find(params[:id])
               title = @contract.contract_template.name
               @contract.update(content: params[:content], title: title)

             elsif @contact.contracts.where(contract_template_id: params[:contract][:contract_template_id]).exists?
               @contract = @contact.contracts.find_by(contract_template_id: params[:contract][:contract_template_id])
               # title = @contract.contract_template.name
               @contract.update(content: params[:content])

             else
               @contract = @contact.contracts.new(contract_params.merge(title:))
               title = @contract.contract_template.name
               @contract.title = title
               @contract.save

             end

      respond_to do |format|
        if save
          format.html { redirect_to @contact, notice: t('.success') }
          format.json { render :destroy, status: :created, location: @contract }
        else
          format.html { render :contract }
          format.json { render json: @contract.errors, status: :unprocessable_entity }
        end
      end
    end

    def destroy

      respond_to do |format|
        if @contract.destroy
          @contact.reload
          format.html { redirect_to account_documents_contracts_url, notice: t('.success') }
          format.turbo_stream { flash.now.notice = t('.success') }
          format.json { head :no_content }
        else
          format.html { redirect_to account_documents_contracts_url, alert: t('.failure') }
          format.turbo_stream { flash.now.alert = t('.failure') }
          format.json { render json: @current_contract_template.errors, status: :unprocessable_entity }
        end
      end
    end

    private

    def set_current_account
      @current_account = current_account
    end

    def set_contract
      @contract = @contact.contracts.find(params[:id]) if params[:id]
    end

    def contract_params
      params.require(:contract).permit(:content, :contract_template_id)
    end

    def set_contact
      @contact = @current_account.contacts.find(params[:contact_id])
    end

  end
end
