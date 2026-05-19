# frozen_string_literal: true

# == Schema Information
#
# Table name: people
#
#  id                                                       :bigint           not null, primary key
#  birth_date                                               :date
#  cell_phone_number                                        :string
#  cert_password(Senha do Certificado Digital)              :string
#  contact_type_cd                                          :integer          default(0), not null
#  description                                              :text
#  discarded_at                                             :datetime
#  document_1                                               :string
#  document_2                                               :string
#  document_3(Inscrição Municial (PJ) / CNH (PF))           :string
#  email                                                    :string
#  first_name                                               :string           not null
#  is_demo                                                  :boolean          default(FALSE), not null
#  last_name                                                :string
#  person_type_cd                                           :integer          default(0), not null
#  phone_number                                             :string
#  screen_name(Nome fantasia para PJ / Nome social para PF) :string
#  type                                                     :string           not null
#  created_at                                               :datetime         not null
#  updated_at                                               :datetime         not null
#  account_id                                               :bigint
#  cnae_id                                                  :bigint
#  created_by_id                                            :bigint
#  sector_activity_id                                       :bigint
#  updated_by_id                                            :bigint
#
# Indexes
#
#  index_people_on_account_id                                   (account_id)
#  index_people_on_account_id_and_contact_type_cd               (account_id,contact_type_cd)
#  index_people_on_account_id_and_type_and_discarded_at         (account_id,type,discarded_at)
#  index_people_on_cnae_id                                      (cnae_id)
#  index_people_on_contact_type_cd                              (contact_type_cd)
#  index_people_on_created_by_id                                (created_by_id)
#  index_people_on_discarded_at                                 (discarded_at)
#  index_people_on_discarded_at_and_type_and_account_id_and_id  (discarded_at,type,account_id,id)
#  index_people_on_id_and_type                                  (id,type)
#  index_people_on_person_type_cd                               (person_type_cd)
#  index_people_on_sector_activity_id                           (sector_activity_id)
#  index_people_on_tsv_body                                     (tsv_body) USING gin
#  index_people_on_type                                         (type)
#  index_people_on_updated_by_id                                (updated_by_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (cnae_id => enums.id)
#  fk_rails_...  (created_by_id => users.id)
#  fk_rails_...  (sector_activity_id => segments.id)
#  fk_rails_...  (updated_by_id => users.id)
#
require 'test_helper'

class ContactTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    # Flipper.enable(:api, @account)

    @contact = create_contact(@account)
    @webhook = create_webhook(@account)
  end

  test 'should list 4 contacts' do
    contact1 = create_contact(@account)
    contact2 = create_contact(@account)
    contact3 = create_contact(@account)

    assert_equal 4, @account.contacts.count
    assert_equal [@contact.id, contact1.id, contact2.id, contact3.id], @account.contacts.order(:created_at).pluck(:id)
  end

  test 'should search one contact by name' do
    contact1 = create_contact(@account)

    assert_equal 1, @account.contacts.search_by_q(contact1.name).count
    assert_equal [contact1.id], @account.contacts.search_by_q(contact1.name).order(:created_at).pluck(:id)
  end

  test 'should create a contact' do
    name = Faker::Name.name
    birth_date = Faker::Date.birthday(min_age: 18, max_age: 65)
    description = Faker::Lorem.paragraph
    contact_type = :undefined_contact
    document_1 = Faker::IdNumber.brazilian_citizen_number
    document_2 = Faker::IdNumber.brazilian_citizen_number
    phone_number = Faker::PhoneNumber.phone_number

    contact = @account.contacts.create!(
      name:, birth_date:, contact_type:, document_1:, document_2:, phone_number:, description:
    )

    assert contact.persisted?
    assert_equal name, contact.name
    assert_equal description, contact.description
    assert_equal 2, @account.contacts.count
  end

  test 'should update a contact' do
    name = Faker::Name.name
    birth_date = Faker::Date.birthday(min_age: 18, max_age: 65)
    description = Faker::Lorem.paragraph
    document_1 = Faker::IdNumber.brazilian_citizen_number
    document_2 = Faker::IdNumber.brazilian_citizen_number
    phone_number = Faker::PhoneNumber.phone_number
    contact_type = :customer

    @contact.update(name:, birth_date:, contact_type:, document_1:, document_2:, phone_number:, description:)
    @contact.reload

    assert @contact.persisted?
    assert_equal name, @contact.name
    assert_equal description, @contact.description
    assert_equal birth_date, @contact.birth_date
    assert_equal contact_type, @contact.contact_type
    assert_equal document_1, @contact.document_1
    assert_equal document_2, @contact.document_2
    assert_equal phone_number, @contact.phone_number
    assert_equal 1, @account.contacts.count
  end

  test 'should discard a contact' do
    @contact.discard!

    assert @contact.discarded?
    assert_equal 0, @account.contacts.count
  end

  test 'should find a contact by id' do
    contact = Contact.find(@contact.id)
    assert_equal @contact.name, contact.name
    assert_equal @contact.description, contact.description
  end

  test 'should not create an invalid contact' do
    contact = Contact.create(account: @account, name: nil)
    assert_not contact.persisted?
    assert_not contact.valid?
    assert_equal ['não pode ficar em branco', 'é muito curto (mínimo: 2 caracteres)'], contact.errors[:name]
  end


  test 'should deliver webhook when contact is created' do
    assert_enqueued_with(job: WebhookDeliverJob, queue: 'webhooks') do
      create_contact(@account)
    end
  end

  test 'should deliver webhook when contact is updated' do
    assert_enqueued_with(job: WebhookDeliverJob, queue: 'webhooks') do
      @contact.update(name: 'test')
    end
  end

  test 'should deliver webhook when contact is deleted' do
    assert_enqueued_with(job: WebhookDeliverJob, queue: 'webhooks') do
      @contact.discard
    end
  end
end
