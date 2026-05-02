# frozen_string_literal: true

RailsAdmin.config do |config|
  config.asset_source = :sprockets

  ### Popular gems integration

  ## == Devise ==
  config.authenticate_with do
    warden.authenticate! scope: :user
  end
  config.current_user_method(&:current_user)

  ## == CancanCan ==
  # config.authorize_with :cancancan

  ## == Pundit ==
  # config.authorize_with :pundit

  ## == PaperTrail ==
  # config.audit_with :paper_trail, 'User', 'PaperTrail::Version' # PaperTrail >= 3.0.0

  ### More at https://github.com/railsadminteam/rails_admin/wiki/Base-configuration

  ## == Gravatar integration ==
  ## To disable Gravatar integration in Navigation Bar set to false
  # config.show_gravatar = true

  config.actions do
    dashboard do
      statistics false
    end
    index do
      except %w[ActiveStorage::Attachment ActiveStorage::Blob ActiveStorage::VariantRecord ActionText::RichText
              ActionText::EncryptedRichText Audit DocumentTemplate Transaction ZeroPaperItem StatementItem
              Domain Person Segment Invoice InvoiceLine]
    end
    new
    export do
      except %w[ActiveStorage::Attachment ActiveStorage::Blob ActiveStorage::VariantRecord ActionText::RichText
              ActionText::EncryptedRichText Audit DocumentTemplate Transaction ZeroPaperItem StatementItem
              Domain Person Segment Invoice InvoiceLine]
    end
    bulk_delete
    show
    edit
    delete
    # show_in_app

    ## With an audit adapter, you can add:
    # history_index
    # history_show
  end

  config.model 'Account' do
    list do
      search_by :search_by_q
      field :id
      field :owner
      field :name
      field :account_type do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :account_type)
        end
      end
      field :subscription_status do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :subscription_status)
        end
      end
      field :free
      # field :trial
      field :trial_ends_at
      field :balance
      field :subscription

      # field :processor_plan_id
      # field :processor_plan_name
      field :processor_customer_id
      # field :current_period_starts_at
      # field :current_period_ends_at
      field :related_to
      field :relation_type do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :relation_type)
        end
      end
      field :referral_code
      field :created_at
      field :updated_at
    end

    edit do
      field :company
      field :account_type do
        render do
          f, v = bindings.values_at(:form, :view)
          f.select :account_type, v.enum_option_pairs(f.object, :account_type), {}, class: 'form-select'
        end
      end
      field :default_currency
      field :free
      # field :trial
      field :trial_ends_at
      field :balance
      field :subscription
      field :subscription_status do
        render do
          f, v = bindings.values_at(:form, :view)
          f.select :subscription_status, v.enum_option_pairs(f.object, :subscription_status), {}, class: 'form-select'
        end
      end
      # field :processor_plan_id
      # field :processor_plan_name
      field :processor_customer_id
      # field :current_period_starts_at
      # field :current_period_ends_at
      field :max_storage_size_in_bytes
      field :max_active_users
      field :owner
      field :related_to
      field :relation_type do
        render do
          f, v = bindings.values_at(:form, :view)
          f.select :relation_type, v.enum_option_pairs(f.object, :relation_type), {}, class: 'form-select'
        end
      end
      field :referral_code
      field :invoice_number_starts_at
      field :invoice_due_days
      field :admin
      field :created_at
      field :updated_at
    end

    show do
      field :id
      field :company
      field :account_type do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :account_type)
        end
      end
      field :default_currency
      field :free
      field :trial
      field :trial_ends_at
      field :balance
      field :subscription_status do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :subscription_status)
        end
      end
      field :subscription
      # field :processor_plan_id
      # field :processor_plan_name
      field :processor_customer_id
      # field :current_period_starts_at
      # field :current_period_ends_at
      field :max_storage_size_in_bytes
      field :max_active_users
      field :owner
      field :account_users_count
      field :account_invitations_count
      field :bank_accounts_count
      field :contacts_count
      field :categories_count
      field :cost_centers_count
      field :transactions_count
      field :account_users
      field :bank_accounts
      field :imports
      field :connected_users
      field :related_to
      field :relation_type do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :relation_type)
        end
      end
      field :referral_code
      field :related_accounts
      field :invoice_number_starts_at
      field :invoice_due_days
      field :admin
      field :created_at
      field :updated_at
    end
  end

  config.model 'AccountUser' do
    list do
      field :id
      field :account
      field :user
      field :role
      field :created_at
      field :updated_at
    end

    show do
      field :id
      field :account
      field :user
      field :role
      field :created_at
      field :updated_at
    end

    edit do
      field :account
      field :user
      field :role
    end
  end

  config.model 'BankAccount' do
    list do
      field :id
      field :account
      field :name
      field :account_type
      field :initial_balance
      field :bank_id
      field :balance
      field :created_at
      field :updated_at
    end

    edit do
      field :name
      field :account_type
      field :bank_id
      field :created_at
      field :updated_at
    end

    show do
      field :id
      field :account
      field :name
      field :bank_id
      field :account_type
      field :initial_balance
      field :balance
      field :created_at
      field :updated_at
    end
  end

  config.model 'Category' do
    list do
      search_by :search_by_q
      field :id
      field :account
      field :name
      field :transaction_type do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :transaction_type)
        end
      end
      field :description
      field :created_at
      field :updated_at
    end

    edit do
      field :name
      field :description
      field :transaction_type_cd
      field :created_at
      field :updated_at
    end

    show do
      field :id
      field :account
      field :name
      field :transaction_type do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :transaction_type)
        end
      end
      field :description
      field :created_at
      field :updated_at
    end
  end

  config.model 'Company' do
    list do
      field :id
      field :account
      field :person_type do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :person_type)
        end
      end
      field :name
      field :document_1
      field :document_2
      field :email
      field :phone_number
      field :created_at
      field :updated_at
    end

    edit do
      field :name
      field :person_type do
        render do
          f, v = bindings.values_at(:form, :view)
          f.select :person_type, v.enum_option_pairs(f.object, :person_type), {}, class: 'form-select'
        end
      end
      field :description
      field :document_1
      field :document_2
      field :email
      field :phone_number
      field :created_at
      field :updated_at
    end

    show do
      field :id
      field :account
      field :person_type do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :person_type)
        end
      end
      field :name
      field :description
      field :document_1
      field :document_2
      field :email
      field :phone_number
      field :created_at
      field :updated_at
    end
  end

  config.model 'Contact' do
    list do
      search_by :search_by_q
      field :id
      field :account
      field :name
      field :contact_type do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :contact_type)
        end
      end
      field :document_1
      field :document_2
      field :email
      field :phone_number
      field :created_at
      field :updated_at
    end

    edit do
      field :name
      field :contact_type do
        render do
          f, v = bindings.values_at(:form, :view)
          f.select :contact_type, v.enum_option_pairs(f.object, :contact_type), {}, class: 'form-select'
        end
      end
      field :document_1
      field :document_2
      field :email
      field :phone_number
      field :created_at
      field :updated_at
    end

    show do
      field :id
      field :account
      field :name
      field :contact_type do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :contact_type)
        end
      end
      field :document_1
      field :document_2
      field :email
      field :phone_number
      field :created_at
      field :updated_at
    end
  end

  config.model 'CostCenter' do
    list do
      search_by :search_by_q
      field :id
      field :account
      field :name
      field :description
      field :created_at
      field :updated_at
    end

    edit do
      field :name
      field :description
      field :created_at
      field :updated_at
    end

    show do
      field :id
      field :account
      field :name
      field :description
      field :created_at
      field :updated_at
    end
  end

  config.model 'Domain' do
    list do
      field :id
      field :account
      field :type
      field :name
      field :transaction_type
      field :description
      field :created_at
      field :updated_at
    end

    edit do
      field :name
      field :description
      field :transaction_type
      field :created_at
      field :updated_at
    end

    show do
      field :id
      field :account
      field :type
      field :name
      field :transaction_type
      field :description
      field :created_at
      field :updated_at
    end
  end

  config.model 'Import' do
    list do
      field :id
      field :account
      field :source
      field :state
      field :message
      field :progress_number
      field :progress_total
      field :created_at
      field :updated_at
      field :discarded_at
    end

    edit do
      field :source
      field :state
      field :message
      field :progress_number
      field :progress_total
      field :created_at
      field :updated_at
      field :discarded_at
    end

    show do
      field :id
      field :account
      field :source
      field :state
      field :message
      field :progress_number
      field :progress_total
      field :created_at
      field :updated_at
      field :discarded_at
      field :audits
    end
  end

  config.model 'Person' do
    list do
      field :id
      field :type
      field :account_id
      field :name
      field :person_type
      field :document_1
      field :document_2
      field :email
      field :phone_number
      field :created_at
      field :updated_at
    end

    edit do
      field :name
      field :person_type
      field :document_1
      field :document_2
      field :email
      field :phone_number
      field :created_at
      field :updated_at
    end

    show do
      field :id
      field :type
      field :account_id
      field :name
      field :person_type
      field :document_1
      field :document_2
      field :email
      field :phone_number
      field :created_at
      field :updated_at
    end
  end

  config.model 'Transaction' do
    list do
      search_by :search_by_q
      field :id
      field :account
      field :bank_account
      field :transaction_type
      field :due_date
      field :name
      field :contact
      field :category
      field :paid
      field :amount
      field :exchanged_amount
      field :created_at
      field :updated_at
    end
  end

  config.model 'User' do
    list do
      search_by :search_by_q
      field :id
      field :account
      field :first_name
      field :last_name
      field :email
      field :preferred_language
      field :time_zone
      field :confirmed_at
      field :invitation_created_at
      field :invitation_accepted_at
      field :created_at
      field :updated_at
    end

    edit do
      field :first_name
      field :last_name
      field :preferred_language
      field :time_zone
      field :email
      field :lead_code
      field :zp_user
      field :contact_me_by
      field :phone_number
      field :postcode
    end

    show do
      field :id
      field :account
      field :first_name
      field :last_name
      field :preferred_language
      field :time_zone
      field :email
      field :reset_password_sent_at
      field :remember_created_at
      field :sign_in_count
      field :current_sign_in_at
      field :last_sign_in_at
      field :current_sign_in_ip
      field :last_sign_in_ip
      field :confirmation_token
      field :confirmed_at
      field :confirmation_sent_at
      field :created_at
      field :updated_at
      field :accepted_terms_at
      field :accepted_privacy_at
      field :invitation_created_at
      field :invitation_sent_at
      field :invitation_accepted_at
      field :invitation_limit
      field :invited_by_id
      field :invited_by_type
      field :lead_code
      field :zp_user
      field :contact_me_by
      field :phone_number
      field :postcode
      field :admin
      field :account_users
    end
  end

  config.model 'WhatsappConfig' do
    list do
      field :id
      field :account
      field :enabled
      field :evolution_api_url
      field :evolution_instance_name
      field :created_at
      field :updated_at
    end

    edit do
      field :account
      field :enabled
      field :evolution_api_url do
        help 'URL base da Evolution API (ex: http://localhost:8080)'
      end
      field :evolution_api_key do
        help 'Chave de autenticação da Evolution API'
      end
      field :evolution_instance_name do
        help 'Nome da instância do WhatsApp (padrão: default)'
      end
    end

    show do
      field :id
      field :account
      field :enabled
      field :evolution_api_url
      field :evolution_api_key do
        formatted_value do
          value.present? ? '••••••••' : '(não configurado)'
        end
      end
      field :evolution_instance_name
      field :created_at
      field :updated_at
    end
  end

  config.model 'Announcement' do
    list do
      field :id
      field :title
      field :abstract
      field :show_banner
      field :send_notification
      field :published_at
      field :created_at
      field :updated_at
    end

    edit do
      field :title
      field :abstract
      field :description
      field :published_at
      field :show_banner
      field :send_notification
    end

    show do
      field :id
      field :title
      field :abstract
      field :description
      field :show_banner
      field :send_notification
      field :notification_sent_at
      field :published_at
      field :created_at
      field :updated_at
    end
  end

  config.model 'ReferralCode' do
    list do
      field :id
      field :referrer
      field :name
      field :description
      field :trial_days
      field :create_free_personal_account
      field :account_type do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :account_type)
        end
      end
      field :code
      field :short_referral_url do
        render do
          v, referral_code = bindings.values_at(:view, :object)
          url = referral_code.short_referral_url
          # value will point to bindings[:object].name
          v.link_to(value, url, target: '_blank', rel: 'noopener noreferrer')
        end
      end
      field :benefit_type do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :benefit_type)
        end
      end
      field :benefit
      field :created_at
      field :updated_at
    end

    edit do
      field :referrer
      field :name
      field :description
      field :trial_days
      field :create_free_personal_account
      field :account_type do
        render do
          f, v = bindings.values_at(:form, :view)
          f.select :account_type, v.enum_option_pairs(f.object, :account_type), {}, class: 'form-select'
        end
      end
      field :benefit_type do
        render do
          f, v = bindings.values_at(:form, :view)
          f.select :benefit_type, v.enum_option_pairs(f.object, :benefit_type), {}, class: 'form-select'
        end
      end
      field :benefit
    end

    show do
      field :id
      field :referrer
      field :name
      field :description
      field :trial_days
      field :create_free_personal_account
      field :account_type do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :account_type)
        end
      end
      field :code
      field :short_referral_url do
        render do
          v, referral_code = bindings.values_at(:view, :object)
          url = referral_code.short_referral_url
          v.link_to(value, url, target: '_blank', rel: 'noopener noreferrer')
        end
      end
      field :benefit_type do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :benefit_type)
        end
      end
      field :benefit
      field :referees
      field :created_at
      field :updated_at
    end
  end

  config.model 'Segment' do
    list do
      field :id
      field :parent
      field :type
      field :name
      field :description
      field :language
      field :created_at
      field :updated_at
    end

    edit do
      field :type
      field :name
      field :description
      field :language
    end

    show do
      field :id
      field :type
      field :name
      field :description
      field :language
      field :created_at
      field :updated_at
    end
  end

  config.model 'BusinessSector' do
    list do
      field :id
      field :name
      field :description
      field :language
      field :created_at
      field :updated_at
    end

    edit do
      field :name
      field :description
      field :language
      field :sector_activities
    end

    show do
      field :id
      field :name
      field :description
      field :language
      field :sector_activities
      field :created_at
      field :updated_at
    end
  end

  config.model 'SectorActivity' do
    list do
      field :id
      field :business_sector
      field :name
      field :description
      field :language
      field :created_at
      field :updated_at
    end

    edit do
      field :business_sector
      field :name
      field :description
      field :language
    end

    show do
      field :id
      field :business_sector
      field :name
      field :description
      field :language
      field :created_at
      field :updated_at
    end
  end

  config.model 'CategoryPreset' do
    list do
      field :id
      field :sector_activity
      field :transaction_type
      field :name
      field :description
      field :language
      field :created_at
      field :updated_at
    end

    edit do
      field :sector_activity
      field :transaction_type
      field :name
      field :description
      field :language
    end

    show do
      field :id
      field :sector_activity
      field :transaction_type
      field :name
      field :description
      field :language
      field :created_at
      field :updated_at
    end
  end

  config.model 'Subscription' do
    list do
      field :id
      field :account
      field :name
      field :status do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :status)
        end
      end
      field :current_period_start
      field :current_period_end
      field :processor_id
      field :processor_plan_id
      field :processor_product_id
      field :created_at
      field :updated_at
    end

    edit do
      field :id
      field :account
      field :name
      field :status do
        render do
          f, v = bindings.values_at(:form, :view)
          f.select :status, v.enum_option_pairs(f.object, :status), {}, class: 'form-select'
        end
      end
      field :current_period_start
      field :current_period_end
    end

    show do
      field :id
      field :account
      field :name
      field :status do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :status)
        end
      end
      field :status
      field :current_period_start
      field :current_period_end
      field :processor_id
      field :processor_plan_id
      field :processor_product_id
      field :data
      field :metadata
      field :created_at
      field :updated_at
    end
  end

  config.model 'SubscriptionInvoice' do
    list do
      field :id
      field :account
      field :subscription
      field :processor_id
      field :status do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :status)
        end
      end
      field :created_at
      field :updated_at
    end

    edit do
      field :id
      field :account
      field :subscription
      field :processor_id
      field :status do
        render do
          f, v = bindings.values_at(:form, :view)
          f.select :status, v.enum_option_pairs(f.object, :status), {}, class: 'form-select'
        end
      end
      field :created_at
      field :updated_at
    end

    show do
      field :id
      field :account
      field :subscription
      field :processor_id
      field :status do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :status)
        end
      end
      field :data
      field :metadata
      field :created_at
      field :updated_at
    end
  end

  config.model 'SubscriptionCharge' do
    list do
      field :id
      field :account
      field :subscription
      field :subscription_invoice
      field :processor_id
      field :status do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :status)
        end
      end
      field :amount
      field :created_at
      field :updated_at
    end

    edit do
      field :id
      field :account
      field :subscription
      field :subscription_invoice
      field :processor_id
      field :status do
        render do
          f, v = bindings.values_at(:form, :view)
          f.select :status, v.enum_option_pairs(f.object, :status), {}, class: 'form-select'
        end
      end
      field :amount_cents
    end

    show do
      field :id
      field :account
      field :subscription
      field :subscription_invoice
      field :processor_id
      field :status do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :status)
        end
      end
      field :data
      field :metadata
      field :invoice
      field :amount
      field :created_at
      field :updated_at
    end
  end

  config.model 'SubscriptionWebhook' do
    list do
      field :id
      field :event_type
      field :status do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :status)
        end
      end
      field :created_at
      field :updated_at
    end

    edit do
      field :event_type
      field :status do
        render do
          f, v = bindings.values_at(:form, :view)
          f.select :status, v.enum_option_pairs(f.object, :status), {}, class: 'form-select'
        end
      end
    end

    show do
      field :id
      field :event_type
      field :status do
        formatted_value do
          v, object = bindings.values_at(:view, :object)
          v.te(object, :status)
        end
      end
      field :created_at
      field :updated_at
      field :event
      field :details
    end
  end

  config.model 'Bank' do
    list do
      field :id
      field :country
      field :code
      field :name
      field :description
      field :ispb
      field :created_at
      field :updated_at
    end

    edit do
      field :country
      field :code
      field :name
      field :description
      field :ispb
    end

    show do
      field :id
      field :country
      field :code
      field :name
      field :description
      field :ispb
      field :created_at
      field :updated_at
    end
  end

  config.model 'City' do
    list do
      field :id
      field :state
      field :key
      field :value
      field :created_at
      field :updated_at
    end

    edit do
      field :key
      field :value
    end

    show do
      field :id
      field :state
      field :key
      field :value
      field :created_at
      field :updated_at
    end
  end

  config.model 'Cnae' do
    list do
      field :id
      field :key
      field :formatted_key
      field :value
      field :created_at
      field :updated_at
    end

    edit do
      field :key
      field :value
    end

    show do
      field :id
      field :key
      field :formatted_key
      field :value
      field :created_at
      field :updated_at
    end
  end

  config.model 'State' do
    list do
      field :id
      field :key
      field :value
      field :created_at
      field :updated_at
    end

    edit do
      field :key
      field :value
    end

    show do
      field :id
      field :state
      field :key
      field :value
      field :created_at
      field :updated_at
    end
  end

  config.model 'Offer' do
    list do
      field :id
      field :type
      field :account
      field :internal_code
      field :name
      field :description
      field :unit
      field :selling_price
      field :cost_price
      field :currency
      field :enabled
      field :created_at
      field :updated_at
    end

    edit do
      field :id
      field :internal_code
      field :name
      field :description
      field :unit
      field :selling_price_cents
      field :cost_price_cents
      field :currency
      field :enabled
    end

    show do
      field :id
      field :type
      field :account
      field :internal_code
      field :name
      field :description
      field :unit
      field :selling_price
      field :cost_price
      field :currency
      field :enabled
      field :data
      field :metadata
      field :created_at
      field :updated_at
    end
  end

  config.model 'IntegrationStore' do
    list do
      field :id
      field :type
      field :parent_store
      field :account
      field :name
      field :description
      field :created_at
      field :updated_at
    end

    edit do
      field :id
      field :parent_store
      field :account
      field :name
      field :description
    end

    show do
      field :id
      field :parent_store
      field :type
      field :account
      field :name
      field :created_at
      field :updated_at
    end
  end

  config.model 'IntegrationStores::Pluggy' do
    list do
      field :id
      field :parent_store
      field :account
      field :name
      field :description
      field :created_at
      field :updated_at
    end

    edit do
      field :id
      field :parent_store
      field :account
      field :name
      field :description
    end

    show do
      field :id
      field :parent_store
      field :account
      field :name
      field :created_at
      field :updated_at
    end
  end

  config.model 'IntegrationStores::NuvemFiscal' do
    list do
      field :id
      field :parent_store
      field :account
      field :name
      field :description
      field :created_at
      field :updated_at
    end

    edit do
      field :id
      field :parent_store
      field :account
      field :name
      field :description
    end

    show do
      field :id
      field :parent_store
      field :account
      field :name
      field :created_at
      field :updated_at
    end
  end
end
