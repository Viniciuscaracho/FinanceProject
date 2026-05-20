# frozen_string_literal: true

module Api
  module V1
    class OnboardingController < ApplicationController
      def seed_demo
        account = Current.account
        return render json: { error: 'Account not found' }, status: :forbidden unless account

        if account.contacts.where(is_demo: true).exists?
          return render json: { message: 'Demo data already exists' }, status: :ok
        end

        professional = account.account_users.first
        service      = account.services.first

        unless professional && service
          return render json: { error: 'Cadastre um serviço antes de gerar dados de exemplo' }, status: :unprocessable_entity
        end

        now = Time.current

        contacts = [
          { first_name: 'João',  last_name: 'Silva',    cell_phone_number: '(11) 98765-0001', contact_type_cd: 1 },
          { first_name: 'Maria', last_name: 'Oliveira', cell_phone_number: '(11) 98765-0002', contact_type_cd: 1 },
          { first_name: 'Pedro', last_name: 'Santos',   cell_phone_number: '(11) 98765-0003', contact_type_cd: 1 },
        ].map { |attrs| account.contacts.create!(attrs.merge(is_demo: true)) }

        [
          {
            contact:        contacts[0],
            start_time:     (now - 1.day).change(hour: 10, min: 0),
            end_time:       (now - 1.day).change(hour: 11, min: 0),
            status:         Appointment::APPOINTMENT_STATUS[:completed],
            payment_status: Appointment::PAYMENT_STATUS[:paid],
          },
          {
            contact:        contacts[1],
            start_time:     now.change(hour: 14, min: 0),
            end_time:       now.change(hour: 15, min: 0),
            status:         Appointment::APPOINTMENT_STATUS[:confirmed],
            payment_status: Appointment::PAYMENT_STATUS[:pending],
          },
          {
            contact:        contacts[2],
            start_time:     (now + 1.day).change(hour: 10, min: 0),
            end_time:       (now + 1.day).change(hour: 11, min: 0),
            status:         Appointment::APPOINTMENT_STATUS[:pending],
            payment_status: Appointment::PAYMENT_STATUS[:pending],
          },
        ].each do |attrs|
          account.appointments.create!(
            account_user:         professional,
            service:              service,
            price_cents:          service.selling_price_cents,
            additional_service_ids: [],
            is_demo:              true,
            **attrs
          )
        end

        render json: { message: 'Dados de exemplo criados com sucesso' }, status: :created
      rescue => e
        Rails.logger.error "onboarding#seed_demo: #{e.message}"
        render_internal_error(e)
      end

      def clear_demo
        account = Current.account
        return render json: { error: 'Account not found' }, status: :forbidden unless account

        account.appointments.where(is_demo: true).destroy_all
        account.contacts.where(is_demo: true).destroy_all

        render json: { message: 'Dados de exemplo removidos' }, status: :ok
      rescue => e
        Rails.logger.error "onboarding#clear_demo: #{e.message}"
        render_internal_error(e)
      end
    end
  end
end
