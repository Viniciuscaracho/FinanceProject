# frozen_string_literal: true

require 'test_helper'

module Contacts
  class UpdateTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @contact = create_contact @account
      @contact_params = {
        name: Faker::Lorem.sentence,
        description: Faker::Lorem.paragraph
      }
    end

    test 'should update a contact with service' do
      result = Contacts::Update.call(contact: @contact, contact_params: @contact_params)
      assert_enqueued_jobs 1, only: UpdateTransactionsTsvBodyJob
      perform_enqueued_jobs only: UpdateTransactionsTsvBodyJob

      @contact.reload

      assert result.success?
      assert_equal @contact, result.contact
      assert_equal @contact_params[:name], @contact.name
      assert_equal @contact_params[:description], @contact.description
    end

    test 'should update a contact' do
      name = Faker::Lorem.sentence
      description = Faker::Lorem.paragraph

      @contact.update(name:, description:)

      assert @contact.persisted?
      assert_equal 0, @contact.errors.count
      assert_equal name, @contact.name
      assert_equal description, @contact.description
    end

    test 'should discard a contact' do
      @contact.discard!

      assert @contact.discarded?
      assert_equal 0, @account.categories.count
    end

    test 'should find a contact by id' do
      contact = Contact.find(@contact.id)
      assert_equal @contact.name, contact.name
      assert_equal @contact.description, contact.description
    end
  end
end

