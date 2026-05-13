# frozen_string_literal: true

root 'home#index'

# API Routes
namespace :api do
  namespace :v1 do
    resources :transactions, only: [:index, :show, :create, :update, :destroy]
    resources :contacts, only: [:index, :show, :create, :update, :destroy]
    resources :categories, only: [:index, :show, :create, :update, :destroy]
    resources :cost_centers, only: [:index, :show, :create, :update, :destroy]
    resources :bank_accounts, only: [:index, :show, :create, :update, :destroy]
    resources :reports, only: [:index, :show]
    resources :users, only: [:index, :show, :update]
    
    # Dashboard data
    get 'dashboard', to: 'dashboard#index'
    get 'dashboard/recent_transactions', to: 'dashboard#recent_transactions'
    get 'dashboard/statistics', to: 'dashboard#statistics'
    
    # Authentication
    post 'auth/login', to: 'auth#login'
    post 'auth/login_simple', to: 'auth#login_simple'
    post 'auth/firebase_login', to: 'auth#firebase_login'
    post 'auth/supabase_login', to: 'auth#supabase_login'
    get 'auth/me', to: 'auth#me'
    post 'auth/logout', to: 'auth#logout'

  end
end

# Error pages
get '/404', to: 'errors#not_found'
get '/422', to: 'errors#unprocessable'
get '/500', to: 'errors#internal_error'
get '/403', to: 'errors#access_forbidden'
get '/access_forbidden', to: 'errors#access_forbidden'

# OAuth callback route for React frontend
get '/oauth/callback', to: 'application#oauth_callback'

# Public appointment booking routes (no authentication required)
get '/agendar/:token', to: 'public/appointment_booking#show', as: :public_appointment_booking
post '/agendar/:token/book', to: 'public/appointment_booking#create', as: :public_appointment_booking_create
get '/agendamento/sucesso', to: 'public/appointment_booking#success', as: :appointment_booking_success

# Client appointment self-management (cancel / reschedule)
get  '/agendar/gerenciar/:manage_token',            to: 'public/appointment_manage#show',      as: :appointment_manage
post '/agendar/gerenciar/:manage_token/cancel',     to: 'public/appointment_manage#cancel',    as: :appointment_manage_cancel
post '/agendar/gerenciar/:manage_token/reschedule', to: 'public/appointment_manage#reschedule', as: :appointment_manage_reschedule

unauthenticated :user do
  get '/users', to: redirect('/users/sign_up')
end

authenticated :user, ->(u) { Rails.env.development? || u.admin? } do
  require 'sidekiq/web'
  require 'sidekiq-scheduler/web'

  mount RailsAdmin::Engine => '/admin', as: :rails_admin
  mount Sidekiq::Web => '/sidekiq'
  # Linha do Flipper removida

  resources :contracts
  get '/users/sign_out', to: redirect('/')

  # Endpoints for users (just BarberManagement admin)
  resources :users, only: %i[index new edit destroy update] do
    collection do
      get :new_bulk_invitation
      post :create_invite
      post :bulk_invitation
      post :stop_impersonating
    end

    member do
      post :impersonate
      patch :update_invite
      put :update_invite
      patch :resend_invitation
      put :resend_invitation
    end
  end
end

# Webhooks
namespace :webhooks do
  post '/stripe', to: 'stripe#create'
  post '/pluggy/account/:id', to: 'pluggy#update', as: :pluggy_account
end

# Billing portal sessions
resources :billing_portal_sessions, only: [:create]
resources :checkout_portal_sessions, only: %i[new create] do
  collection do
    get :success
  end
end

# Multisearch endpoint
resources :multisearches, only: %i[index] do
  collection do
    get :transactions
    get :contacts
    get :categories
    get :cost_centers
    get :attachments
    get :transaction_actions
  end
end

# Referral Codes
resources :referral_codes, only: %i[index destroy]
get 'r/:id', to: 'referral_codes#show', as: :short_referral_code

