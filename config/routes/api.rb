# frozen_string_literal: true

namespace :api, defaults: { format: 'json' } do
  namespace :v1 do
    # Public routes (sem autenticação)
    get 'health', to: 'public#health_check'
    get 'transactions_test', to: 'public#transactions_test'
    
    # Auth routes
    post 'auth/login', to: 'auth#login'
    post 'auth/login_simple', to: 'auth#login_simple'
    post 'auth/logout', to: 'auth#logout'
    get 'auth/me', to: 'auth#me'
    post 'auth/create_test_user', to: 'auth#create_test_user'
    get 'oauth/google_oauth_url', to: 'public#google_oauth_url'
    get 'auth/google_oauth_callback', to: 'auth#google_oauth_callback'
    
    resources :transactions, only: %i[index show create update destroy] do
      collection do
        get :test
        get :public_test
      end
    end
    resources :contacts, only: %i[index show create update destroy]
    resources :categories, only: %i[index show create update destroy]
    resources :cost_centers, only: %i[index show create update destroy]
    resources :bank_accounts, only: %i[index show create update destroy] do
      member do
        get :transactions
      end
      collection do
        get :balance
      end
    end
    resources :users, only: %i[index show update]
    
    # Dashboard routes
    get 'dashboard', to: 'dashboard#index'
    get 'dashboard/recent_transactions', to: 'dashboard#recent_transactions'
    get 'dashboard/statistics', to: 'dashboard#statistics'
  end
end
