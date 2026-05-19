# frozen_string_literal: true

# == Schema Information
#
# Table name: patient_documents
#
#  id            :bigint           not null, primary key
#  content       :text
#  document_type :string
#  public_token  :string           not null
#  shared        :boolean          default(FALSE), not null
#  title         :string           not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  account_id    :bigint           not null
#  contact_id    :bigint           not null
#
# Indexes
#
#  index_patient_documents_on_account_id                 (account_id)
#  index_patient_documents_on_account_id_and_contact_id  (account_id,contact_id)
#  index_patient_documents_on_contact_id                 (contact_id)
#  index_patient_documents_on_public_token               (public_token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (contact_id => people.id)
#
require 'test_helper'

class PatientDocumentTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @contact = create_contact(@account)
    ActsAsTenant.current_tenant = @account
  end

  teardown { ActsAsTenant.current_tenant = nil }

  test "valid with title and contact" do
    doc = @account.patient_documents.build(contact_id: @contact.id, title: 'Plano Alimentar')
    assert doc.valid?
  end

  test "requires title" do
    doc = @account.patient_documents.build(contact_id: @contact.id, title: '')
    assert_not doc.valid?
    assert doc.errors[:title].any?
  end

  test "requires contact_id" do
    doc = @account.patient_documents.build(title: 'Plano')
    assert_not doc.valid?
  end

  test "title max length 200" do
    doc = @account.patient_documents.build(contact_id: @contact.id, title: 'a' * 201)
    assert_not doc.valid?
  end

  test "generates unique public_token on create" do
    doc = @account.patient_documents.create!(contact_id: @contact.id, title: 'Doc A')
    assert_not_nil doc.public_token
    assert doc.public_token.length >= 16
  end

  test "public_token is unique across records" do
    doc1 = @account.patient_documents.create!(contact_id: @contact.id, title: 'Doc 1')
    doc2 = @account.patient_documents.create!(contact_id: @contact.id, title: 'Doc 2')
    assert_not_equal doc1.public_token, doc2.public_token
  end

  test "shared defaults to false" do
    doc = @account.patient_documents.create!(contact_id: @contact.id, title: 'Doc')
    assert_equal false, doc.shared
  end

  test "document_type_label returns human label" do
    doc = @account.patient_documents.build(contact_id: @contact.id, title: 'D', document_type: 'plano_alimentar')
    assert_equal 'Plano Alimentar', doc.document_type_label
  end

  test "document_type_label falls back to raw value for unknown type" do
    doc = @account.patient_documents.build(contact_id: @contact.id, title: 'D', document_type: 'custom')
    assert_equal 'custom', doc.document_type_label
  end

  test "recent scope orders by updated_at desc" do
    doc1 = @account.patient_documents.create!(contact_id: @contact.id, title: 'Old')
    doc2 = @account.patient_documents.create!(contact_id: @contact.id, title: 'New')
    doc2.touch
    scope = @account.patient_documents.recent
    assert_equal doc2.id, scope.first.id
  end

  test "for_contact scope filters by contact" do
    other = create_contact(@account)
    doc1 = @account.patient_documents.create!(contact_id: @contact.id, title: 'C1')
    doc2 = @account.patient_documents.create!(contact_id: other.id, title: 'C2')
    result = @account.patient_documents.for_contact(@contact.id)
    assert_includes result, doc1
    assert_not_includes result, doc2
  end
end