# Home endpoints
get '/home/revenues', to: 'home#revenues'
get '/home/expenses', to: 'home#expenses'
get '/home/chart', to: 'home#chart'
get '/home/dre', to: 'home#dre'
get '/home/outcome', to: 'home#outcome'
get '/home/calendar', to: 'home#calendar'
get '/home/calendar_transactions', to: 'home#calendar_transactions'
get '/home/due_today_payments', to: 'home#due_today_payments'
get '/home/due_today_payment_modal', to: 'home#due_today_payment_modal'
patch '/home/toggle_transaction', to: 'home#toggle_transaction'
get '/home/delayed_payments', to: 'home#delayed_payments'
get '/home/delayed_payment_modal', to: 'home#delayed_payment_modal'
get '/home/account', to: 'home#account'
get '/home/bank_account_balance', to: 'home#bank_account_balance'
get '/home/last_transactions_audits', to: 'home#last_transactions_audits'
get '/home/transactions_audits', to: 'home#transactions_audits'
get '/home/transactions_audits_modal', to: 'home#transactions_audits_modal'
get '/home/storage', to: 'home#storage'

get '/home/comparative', to: 'home#comparative'
# Reports endpoints
resources :reports, only: %i[index] do
  collection do
    post :export
    post :index
    get :dre
    get :description
    get :period
    get :transaction_type
    get :category
    get :cost_center
    get :contact
    get :financial_history
    get :history_expenses_per_type
    get :history_per_category
    post :tags
    get :tags
    get :extract
    get :payment_method
    get :transactions_per_payment_method
    get :transactions_per_category
    get :transactions_per_cost_center
    get :transactions_per_contact
    get :transactions_per_tag
    get :categories_per_transaction_type
    get :transactions_per_transaction_type_and_category
    get :comparative
    get :print_config
    put :update_print_config
  end
end

# Resources
resources :account_invitations do
  member do
    put 'accept'
    delete 'reject'
  end
end
resources :transactions do
  resources :attachments, only: %i[index new create destroy], on: :member, module: :transactions
  member do
    get :details
    patch :toggle
    put :toggle
    patch :duplicate
    put :duplicate
    get :move_to
    get :setup_installments
    get :setup_recurrence
    put :create_installments
    patch :create_installments
    put :create_recurrence
    patch :create_recurrence
    get :change_installments
    get :destroy_dialog
    get :edit_amount_details
    put :update_amount_details
    patch :update_due_date
    patch :update_amount_details
    get :transaction_actions
  end
  collection do
    get :add
    get :totalizer
    get :chart
    get :outcome
    get :revenues
    get :expenses
    get :balance
    get :pagination
    put :sum
    delete :bulk_destroy
    get :bulk_move_to_options
    put :bulk_move_to
    get :bulk_update_options
    put :bulk_update
    put :bulk_mark_as_paid
    put :bulk_duplicate
    get :details_expenses
    get :category_by_contact
  end
end

resources :account_settings, only: %i[update edit] do
  patch :reset
end

resources :bank_accounts do
  member do
    put :archive
    patch :archive

    put :unarchive
    patch :unarchive

    put :turn_default
    patch :turn_default
  end
end
resources :categories do
  collection do
    get :new_import_from_presets
    post :import_selected_presets
  end
end
resources :category_presets, only: %i[index] do
  collection do
    post :import
  end
end
resources :cost_centers
resources :contacts do
  resources :attachments, only: %i[index new create destroy], on: :member, module: :contacts
  resources :contracts, on: :member, module: :contacts do
    collection do
      get :replace
    end
  end
  collection do
    get :i_debt
    get :debt_me
    get :birthdays
    get :search_cnpj
  end
  member do
    get :search_cnpj
  end
end
resources :imports do
  collection do
    get :new_xlsx_default
    get :new_xlsx_contacts
    get :discarded_imports_modal
  end

  member do
    put :discard
    patch :discard
    put :undiscard
    patch :undiscard
  end
end
resources :exports, only: %i[new create destroy] do
  collection do
    post :backup_xlsx
    post :contacts_xlsx
  end
