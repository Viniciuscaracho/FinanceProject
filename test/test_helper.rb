# frozen_string_literal: true

ENV['RAILS_ENV'] ||= 'test'
require 'simplecov'

SimpleCov.start

require_relative '../config/environment'
require 'rails/test_help'
require 'mocha/minitest'


module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    # parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    # fixtures :all

    # Add more helper methods to be used by all tests here...
    include Devise::Test::IntegrationHelpers
    include ActionCable::TestHelper
    include ActionMailer::TestHelper

    setup do
      Rails.application.config.active_record.encryption.key_derivation_salt = SecureRandom.hex(64)
    end

    def teardown
      Warden.test_reset!
      ActionMailer::Base.deliveries.clear
      ActiveJob::Base.queue_adapter.enqueued_jobs.clear
      ActiveJob::Base.queue_adapter.performed_jobs.clear
      sign_out :user
      super
    end

    def sign_in(resource, scope: nil)
      Audited.store[:audited_user] = resource
      super
    end

    def sign_out(resource_or_scope)
      Audited.store[:audited_user] = nil
      super
    end

    def register_user(**kwargs)
      user = kwargs.fetch(:user) do
        User.new(
          first_name: kwargs.fetch(:first_name, Faker::Name.name),
          last_name: kwargs.fetch(:last_name, Faker::Name.name),
          email: kwargs.fetch(:email, Faker::Internet.email),
          password: kwargs.fetch(:password, 'password'),
          password_confirmation: kwargs.fetch(:password_confirmation, 'password'),
          confirmed_at: kwargs.fetch(:confirmed_at, Time.zone.now),
          confirmation_sent_at: kwargs.fetch(:confirmation_sent_at, Time.zone.now),
          accepted_terms_at: kwargs.fetch(:accepted_terms_at, Time.zone.now),
          accepted_privacy_at: kwargs.fetch(:accepted_privacy_at, Time.zone.now)
        )
      end
      user.skip_confirmation!
      account = user.my_accounts.new
      account.account_users.build(user:, role: kwargs.fetch(:role, :admin))
      account.account_type = kwargs.fetch(:account_type, :business)
      account.admin = kwargs.fetch(:admin, false)

      company = account.build_company(
        name: kwargs.fetch(:company_name, Faker::Company.name),
        person_type: kwargs.fetch(:person_type, :legal),
        document_1: kwargs.fetch(:document_1, Faker::Company.brazilian_company_number),
        document_3: kwargs.fetch(:document_3, '12345678'),
        email: kwargs.fetch(:email, user.email)
      )

      company.build_nfse_config(
        enabled: kwargs.fetch(:enabled, false),
        provider: kwargs.fetch(:provider, 'padrao'),
        environment: kwargs.fetch(:environment, 'homologacao'),
        simplified_tax_system_cd: kwargs.fetch(:simplified_tax_system_cd, 1),
        tax_calculation_regime_cd: kwargs.fetch(:tax_calculation_regime_cd, nil),
        special_tax_regime_cd: kwargs.fetch(:special_tax_regime_cd, 0),
        rps_initial_batch_number: kwargs.fetch(:rps_initial_batch_number, 1),
        rps_series: kwargs.fetch(:rps_series, '1'),
        rps_initial_number: kwargs.fetch(:rps_initial_number, 1),
        a1_cert_password: kwargs.fetch(:a1_cert_password, '12345678'),
        national_tax_code: kwargs.fetch(:national_tax_code, '1.05'),
        municipal_tax_code: kwargs.fetch(:municipal_tax_code, '1.05'),
        service_description: kwargs.fetch(:service_description, 'Serviços de Tecnologia'),
        iss_service_provided_tax_cd: kwargs.fetch(:iss_service_provided_tax_cd, 1),
        iss_withholding_type_cd: kwargs.fetch(:iss_withholding_type_cd, 1),
        iss_tax_rate: kwargs.fetch(:iss_tax_rate, 2.0)
      )

      company.build_address(
        address_line1: kwargs.fetch(:address_line1, 'Rua Ines Pinzon'),
        address_number: kwargs.fetch(:address_line1, '388'),
        district: kwargs.fetch(:district, 'Centro'),
        ibge_city_code: kwargs.fetch(:igbe_city_code, '4107207'),
        city: kwargs.fetch(:city, 'Dois Vizinhos'),
        state: kwargs.fetch(:state, 'PR'),
        postcode: kwargs.fetch(:postcode, '85660000')
      )
      user.save!
      [user, account]
    end

    def create_account_invitation(account, user, **kwargs)
      AccountInvitation.create!(
        email: kwargs.fetch(:email, Faker::Internet.email),
        name: kwargs.fetch(:first_name, Faker::Name.name),
        role: :custom,
        token: kwargs.fetch(:token, Faker::Internet.device_token),
        account: account,
        invited_by: user
      )
    end

    def enable_company_nfse_config(company, **kwargs)
      company.nfse_config.create!(
        # Default company configuration
        enabled: kwargs.fetch(:enabled, true),
        provider: kwargs.fetch(:provider, 'padrao'),
        environment: kwargs.fetch(:environment, 'homologacao'),
        simplified_tax_system_cd: kwargs.fetch(:simplified_tax_system_cd, CompanyNfseConfig.simplified_tax_systems[:nao_optante]),
        tax_calculation_regime_cd: kwargs.fetch(:tax_calculation_regime_cd, CompanyNfseConfig.tax_calculation_regimes[:tributos_federais_e_municipais_pelo_sn]),
        special_tax_regime_cd: kwargs.fetch(:special_tax_regime_cd, CompanyNfseConfig.special_tax_regimes[:nenhum]),
        rps_initial_batch_number: kwargs.fetch(:rps_initial_batch_number, 1),
        rps_series: kwargs.fetch(:rps_series, '1'),
        rps_initial_number: kwargs.fetch(:rps_initial_number, 1),
        a1_cert_password: kwargs.fetch(:a1_cert_password, '12345678'),
        # Default service configuration
        national_tax_code: kwargs.fetch(:national_tax_code, '1.04'),
        municipal_tax_code: kwargs.fetch(:municipal_tax_code, '1.04'),
        service_description: kwargs.fetch(:service_description, 'Serviços de Tecnologia'),
        iss_service_provided_tax_cd: kwargs.fetch(:iss_service_provided_tax_cd, 1),
        iss_withholding_type_cd: kwargs.fetch(:iss_withholding_type_cd, 1),
        iss_tax_rate: kwargs.fetch(:iss_tax_rate, 2.0)
      )
    end

    def create_announcement(**kwargs)
      Announcement.create!(
        title: kwargs.fetch(:title, Faker::Lorem.sentence),
        abstract: kwargs.fetch(:abstract, Faker::Lorem.paragraph),
        description: kwargs.fetch(:description, Faker::Lorem.paragraph),
        published_at: kwargs.fetch(:published_at, Time.zone.now),
        send_notification: kwargs.fetch(:send_notification, true),
        show_banner: kwargs.fetch(:show_banner, true)
      )
    end

    def create_category(account, **kwargs)
      account.categories.create!(
        name: kwargs.fetch(:name, Faker::Name.name),
        description: kwargs.fetch(:description, Faker::Lorem.paragraph),
        transaction_type: kwargs.fetch(:transaction_type, nil)
      )
    end

    def create_cost_center(account, **kwargs)
      account.cost_centers.create!(
        name: kwargs.fetch(:name, Faker::Name.name),
        description: kwargs.fetch(:description, Faker::Lorem.paragraph)
      )
    end

    def create_bank_account(account, **kwargs)
      account.bank_accounts.create!(
        name: kwargs.fetch(:name, Faker::Bank.name),
        account_type: kwargs.fetch(:account_type, :current_account),
        initial_balance: kwargs.fetch(:initial_balance, Money.new(0, 'BRL')),
        default: kwargs.fetch(:default, true)
      )
    end

    def create_api_token(account, user, permissions: {}, **kwargs)
      account.api_tokens.create!(
        name: kwargs.fetch(:name, Faker::Name.name),
        description: kwargs.fetch(:description, Faker::Lorem.paragraph),
        expires_at: kwargs.fetch(:expires_at, Time.zone.now + 1.day),
        user:
      )
    end

    def create_webhook(account, **kwargs)
      account.create_webhook(
        url: kwargs.fetch(:url, Faker::Internet.url)
      )
    end

    def create_webhook_payload(**kwargs)
      {
        id: kwargs.fetch(:id, 55_877),
        name: kwargs.fetch(:name, 'New transaction'),
        description: kwargs.fetch(:description, nil),
        due_date: kwargs.fetch(:due_date, '2024-05-09'),
        paid: kwargs.fetch(:paid, false),
        cost_center_id: kwargs.fetch(:cost_center_id, nil),
        bank_account_id: kwargs.fetch(:bank_account_id, 31),
        transfer_to_id: kwargs.fetch(:transfer_to_id, nil),
        transaction_type: kwargs.fetch(:transaction_type, 'revenue'),
        url: kwargs.fetch(:url, 'http://localhost:3000/api/v1/transactions/55877')
      }
    end

    # def create_help_user(**kwargs)
    #   HelpUser.create!(
    #     type: kwargs.fetch(:type, YoutubeVideo),
    #     description: kwargs.fetch(:description, Faker::Lorem.paragraph),
    #     title: kwargs.fetch(:title, Faker::Lorem.paragraph),
    #     link: kwargs.fetch(:link, Faker::Lorem.paragraph),
    #     youtube_video_id: kwargs.fetch(:link, Faker::Lorem.paragraph)
    #   )
    # end

    def create_contact(account, **kwargs)
      account.contacts.create!(
        contact_type: kwargs.fetch(:contact_type, :undefined_contact),
        person_type: kwargs.fetch(:person_type, :natural),
        name: kwargs.fetch(:name, Faker::Company.name),
        document_1: kwargs.fetch(:document_1, Faker::Number.number(digits: 11)),
        document_2: kwargs.fetch(:document_2, Faker::Number.number(digits: 9)),
        description: kwargs.fetch(:description, Faker::Lorem.paragraph),
        email: kwargs.fetch(:email, Faker::Internet.email),
        phone_number: kwargs.fetch(:phone, Faker::PhoneNumber.phone_number),
        cell_phone_number: kwargs.fetch(:cell_phone, Faker::PhoneNumber.cell_phone),
        address_attributes: {
          address_line1: kwargs.fetch(:address_line1, 'Rua Ines Pinzon'),
          address_line2: kwargs.fetch(:address_line2, 'Apto 100'),
          address_number: kwargs.fetch(:address_number, '388'),
          district: kwargs.fetch(:district, 'Centro'),
          city: kwargs.fetch(:city, 'Dois Vizinhos'),
          state: kwargs.fetch(:state, 'PR'),
          country: kwargs.fetch(:country, 'BR'),
          postcode: kwargs.fetch(:postcode, '85660000')
        }
      )
    end

    def create_payment_plan(account, **kwargs)
      account.payment_plans.create!(
        type_cd: kwargs.fetch(:type_cd, 1),
        frequency_cd: kwargs.fetch(:frequency_cd, 1),
        number_of_installments: kwargs.fetch(:number_of_installments, 12)
      )
    end

    def create_transaction(account, bank_account, **kwargs)
      account.transactions.create!(
        bank_account:,
        transaction_type: kwargs.fetch(:transaction_type, :revenue),
        due_date: kwargs.fetch(:due_date, Date.current),
        name: kwargs.fetch(:name, Faker::Lorem.sentence),
        description: kwargs.fetch(:description, Faker::Lorem.paragraph),
        competency_date: kwargs.fetch(:competency_date, nil),
        amount_cents: kwargs.fetch(:amount_cents, 2000),
        amount_currency: kwargs.fetch(:amount_currency, 'BRL'),
        category: kwargs.fetch(:category, create_category(account)),
        contact: kwargs.fetch(:contact, create_contact(account)),
        cost_center: kwargs.fetch(:cost_center, create_cost_center(account)),
        paid: kwargs.fetch(:paid, false),
        payment_type: kwargs.fetch(:payment_type, :on_cash),
        payment_method: kwargs.fetch(:payment_method, :no_payment_method),
        tag_list: kwargs.fetch(:tag_list, []),
        parent: kwargs.fetch(:parent, nil),
        kind: kwargs.fetch(:kind, :simple),
        payment_plan: kwargs.fetch(:payment_plan, nil)
      )

    end

    def create_transaction_and_children(account, bank_account, number_of_children: 3, **kwargs)
      children = []
      transaction = create_transaction(account, bank_account, **kwargs.merge(kind: :detailed))

      number_of_children.times do
        children << create_transaction(account, bank_account, parent: transaction, **kwargs.merge(kind: :child))
      end

      [transaction, children]
    end

    def create_service(account, **kwargs)
      account.services.create!(
        name: kwargs.fetch(:name, Faker::Lorem.sentence),
        description: kwargs.fetch(:description, Faker::Lorem.paragraph),
        cost_price_cents: kwargs.fetch(:cost_price_cents, 0),
        selling_price_cents: kwargs.fetch(:selling_price_cents, 0),
        currency: kwargs.fetch(:currency, 'BRL'),
        unit: kwargs.fetch(:unit, 'un'),
        data: kwargs.fetch(:data, {}),
        metadata: kwargs.fetch(:metadata, {})
      )
    end

    def create_invoice(account, recipient, bank_account, **kwargs)
      account.invoices.create!(
        provider: account.company,
        recipient:,
        bank_account:,
        status: kwargs.fetch(:status, :draft),
        issue_date: kwargs.fetch(:issue_date, Date.current),
        due_date: kwargs.fetch(:due_date, Date.current),
        number: kwargs.fetch(:number, nil),
        description: kwargs.fetch(:description, Faker::Lorem.paragraph),
        metadata: kwargs.fetch(:metadata, {}),
        currency: kwargs.fetch(:amount_currency, 'BRL'),
        amount_cents: kwargs.fetch(:amount_cents, 0),
        subtotal_cents: kwargs.fetch(:subtotal_cents, 0),
        tax_cents: kwargs.fetch(:tax_cents, 0),
        discount_cents: kwargs.fetch(:discount_cents, 0),
        total_cents: kwargs.fetch(:total_cents, 0),
        lines_attributes: kwargs.fetch(:lines_attributes, [])
      )
    end

    def create_list_of_transactions(account, bank_account, **kwargs)
      transactions = []
      kwargs.fetch(:number_of_transactions, 3).times do
        transactions << create_transaction(account, bank_account, **kwargs)
      end

      transactions
    end

    def create_sample_store
      integration_store = IntegrationStores::Pluggy.find_or_initialize_by(
        store_type_cd: IntegrationStore::STORE_TYPES[:open_banking],
        parent_store: nil,
        account: nil
      )
      create_sample_config(integration_store)
      create_sample_endpoints(integration_store)
      integration_store.reload
    end

    def create_sample_config(integration_store)
      integration_store.upsert_config({
                                        api_key: nil,
                                        api_key_expires_at: nil,
                                        default_expiry: 2, # in hours
                                        client_id: 'a0733036-a0c4-4a76-812b-a3cd21f3e61b', # development id
                                        client_secret: '0984be4d-2caa-4d7b-b0a4-86ae477173ac', # development secret
                                        host: 'https://api.pluggy.ai',
                                        allowed_hosts: %w[127.0.0.1 localhost 177.71.238.212]
                                      })
    end

    def create_sample_endpoints(integration_store)
      integration_store.upsert_endpoint(:token, method: Net::HTTP::Post::METHOD, uri: '/auth')
      integration_store.upsert_endpoint(:connect_token, method: Net::HTTP::Post::METHOD, uri: '/connect_token')
      integration_store.upsert_endpoint(:connectors, method: Net::HTTP::Get::METHOD, uri: '/connectors')
      integration_store.upsert_endpoint(:accounts, method: Net::HTTP::Get::METHOD, uri: '/accounts?itemId={{item_id}}')
      integration_store.upsert_endpoint(:account, method: Net::HTTP::Get::METHOD, uri: '/accounts/{{id}}')
      integration_store.upsert_endpoint(:transactions, method: Net::HTTP::Get::METHOD,
                                        uri: '/transactions?accountId={{account_id}}')
      integration_store.upsert_endpoint(:transaction, method: Net::HTTP::Get::METHOD, uri: '/transactions/{{id}}')
      integration_store.upsert_endpoint(:categories, method: Net::HTTP::Get::METHOD, uri: '/categories')
      integration_store.upsert_endpoint(:item, { method: Net::HTTP::Get::METHOD, uri: '/items/{{item_id}}' })
    end

    def create_sample_child_store(account, parent_store)
      IntegrationStores::Pluggy.create!(
        store_type: IntegrationStore::STORE_TYPES[:open_banking],
        parent_store:,
        account:
      )
    end

    def pluggy_response(file_name)
      File.read(Rails.root.join('test', 'fixtures', 'files', 'pluggy', "#{file_name}.json"))
    end

    def create_sample_nuvem_store
      integration_store = IntegrationStores::NuvemFiscal.find_or_initialize_by(
        store_type_cd: IntegrationStore::STORE_TYPES[:invoicing],
        parent_store: nil,
        account: nil
      )
      create_sample_nuvem_config(integration_store)
      create_sample_nuvem_endpoints(integration_store)
      make_nuvem_fiscal_company
      integration_store.reload
    end

    def create_sample_nuvem_config(integration_store)
      integration_store.upsert_config({
                                        access_token: nil,
                                        access_token_expires_at: nil,
                                        client_id: 'AnUGHKLiUttBP5oXHkAw', # development id
                                        client_secret: '7r4TnLfze9GTSETBO4n60yzUODzoPvBy6z9zIIz9', # development secret
                                        host: 'https://api.sandbox.nuvemfiscal.com.br',
                                        oauth_url: 'https://auth.nuvemfiscal.com.br/oauth/token',
                                        allowed_hosts: %w[127.0.0.1 localhost],
                                        scopes_nfse: %w[empresa nfse]
                                      })
    end

    def create_sample_nuvem_endpoints(integration_store)
      integration_store.upsert_endpoint(:cadastrar_empresa, method: Net::HTTP::Post::METHOD, uri: '/empresas')
      integration_store.upsert_endpoint(:buscar_empresa, method: Net::HTTP::Get::METHOD, uri: '/empresas/{{cpf_cnpj}}')
      integration_store.upsert_endpoint(:atualizar_empresa, method: Net::HTTP::Put::METHOD,
                                        uri: '/empresas/{{cpf_cnpj}}')
      integration_store.upsert_endpoint(:deletar_empresa, method: Net::HTTP::Delete::METHOD,
                                        uri: '/empresas/{{cpf_cnpj}}')
      integration_store.upsert_endpoint(:cadastrar_certificado, method: Net::HTTP::Put::METHOD,
                                        uri: '/empresas/{{cpf_cnpj}}/certificado')
      integration_store.upsert_endpoint(:upload_certificado, method: Net::HTTP::Put::METHOD,
                                        uri: '/empresas/{{cpf_cnpj}}/certificado/upload')
      integration_store.upsert_endpoint(:deletar_certificado, method: Net::HTTP::Delete::METHOD,
                                        uri: '/empresas/{{cpf_cnpj}}/certificado')
      integration_store.upsert_endpoint(:configurar_servico, method: Net::HTTP::Put::METHOD,
                                        uri: '/empresas/{{cpf_cnpj}}/nfse')
      integration_store.upsert_endpoint(:upload_logotipo, method: Net::HTTP::Put::METHOD,
                                        uri: '/empresas/{{cpf_cnpj}}/logotipo')
      integration_store.upsert_endpoint(:nfse_cidades, method: Net::HTTP::Get::METHOD, uri: '/nfse/cidades')
      integration_store.upsert_endpoint(:nfse_cidade, method: Net::HTTP::Get::METHOD,
                                        uri: '/nfse/cidades/{{codigo_ibge}}')
      integration_store.upsert_endpoint(:emitir_nfse, method: Net::HTTP::Post::METHOD, uri: '/nfse/dps')
      integration_store.upsert_endpoint(:consultar_nfse, method: Net::HTTP::Get::METHOD, uri: '/nfse/{{nfse_id}}')
      integration_store.upsert_endpoint(:cancelar_nfse, method: Net::HTTP::Post::METHOD,
                                        uri: '/nfse/{{nfse_id}}/cancelamento')
      integration_store.upsert_endpoint(:consultar_cancelamento, method: Net::HTTP::Get::METHOD,
                                        uri: '/nfse/{{nfse_id}}/cancelamento')
      integration_store.upsert_endpoint(:baixar_pdf_nfse, method: Net::HTTP::Get::METHOD, uri: '/nfse/{{nfse_id}}/pdf')
      integration_store.upsert_endpoint(:sincronizar_nfse, method: Net::HTTP::Post::METHOD,
                                        uri: '/nfse/{{nfse_id}}/sincronizar')
    end

    def make_nuvem_fiscal_company
      company =
        {
          'person_type_cd' => 2,
          'first_name' => 'CODENGAGE',
          'last_name' => nil,
          'document_1' => '24477617000160',
          'document_3' => '110612',
          'email' => 'integracoes@barbermanagement.io',
          'phone_number' => '4699711849',
          'contact_type_cd' => 0,
          'screen_name' => 'CODENGAGE SERVICOS TECNOLOGICOS LTDA',
          'account_id' => @account.id
        }

      address =
        {
          'postcode' => '85660000',
          'country' => 'BRASIL',
          'state' => 'PR',
          'city' => 'DOIS VIZINHOS',
          'address_line1' => 'DEDI BARRICHELLO MONTAGNER',
          'district' => 'CENTRO',
          'created_at' => '2024-02-24T08:59:26.547-03:00',
          'updated_at' => '2024-02-24T08:59:26.547-03:00',
          'address_number' => '250',
          'ibge_city_code' => '4107207'
        }
      @account.company.expects(:publish).once.with(:company_updated, record: @account.company).returns(true)
      @account.company.update!(company)
      @account.company.addresses.create!(address)
      @account.reload
    end

    def create_subscription(account, **kwargs)
      account.subscriptions.create!(
        processor_id: kwargs.fetch(:processor_id, 'sub_12345678'),
        processor_plan_id: kwargs.fetch(:processor_plan_id, 'plan_12345678'),
        processor_product_id: kwargs.fetch(:processor_product_id, 'prod_12345678'),
        status: kwargs.fetch(:status, :active),
        name: kwargs.fetch(:name, "#{Faker::Name.name} - Plano XPTO (mensal)"),
        cancel_at_period_end: kwargs.fetch(:cancel_at_period_end, false),
        current_period_start: kwargs.fetch(:current_period_start, Time.zone.now.beginning_of_month),
        current_period_end: kwargs.fetch(:current_period_end, (Time.zone.now + 1.month).end_of_month),
        data: kwargs.fetch(:data, {
          plan: {
            "metadata": {
              "type": 'primary',
              "account_type": 'business',
              "max_active_users": '5',
              "max_storage_size_in_bytes": '53687091200'
            }
          }
        }),
        metadata: kwargs.fetch(:metadata, {})
      )
    end

    def create_subscription_invoice(account, **kwargs)
      subscription = kwargs.fetch(:subscription) do
        create_subscription(account, **kwargs)
      end

      subscription.subscription_invoices.create!(
        account:,
        processor_id: kwargs.fetch(:processor_id, 'in_12345678'),
        status: kwargs.fetch(:status, :paid),
        data: kwargs.fetch(:data, {}),
        metadata: kwargs.fetch(:metadata, {})
      )
    end

    def create_barber_management_account
      user = kwargs.fetch(:user) do
        User.new(
          first_name: kwargs.fetch(:first_name, Faker::Name.name),
          last_name: kwargs.fetch(:last_name, Faker::Name.name),
          email: kwargs.fetch(:email, Faker::Internet.email),
          password: kwargs.fetch(:password, 'password'),
          password_confirmation: kwargs.fetch(:password_confirmation, 'password'),
          confirmed_at: kwargs.fetch(:confirmed_at, Time.zone.now),
          confirmation_sent_at: kwargs.fetch(:confirmation_sent_at, Time.zone.now),
          accepted_terms_at: kwargs.fetch(:accepted_terms_at, Time.zone.now),
          accepted_privacy_at: kwargs.fetch(:accepted_privacy_at, Time.zone.now)
        )
      end

      user.skip_confirmation!
      account = user.my_accounts.new
      account.account_users.build(user:, role: :admin)
      account.account_type = kwargs.fetch(:account_type, :business)
      account.admin = true
      company = account.build_company(name: kwargs.fetch(:company_name, Faker::Company.name))
      company.email = user.email
      user.save!

      [user, account]
    end
  end
end
