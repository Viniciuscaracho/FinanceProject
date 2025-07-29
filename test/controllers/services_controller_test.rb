# frozen_string_literal: true

require 'test_helper'

class ServicesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @service = create_service @account
    sign_in(@user)
  end

  test 'should get index services' do
    get services_url
    assert_response :success
  end

  test 'should search services' do
    get services_url(q: @service.name)
    assert_response :success
  end

  test 'should search autocomplete services' do
    get autocomplete_services_url(q: @service.name)
    assert_response :success
  end

  test 'should get new service' do
    get new_service_url
    assert_response :success
  end

  test 'should create a service provided' do
    assert_difference('Service.count', 1) do
      post services_url,
           params: {
             service: {
               service_type: :provided,
               description: Faker::Lorem.paragraph,
               internal_code: SecureRandom.random_number(10_000),
               selling_price_cents: SecureRandom.random_number(10_000),
               name: Faker::Lorem.paragraph
             }
           }
    end

    assert_redirected_to services_url
  end

  test 'should create a service consumed' do
    assert_difference('Service.count', 1) do
      post services_url,
           params: {
             service: {
               service_type: :consumed,
               description: Faker::Lorem.paragraph,
               internal_code: SecureRandom.random_number(10_000),
               selling_price_cents: SecureRandom.random_number(10_000),
               name: Faker::Lorem.paragraph
             }
           }
    end

    assert_redirected_to services_url
  end

  test 'should get edit' do
    get edit_service_url(@service)
    assert_response :success
  end

  test 'should update service' do
    description = Faker::Lorem.paragraph
    internal_code = SecureRandom.random_number(10_000).to_s
    selling_price_cents = SecureRandom.random_number(10_000).to_i
    name = Faker::Lorem.paragraph
    patch service_url(@service),
          params: {
            service: {
              service_type: :both,
              description: description,
              internal_code: internal_code,
              selling_price_cents: selling_price_cents,
              name: name
            }
          }
    assert_redirected_to services_url
    @service.reload

    assert_equal :both, @service.service_type
    assert_equal description, @service.description
    assert_equal internal_code, @service.internal_code
    assert_equal selling_price_cents, @service.selling_price_cents
    assert_equal name, @service.name
  end

  test 'should update offer' do
    description = Faker::Lorem.paragraph
    internal_code = SecureRandom.random_number(10_000).to_s
    selling_price_cents = SecureRandom.random_number(10_000).to_i
    name = Faker::Lorem.paragraph
    patch service_url(@service),
          params: {
            service: {
              service_type: :both,
              description:,
              internal_code:,
              selling_price_cents:,
              name:
            }
          }
    assert_redirected_to services_url
    @service.reload

    assert_equal :both, @service.service_type
    assert_equal description, @service.description
    assert_equal internal_code, @service.internal_code
    assert_equal selling_price_cents, @service.selling_price_cents
    assert_equal name, @service.name
  end

  test 'should destroy offer' do
    assert_difference('Service.count', -1) do
      delete service_url(@service)
    end

    assert_redirected_to services_url
  end

  # test 'should get new service with nfse config when nfse flipper enabled' do
  #   Flipper.enable(:nfse)
  #   get new_service_url
  #   assert_response :success
  #   assert assigns(:service).nfse_config.present?
  # end

  # test 'should not get new service with nfse config when nfse flipper disabled' do
  #   Flipper.disable(:nfse)
  #   get new_service_url
  #   assert_response :success
  #   assert_nil assigns(:service).nfse_config
  # end

  # test 'should get edit service with nfse config when nfse flipper enabled and service has blank nfse config' do
  #   Flipper.enable(:nfse)
  #   @service.update(nfse_config: nil)
  #   get edit_service_url(@service)
  #   assert_response :success
  #   assert assigns(:service).nfse_config.present?
  # end

  # test 'should not get edit service with nfse config when nfse flipper disabled' do
  #   Flipper.disable(:nfse)
  #   get edit_service_url(@service)
  #   assert_response :success
  #   assert_nil assigns(:service).nfse_config
  # end

  test 'should not update service with invalid params' do
    patch service_url(@service),
          params: {
            service: {
              name: nil,
              description: 'Test Description',
              unit: 'hour',
              cost_price_cents: 1000,
              selling_price_cents: 1500,
              service_type: 'provided'
            }
          }

    assert_response :unprocessable_entity
  end
end
