# frozen_string_literal: true

module Api
  module V1
    class AthleteController < ApplicationController
      def setup
        account = Current.account
        user    = Current.user

        contact = find_or_create_self_contact(account, user)

        unless contact.persisted?
          return render json: { errors: contact.errors.full_messages }, status: :unprocessable_entity
        end

        account.account_type = :personal
        account.preferences  = (account.preferences || {}).merge('self_contact_id' => contact.id)
        account.save!

        render json: { contact_id: contact.id, account_type: 'personal' }
      end

      def self_contact
        account = Current.account

        unless account.personal?
          return render json: { error: 'Conta não é do tipo atleta' }, status: :unprocessable_entity
        end

        contact_id = account.preferences&.dig('self_contact_id')
        return render json: { error: 'Self-contact não encontrado' }, status: :not_found unless contact_id

        contact = Current.account.contacts.find_by(id: contact_id)
        return render json: { error: 'Self-contact não encontrado' }, status: :not_found unless contact

        render json: { contact_id: contact.id, name: contact.name }
      end

      private

      def dev_reset
        raise ActionController::RoutingError, 'Not Found' unless Rails.env.development?

        account = Current.account
        contact_id = account.preferences&.dig('self_contact_id')
        Contact.find_by(id: contact_id)&.destroy if contact_id

        account.account_type = :business
        account.preferences  = (account.preferences || {}).except('self_contact_id')
        account.save!

        render json: { reset: true }
      end

      def find_or_create_self_contact(account, user)
        existing_id = account.preferences&.dig('self_contact_id')
        if existing_id
          existing = account.contacts.find_by(id: existing_id)
          return existing if existing
        end

        account.contacts.create(
          first_name:   user.first_name.presence || user.name.split(' ').first,
          last_name:    user.last_name.presence  || user.name.split(' ')[1..].join(' '),
          email:        user.email,
          phone_number: user.phone_number,
          contact_type: :customer
        )
      end
    end
  end
end