end
resources :account_users do
  member do
    get :edit_permissions
    patch :update_permissions
    put :update_permissions
  end
end

resources :help_users do
  collection do
    get :videos_modal
    get :initial_modal
    get :search_modal
  end
end
post '/save_checkbox_state', to: 'help_users#save_checkbox_state', as: :save_checkbox_state

resources :feedbacks

resources :hide_amount do
  collection do
    patch :toggle_visible
  end
end

resources :collapsed_menu, only: %i[update] do
  collection do
    patch :toggle_sidenav
  end
end

resources :static_totalizer, only: %i[update] do
  collection do
    patch :toggle
  end
end

resources :notifications, only: %i[index destroy] do
  collection do
    get :delayed_payments_modal
    get :without_category_modal
    get :count
    put :dismiss_all
  end
end
resources :imports
resources :accounts do
  member do
    get :confirm_destroy

    get :edit_logo
    put :update_logo

    put :reset
    patch :reset

    get :edit_nfse_config
    put :update_nfse_config
    patch :update_nfse_config

    get :edit_invoice_config
    put :update_invoice_config
    patch :update_invoice_config
  end
end
resources :locations, only: %i[index]
resources :statements do
  member do
    put :finish
  end

  resources :statement_items, on: :member, module: :statements do
    member do
      get :find_transaction
      get :search_transactions
      put :select_transaction
      put :confirm
      put :ignore
      put :reset
      put :new_one
    end
    collection do
      put :bulk_confirm
      put :bulk_ignore
    end
  end
end

resources :modal, only: %i[index] do
  collection do
    get :print
  end
end

namespace :acts_as_taggable_on, path: 'tags' do
  resources :tags, path: ''
end

resources :calculator, only: %i[index]

resources :payment_plans, only: %i[new edit create update]

resources :announcements, only: %i[index show] do
  member do
    put :dismiss
  end
end

resources :receipt_templates do
  collection do
    get :variable
  end
  member do
    put :reset_default
  end
end

resources :contract_templates, only: %i[index edit new create update destroy] do
  collection do
    get :variable
  end
  member do
    put :reset_default
  end
end

resources :contracts, only: %i[new create edit update destroy] do
end

resources :invoice_templates do
  member do
    get :preview
  end
end

resources :document_templates, only: %i[index new create update destroy] do
  collection do
    post :content
  end
end

resources :receipts, only: %i[new]

resources :invoices do
  resources :attachments, only: %i[index new create destroy], on: :member, module: :invoices
  collection do
    get :filter
    get :totalizer
  end
  member do
    get :preview
    get :download
    get :duplicate
    get :invoice_actions
  end
end

resources :api_tokens do

end

resources :services do
  member do
    get :duplicate
  end
  collection do
    get :autocomplete
  end
end

resources :cities, only: %i[index] do
  collection do
    get :autocomplete
  end
end

resources :contracts

# User settings
get '/user_settings/edit' => 'user_settings#edit'
put '/user_settings' => 'user_settings#update'
patch '/user_settings' => 'user_settings#update'
get '/user_settings/switch_account' => 'user_settings#switch_account'
put '/user_settings/update_current_account' => 'user_settings#update_current_account'

# Static
scope controller: :static do
  get :about
  get :terms
  get :privacy
end

# Integrations
namespace :integrations do
  # Pluggy
  get '/pluggy/status', to: 'pluggy#status'
  get '/pluggy/connect_token', to: 'pluggy#connect_token'

  # this is for testing purposes only
  get '/pluggy/test_login', to: 'pluggy#test_login' unless Rails.env.production?
end

# resources :integration_stores do
#   resources :nuvem_fiscal, module: :integration_stores
#   resources :pluggy, module: :integration_stores
# end

# resources :integration_stores do
#   resource :nuvem_fiscal
#   resource :pluggy
# end

resources :integration_stores do
  resources :nuvem_fiscal, on: :member, module: :integration_stores
  resources :pluggy, on: :member, module: :integration_stores
end
