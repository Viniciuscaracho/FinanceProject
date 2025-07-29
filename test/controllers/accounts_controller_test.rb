require 'test_helper'
class AccountsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    sign_in(@user)
  end


  test 'should get index' do
    get accounts_url
    assert_response :success
  end

  test 'should get new' do
    get new_account_url(@account)
    assert_response :success
  end

  test 'should create a account' do
    post accounts_path, params: {
      account: {
        default_currency: 'BRL',
        country_code: Faker::Address.country_code,
        processor_plan_id: 1,
        company_attributes: {
          document_1: Faker::Company.brazilian_company_number,
          document_3: '123123123',
          name: Faker::Company.name,
          screen_name: Faker::Twitter.screen_name,
          email: Faker::Internet.email,
          addresses_attributes: [
            {
              country: Faker::Address.country,
              state: Faker::Address.state,
              city: 'Dois Vizinhos',
              district: 'Centro',
              address_line1: Faker::Address.street_address,
              address_line2: Faker::Address.secondary_address,
              address_number: Faker::Address.building_number,
              postcode: '85660000'
            }
          ],
          nfse_config_attributes: {}
        }
      }
    }
    assert_redirected_to accounts_url
  end

  test 'should not create account without name' do
    assert_no_difference('Account.count') do
      post accounts_path, params: {
        account: {
          default_currency: 'USD',
          country_code: Faker::Address.country_code,
          processor_plan_id: 1,
          company_attributes: {
            screen_name: Faker::Twitter.screen_name,
            addresses_attributes: [
              {
                country: Faker::Address.country,
                state: Faker::Address.state
              }
            ],
            nfse_config_attributes: {}
          }
        }
      }
    end
    assert_response :unprocessable_entity
  end

  test 'should update a account' do
    assert_not_nil @account.id
    patch account_url(@account), params: {
      account: {
        default_currency: "BRL"
      }
    }
    @account.reload
    assert_equal "BRL", @account.default_currency
    assert_redirected_to accounts_url
  end


  test 'should get edit account' do
    get edit_account_url(@account)
    assert_response :success
  end

  test 'should reset a account' do
    patch reset_account_path(@account)
    assert_redirected_to root_path
  end

  test 'should delete a account' do
    get confirm_destroy_account_url(@account)
    assert_response :success
    assert_difference('Account.count', -1) do
      delete account_url(@account)
    end
    assert_redirected_to accounts_url
  end
end