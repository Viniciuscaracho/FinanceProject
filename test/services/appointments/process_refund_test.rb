# frozen_string_literal: true

require 'test_helper'

module Appointments
  class ProcessRefundTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @bank_account = create_bank_account(@account)
      @account_user = @account.account_users.first
      
      # Configurar horário de trabalho
      @account_user.update!(
        schedule: {
          'monday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
          'tuesday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
          'wednesday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
          'thursday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
          'friday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 }
        }
      )
      
      @service = create_service(@account)
      @contact = create_contact(@account)
      
      # Criar agendamento amanhã às 10h
      tomorrow = Time.current + 1.day
      start_time = tomorrow.beginning_of_day + 10.hours
      
      @appointment = @account.appointments.create!(
        account_user: @account_user,
        service: @service,
        contact: @contact,
        start_time: start_time,
        end_time: start_time + 1.hour,
        price_cents: 10000,
        whatsapp_number: "5511999999999",
        status: :confirmed,
        payment_status: :paid,
        stripe_payment_intent_id: "pi_test_123"
      )
    end

    test "should process refund for paid appointment with stripe payment intent" do
      # Mock do Stripe
      payment_intent_mock = OpenStruct.new(
        id: "pi_test_123",
        status: "succeeded",
        charges: OpenStruct.new(
          data: [
            OpenStruct.new(id: "ch_test_123", refunded: false)
          ]
        )
      )

      refund_mock = OpenStruct.new(id: "re_test_123")

      ::Stripe::PaymentIntent.stubs(:retrieve).returns(payment_intent_mock)
      ::Stripe::Refund.stubs(:create).returns(refund_mock)
      BarberManagement::Stripe::Client.stubs(:configured?).returns(true)
      BarberManagement::Stripe::Client.stubs(:with_api_key).yields
      
      result = ProcessRefund.call(appointment: @appointment)
      
      assert result.success?
      assert_equal "re_test_123", result.refund_id
      assert_equal :refunded, @appointment.reload.payment_status
    end

    test "should not process refund if appointment is not paid" do
      @appointment.update(payment_status: :pending)
      
      result = ProcessRefund.call(appointment: @appointment)
      
      # Deve retornar success mas não processar nada
      assert result.success?
      assert_equal :pending, @appointment.reload.payment_status
    end

    test "should not process refund if no stripe payment intent" do
      @appointment.update(stripe_payment_intent_id: nil)
      
      result = ProcessRefund.call(appointment: @appointment)
      
      assert result.success?
      assert_equal :paid, @appointment.reload.payment_status
    end

    test "should handle already refunded payment intent" do
      payment_intent_mock = OpenStruct.new(
        id: "pi_test_123",
        status: "refunded",
        charges: OpenStruct.new(
          data: [
            OpenStruct.new(id: "ch_test_123", refunded: true)
          ]
        )
      )

      ::Stripe::PaymentIntent.stubs(:retrieve).returns(payment_intent_mock)
      BarberManagement::Stripe::Client.stubs(:configured?).returns(true)
      BarberManagement::Stripe::Client.stubs(:with_api_key).yields
      
      result = ProcessRefund.call(appointment: @appointment)
      
      assert result.success?
      assert_equal "already_refunded", result.refund_id
    end

    test "should handle stripe configuration missing" do
      BarberManagement::Stripe::Client.stubs(:configured?).returns(false)
      
      result = ProcessRefund.call(appointment: @appointment)
      
      assert_not result.success?
      assert_includes result.message, "Stripe não está configurado"
    end
  end
end

