# frozen_string_literal: true

module Exports
  class ContactsXlsx < ApplicationService
    def call
      account = context.account

      p = Axlsx::Package.new
      wb = p.workbook
      wb.add_worksheet(name: I18n.t('exports.contacts.title')) do |sheet|
        sheet.add_row set_header.compact
        sheet.auto_filter = 'A1:M1'
        account.contacts.includes(:addresses).order(:person_type_cd,
                                                    :first_name).find_each(batch_size: 100) do |contact|
          row = set_row(contact:, wb:)
          sheet.add_row(row.map { |it| it[:value] }, style: row.map { |it| it[:style] }, types: row.map do |it|
                                                                                                  it[:type]
                                                                                                end)
        end
      end
      context.data = p.to_stream
    end

    def set_header
      row = [
        I18n.t('exports.contacts.name'), # A
        I18n.t('exports.contacts.type'), # B
        I18n.t('activerecord.attributes.contact.document_1'), # C
        I18n.t('activerecord.attributes.contact.document_2'), # D
        I18n.t('activerecord.attributes.contact.email'), # E
        I18n.t('activerecord.attributes.contact.phone_number'), # F
        I18n.t('activerecord.attributes.contact.cell_phone_number'), # G
        I18n.t('activerecord.attributes.address.address_line1'), # H
        I18n.t('activerecord.attributes.address.address_line2'), # I
        I18n.t('activerecord.attributes.address.district'), # J
        I18n.t('activerecord.attributes.address.postcode'), # K
        I18n.t('activerecord.attributes.address.state'), # L
        I18n.t('activerecord.attributes.address.city'), # M
        I18n.t('activerecord.attributes.contact.description') # N
      ]
    end

    def set_row(contact:, wb:)
      format_style_name = wb.styles.add_style alignment: { horizontal: :left, vertical: :center }
      default_style = wb.styles.add_style alignment: { horizontal: :center, vertical: :center }
      description_style = wb.styles.add_style alignment: { vertical: :center, wrap_text: true }

      row = [
        { value: contact.name,                                          type: :string, style: format_style_name }, # A
        { value: I18n.t("enums.person_type.#{contact.person_type}"),    type: :string, style: default_style }, # B
        { value: contact.document_1,                                    type: :string, style: default_style }, # C
        { value: contact.document_2,                                    type: :string, style: default_style }, # D
        { value: contact.email,                                         type: :string, style: default_style }, # E
        { value: contact.phone_number,                                  type: :string, style: default_style }, # F
        { value: contact.cell_phone_number,                             type: :string, style: default_style }, # G
        { value: contact.addresses.first&.address_line1,                type: :string, style: default_style }, # H
        { value: contact.addresses.first&.address_line2,                type: :string, style: default_style }, # I
        { value: contact.addresses.first&.district,                     type: :string, style: default_style }, # J
        { value: contact.addresses.first&.postcode,                     type: :string, style: default_style }, # K
        { value: contact.addresses.first&.state,                        type: :string, style: default_style }, # L
        { value: contact.addresses.first&.city,                         type: :string, style: default_style }, # M
        { value: contact.description,                                   type: :string, style: description_style } # N
      ]
    end
  end
end
