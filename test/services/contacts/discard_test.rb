# frozen_string_literal: true

require 'test_helper'

module Contacts
  class DiscardTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @contact = create_contact @account
    end

    test 'should discard a contact with service' do
      result = Contacts::Discard.call(contact: @contact)

      assert result.success?
      assert result.contact.discarded?
      assert_equal 0, @account.contacts.count
    end

    test 'should discard a contact with no service' do
      result = Contacts::Discard.call(contact: @contact)

      assert result.success?
      assert result.contact.discarded?
      assert_equal 0, @account.contacts.count
    end

    test 'should find a contact by id' do
      contact = Contact.find(@contact.id)
      assert_equal @contact.name, contact.name
      assert_equal @contact.description, contact.description
    end
  end
end

