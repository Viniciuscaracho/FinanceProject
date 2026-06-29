# frozen_string_literal: true

class SitemapController < ApplicationController
  skip_before_action :authenticate_user!
  skip_before_action :redirect_to_checkout_page

  CITIES = [
    { slug: 'sao-paulo',             label: 'São Paulo' },
    { slug: 'campinas',              label: 'Campinas' },
    { slug: 'guarulhos',             label: 'Guarulhos' },
    { slug: 'santo-andre',           label: 'Santo André' },
    { slug: 'sao-bernardo-do-campo', label: 'São Bernardo do Campo' },
    { slug: 'osasco',                label: 'Osasco' },
    { slug: 'diadema',               label: 'Diadema' },
    { slug: 'sao-jose-dos-campos',   label: 'São José dos Campos' },
    { slug: 'sorocaba',              label: 'Sorocaba' },
    { slug: 'ribeirao-preto',        label: 'Ribeirão Preto' },
    { slug: 'santos',                label: 'Santos' },
    { slug: 'taubate',               label: 'Taubaté' },
  ].freeze

  SPECIALTIES = %w[
    emagrecimento esportiva saude-feminina gestacao
    infantil online vegetariana hormonal diabetes bariatrica vegana
  ].freeze

  SP_NEIGHBORHOODS = %w[
    moema pinheiros vila-mariana itaim-bibi jardins higienopolis
    morumbi perdizes vila-olimpia consolacao paraiso aclimacao
    santana lapa tatuape campo-belo ipiranga jabaquara santo-amaro butanta
  ].freeze

  def index
    @profiles = Account
      .joins(:company)
      .where(directory_visible: true, suspended: false, discarded_at: nil)
      .includes(company: [])
      .select('accounts.id, accounts.updated_at, people.screen_name, people.first_name, people.last_name')
      .map do |a|
        company = a.company
        raw = company&.screen_name.presence || "#{company&.first_name} #{company&.last_name}".strip
        slug = "#{slugify(raw)}-#{a.id}"
        { slug: slug, updated_at: a.updated_at }
      end

    @cities      = CITIES
    @specialties = SPECIALTIES
    @neighborhoods = SP_NEIGHBORHOODS

    respond_to do |format|
      format.xml { render layout: false }
    end
  end

  private

  def slugify(str)
    ActiveSupport::Inflector.transliterate(str.to_s)
      .downcase
      .gsub(/[^a-z0-9]+/, '-')
      .gsub(/^-|-$/, '')
  end
end
