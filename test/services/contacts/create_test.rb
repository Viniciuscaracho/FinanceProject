# frozen_string_literal: true

require 'test_helper'

module Contacts
  class CreateTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @contact = create_contact @account
      @contact_params = {
        name: Faker::Lorem.sentence,
        description: Faker::Lorem.paragraph
      }
    end

    test 'should create a contact' do
      result = Contacts::Create.call(account: @account, contact_params: @contact_params)

      assert result.success?
      assert_equal 0, result.contact.errors.count
      assert_equal @contact_params[:name], result.contact.name
      assert_equal @contact_params[:description], result.contact.description
      assert_equal 2, @account.contacts.count
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

    test 'should not create an invalid contact' do
      contact = Contact.create(
        account: @account,
        name: nil,
        description: Faker::Lorem.paragraph
      )

      assert_not contact.persisted?
      assert_not contact.valid?
      assert_equal 2, contact.errors.count
      assert_equal ['não pode ficar em branco', 'é muito curto (mínimo: 2 caracteres)'], contact.errors[:name]
    end
  end
end

