class ContractsController < ApplicationController

  before_action :set_current_account
  before_action :set_current_contact, only: %i[new]
  before_action :set_contract_templates
  before_action :set_current_template
  before_action :set_current_contract_content

  def new; end

  private

  def set_current_account
    @current_account = Current.account
  end

  def set_current_contact
    @current_contact = @current_account.contacts.find(params[:contact_id])
  end

  def set_contract_templates
    @contract_templates = @current_account.contract_templates
  end

  def set_current_template
    @current_contract_template = if params[:contract_template_id].present?
                                   @contract_templates.find(params[:contract_template_id])
                                 else
                                   @contract_templates.first
                                 end

  end

  def set_current_contract_content
    @current_contract_content = Documents::Contracts::ContractGenerator.call(
      account: @current_account,
      user: @current_user,
      template: @current_contract_template,
      contact: @current_contact
    ).content
  end
end
