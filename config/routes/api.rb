# frozen_string_literal: true

namespace :api, defaults: { format: 'json' } do
  namespace :v1 do
    # Public routes (sem autenticação)
    get 'health', to: 'public#health_check'
    get 'transactions_test', to: 'public#transactions_test'
    
    # Public appointment booking routes
    namespace :public do
      get 'health', to: 'public#health_check'
      get 'appointment_data/:token/services', to: 'appointment_data#services'
      get 'appointment_data/:token/professionals', to: 'appointment_data#professionals'
      get 'appointment_data/:token/available_slots', to: 'appointment_data#available_slots'
      get 'appointment_data/:token/config', to: 'appointment_data#link_config'
      get 'appointment_data/:token/full', to: 'appointment_data#full'
    end
    
    # Auth routes
    post 'auth/login', to: 'auth#login'
    post 'auth/login_simple', to: 'auth#login_simple'
    post 'auth/logout', to: 'auth#logout'
    get 'auth/me', to: 'auth#me'
    post 'auth/create_test_user', to: 'auth#create_test_user'
    post 'auth/register', to: 'auth#register'
    get 'oauth/google_oauth_url', to: 'public#google_oauth_url'
    get 'auth/google_oauth_callback', to: 'auth#google_oauth_callback'

    # Google Calendar integration
    scope :google_calendar do
      get    'status',      to: 'google_calendar#status'
      get    'oauth_url',   to: 'google_calendar#oauth_url'
      get    'callback',    to: 'google_calendar#callback'
      delete 'disconnect',  to: 'google_calendar#disconnect'
      post   'sync',        to: 'google_calendar#sync'
    end
    
    resources :transactions, only: %i[index show create update destroy] do
      collection do
        get :test
        get :public_test
        get :check_recurrence_expiry
        post :extend_recurrence
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
    resources :contacts, only: %i[index show create update destroy]
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
    resource :account_settings, only: %i[show update]
    
    # WhatsApp Configuration
    resource :whatsapp_config, only: %i[show create update] do
      member do
        get :check_connection
      end
    end
    
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
    
    # Subscriptions routes
    resources :subscriptions, only: %i[index] do
      collection do
        get :plans
        post :create_checkout
        get :billing_portal
        post :cancel
        post :reactivate
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
    
    # Support/Impersonation
    post 'admin/stop_impersonating', to: 'admin#stop_impersonating'
    
    # Subscriptions management
    get 'admin/subscriptions', to: 'admin#subscriptions'
    get 'admin/subscriptions/:id', to: 'admin#subscription_details'
    post 'admin/subscriptions', to: 'admin#create_subscription'
    patch 'admin/subscriptions/:id', to: 'admin#update_subscription'
    post 'admin/subscriptions/:id/cancel', to: 'admin#cancel_subscription'
    post 'admin/subscriptions/:id/reactivate', to: 'admin#reactivate_subscription'
  end
end
