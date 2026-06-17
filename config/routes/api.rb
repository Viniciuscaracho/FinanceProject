# frozen_string_literal: true

namespace :api, defaults: { format: 'json' } do
  namespace :v1 do
    # Public routes (sem autenticação)
    get 'health', to: 'public#health_check'
    get 'transactions_test', to: 'public#transactions_test'
    
    # Public appointment booking routes
    namespace :public do
      get 'health', to: 'public#health_check'
      get 'schema_debug', to: 'public#schema_debug'
      get 'appointment_data/:token/services', to: 'appointment_data#services'
      get 'appointment_data/:token/professionals', to: 'appointment_data#professionals'
      get 'appointment_data/:token/available_slots', to: 'appointment_data#available_slots'
      get 'appointment_data/:token/config', to: 'appointment_data#link_config'
      get 'appointment_data/:token/full', to: 'appointment_data#full'

      # Vitrine pública — descobrir profissionais
      get    'discover',             to: 'discover#index'
      get    'discover/categories',  to: 'discover#categories'
      get    'discover/:id',         to: 'discover#show'
      delete 'discover/:id',         to: 'discover#hide'

      # Anamnese pública — preenchimento pelo paciente via link
      get  'anamnese/:token', to: 'anamnese#show'
      post 'anamnese/:token', to: 'anamnese#create'

      # Documento vivo — visualização pública pelo paciente
      get 'documents/:token', to: 'patient_documents#show'

      # Plano alimentar — visualização pública pelo paciente
      get 'meal-plans/:token', to: 'meal_plans#show'
    end
    
    # Onboarding
    scope :onboarding do
      post   'seed_demo',  to: 'onboarding#seed_demo'
      delete 'clear_demo', to: 'onboarding#clear_demo'
    end

    # Auth routes
    post 'auth/login', to: 'auth#login'
    post 'auth/login_simple', to: 'auth#login_simple'
    post 'auth/logout', to: 'auth#logout'
    get 'auth/me', to: 'auth#me'
    post 'auth/register', to: 'auth#register'
    get  'oauth/google_oauth_url',       to: 'auth#google_oauth_url'
    get  'auth/google_oauth_callback',   to: 'auth#google_oauth_callback'
    post 'auth/accept_terms',            to: 'auth#accept_terms'
    post 'auth/dev_login', to: 'auth#dev_login' if Rails.env.development?

    # Google Calendar integration
    scope :google_calendar do
      get    'status',      to: 'google_calendar#status'
      get    'oauth_url',   to: 'google_calendar#oauth_url'
      get    'callback',    to: 'google_calendar#callback'
      get    'events',      to: 'google_calendar#events'
      delete 'disconnect',  to: 'google_calendar#disconnect'
      post   'sync',        to: 'google_calendar#sync'
    end

    scope :google_contacts do
      get    'status',     to: 'google_contacts#status'
      get    'oauth_url',  to: 'google_contacts#oauth_url'
      get    'callback',   to: 'google_contacts#callback'
      delete 'disconnect', to: 'google_contacts#disconnect'
      get    'list',       to: 'google_contacts#list'
      post   'import',     to: 'google_contacts#import'
    end
    
    resources :transactions, only: %i[index show create update destroy] do
      collection do
        get :check_recurrence_expiry
        post :extend_recurrence
        post :bulk_destroy
        post :bulk_mark_as_paid
        post :bulk_update
      end
    end
    
    # Payment plans routes
    resources :payment_plans, only: [] do
      member do
        get :installments
        put :update_installments
        patch :update_installments
      end
    end
    resources :contacts, only: %i[index show create update destroy] do
      resources :patient_goals, only: %i[index create update destroy] do
        member do
          post :add_progress
        end
      end
      resources :patient_documents, only: %i[index show create update destroy] do
        member do
          post :toggle_shared
        end
      end
      resources :patient_notes, only: %i[index create update destroy]
      resources :anamnese_responses, only: %i[index create],
                controller: 'contact_anamnese_responses'
      resources :meal_plans, only: %i[index show create update destroy] do
        collection { post :from_template }
        member do
          post :activate
          post :add_day
          delete 'days/:day_id', action: :remove_day
          post 'days/:day_id/meals', action: :add_meal
          delete 'days/:day_id/meals/:meal_id', action: :remove_meal
          post 'days/:day_id/meals/:meal_id/foods', action: :add_food
          patch 'days/:day_id/meals/:meal_id/foods/:food_item_id', action: :update_food
          delete 'days/:day_id/meals/:meal_id/foods/:food_item_id', action: :remove_food
        end
      end
      member do
        get :last_anamnese_response
        get :anamnese_history
      end
    end

    resources :foods, only: %i[index create destroy] do
      collection do
        get 'barcode/:barcode', action: :barcode_search
      end
    end
    resources :meal_plan_templates, only: %i[index show create update destroy] do
      collection do
        post :from_plan
        post :import_system
      end
      member do
        post :add_day
        delete 'days/:day_id', action: :remove_day
        post 'days/:day_id/meals', action: :add_meal
        delete 'days/:day_id/meals/:meal_id', action: :remove_meal
        post 'days/:day_id/meals/:meal_id/foods', action: :add_food
        patch 'days/:day_id/meals/:meal_id/foods/:food_item_id', action: :update_food
        delete 'days/:day_id/meals/:meal_id/foods/:food_item_id', action: :remove_food
      end
    end
    resources :categories, only: %i[index show create update destroy]
    resources :cost_centers, only: %i[index show create update destroy]
    resources :tags, only: %i[index]
    resources :bank_accounts, only: %i[index show create update destroy] do
      member do
        get :transactions
      end
      collection do
        get :balance
      end
    end
    resources :users, only: %i[index show update]
    
    # Account settings (somente para admins da conta)
    resource :account_settings, only: %i[show update] do
      patch :upload_logo,  on: :member
      patch :upload_cover, on: :member
    end
    
    # WhatsApp Configuration
    resource :whatsapp_config, only: %i[show create update] do
      member do
        get  :check_connection   # legado
        get  :connection_status
        get  :qr_code
        post :pairing_code
        delete :disconnect_instance
      end
    end

    # WhatsApp Messages (leitura para monitoramento e testes)
    resources :whatsapp_messages, only: %i[index]
    
    # Professionals routes
    resources :professionals, only: %i[index show create update destroy] do
      member do
        patch :update_schedule
        get :commission_configs
        post :commission_configs, action: :create_commission_config
        patch 'commission_configs/:commission_config_id', action: :update_commission_config
        delete 'commission_configs/:commission_config_id', action: :destroy_commission_config
      end
    end
    
    # Services routes
    resources :services, only: %i[index show create update destroy]
    
    # Dashboard routes
    get 'dashboard', to: 'dashboard#index'
    get 'dashboard/recent_transactions', to: 'dashboard#recent_transactions'
    get 'dashboard/statistics', to: 'dashboard#statistics'
    get 'dashboard/overdue_commitments', to: 'dashboard#overdue_commitments'
    get 'dashboard/today_commitments', to: 'dashboard#today_commitments'
    
    # Appointments routes (para integração com n8n/WhatsApp)
    resources :appointments, only: %i[index show create update destroy] do
      collection do
        get :services
        get :professionals
        get :available_slots
      end
      member do
        post :send_reminder
        post :send_anamnese
        post :generate_google_meet
        post :generate_professional_document
        get :professional_document_templates
      end
      resources :appointment_notes, only: %i[index show create update destroy] do
        member do
          post :add_task
          post :complete_task
          delete :remove_task, path: 'remove_task/:task_id'
        end
      end
      resource :anamnese_response, only: [:show, :create]
      resources :attachments, only: %i[index create destroy], controller: 'appointments/attachments'
    end
    
    # Appointment Links routes
    resources :appointment_links, only: %i[index show create update destroy]
    
    # Appointment reports
    namespace :appointment_reports do
      get :by_professional
      get :summary
    end
    
    # Commissions routes
    resources :commissions, only: %i[index] do
      collection do
        get :summary
      end
    end
    
    # Financial reports (including appointments)
    resources :reports, only: %i[index show]
    
    # Anamnese templates
    resources :anamnese_templates, only: %i[index show create update destroy]

    # Document Templates routes
    resources :receipt_templates, only: %i[index show create update destroy]
    resources :invoice_templates, only: %i[index show create update destroy]
    resources :contract_templates, only: %i[index show create update destroy]
    resources :professional_document_templates, only: %i[index show create update destroy]
    
    # Imports routes
    resources :imports, only: %i[index show create destroy] do
      member do
        put :discard
        patch :discard
        put :undiscard
        patch :undiscard
      end
    end
    
    # PIX Payments (AbacatePay)
    resources :pix_payments, only: %i[index] do
      collection do
        post :create_billing
        post :sync
        get 'status/:billing_id', action: :status
      end
    end

    # Subscriptions routes
    resources :subscriptions, only: %i[index] do
      collection do
        get :plans
        post :create_checkout
        get :billing_portal
        post :cancel
        post :reactivate
        post :sync
      end
    end
    
    # Statements (Reconciliations/OFX)
    resources :statements, only: %i[index show create update destroy] do
      member do
        post :finish
      end
      
      resources :statement_items, only: %i[index show update] do
        member do
          post :confirm
          post :ignore
          post :reset
          post :reconcile
        end
        collection do
          post :bulk_confirm
          post :bulk_ignore
        end
      end
    end
    
    # WhatsApp Webhook
    namespace :whatsapp do
      post 'webhook', to: 'whats_app_webhook#webhook'
      post 'webhook/:account_id', to: 'whats_app_webhook#webhook' # Versão com account_id na URL
      get 'webhook', to: 'whats_app_webhook#verify'
    end
    
    # Admin routes (exclusivo para dono do sistema)
    get 'admin/dashboard', to: 'admin#dashboard'
    
    # Accounts management
    get 'admin/accounts', to: 'admin#accounts'
    get 'admin/accounts/:id', to: 'admin#account_details'
    patch 'admin/accounts/:id', to: 'admin#update_account'
    post 'admin/accounts/:id/suspend', to: 'admin#suspend_account'
    post 'admin/accounts/:id/activate', to: 'admin#activate_account'
    post 'admin/accounts/:id/impersonate', to: 'admin#impersonate'
    get 'admin/accounts/:id/subscriptions', to: 'admin#account_subscriptions'
    post 'admin/accounts/:id/extend_trial', to: 'admin#extend_trial'
    get  'admin/accounts/:id/audit_logs',   to: 'admin#audit_logs'

    # Support/Impersonation
    post 'admin/stop_impersonating', to: 'admin#stop_impersonating'

    # Subscriptions management
    get 'admin/subscriptions', to: 'admin#subscriptions'
    get 'admin/subscriptions/:id', to: 'admin#subscription_details'
    post 'admin/subscriptions', to: 'admin#create_subscription'
    patch 'admin/subscriptions/:id', to: 'admin#update_subscription'
    post 'admin/subscriptions/:id/cancel', to: 'admin#cancel_subscription'
    post 'admin/subscriptions/:id/reactivate', to: 'admin#reactivate_subscription'

    # Users management
    get  'admin/users', to: 'admin#users'
    post 'admin/users/:id/resend_confirmation', to: 'admin#resend_confirmation'

    # Webhook logs
    get  'admin/webhooks',          to: 'admin#webhook_logs'
    post 'admin/webhooks/:id/retry', to: 'admin#retry_webhook'

    # Stripe sync actions
    post 'admin/sync_stripe',       to: 'admin#sync_stripe'
    post 'admin/fix_subscriptions', to: 'admin#fix_subscriptions'

    # Announcements management
    get    'admin/announcements',     to: 'admin#announcements'
    post   'admin/announcements',     to: 'admin#create_announcement'
    patch  'admin/announcements/:id', to: 'admin#update_announcement'
    delete 'admin/announcements/:id', to: 'admin#destroy_announcement'

    # Referral codes management
    get    'admin/referral_codes',     to: 'admin#referral_codes'
    post   'admin/referral_codes',     to: 'admin#create_referral_code'
    patch  'admin/referral_codes/:id', to: 'admin#update_referral_code'
    delete 'admin/referral_codes/:id', to: 'admin#destroy_referral_code'
  end
end
