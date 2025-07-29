# frozen_string_literal: true

module ContactsHelper
  def contacts(selected_contact: nil, include_none: false)

    list = Current.account.contacts.order(:first_name, :last_name).limit(25)
    list = [selected_contact] + list if selected_contact.present? && !list.map(&:id).include?(selected_contact.id)
    list = [Current.account.contacts.new(id: -1, first_name: t('shared.not_informed'))] + list if include_none

    list
  end

  def contacts_no_pagination(selected_contact: nil, include_none: false)
    list = Current.account.contacts.order(:first_name, :last_name)
    list = [selected_contact] + list if selected_contact.present? && !list.map(&:id).include?(selected_contact.id)
    list = [Current.account.contacts.new(id: -1, first_name: t('shared.not_informed'))] + list if include_none

    list
  end

  def select_contact_data
    {
      controller: 'select-contact',
      select_contact_allow_deselect_value: true,
      select_contact_create_url_value: contacts_path,
      select_contact_search_url_value: contacts_path(format: :json),
      select_contact_search_message_value: I18n.t('shared.searching'),
      select_contact_search_min_length_message_value: I18n.t('shared.search_min_length_message'),
      select_contact_search_text_value: I18n.t('shared.search_contact_text'),
      select_contact_search_placeholder_value: I18n.t('shared.search_contact_placeholder'),
      auto_category_transaction_target: 'contact'
    }
  end
end
