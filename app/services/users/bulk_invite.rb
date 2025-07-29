module Users
  class BulkInvite < ApplicationService
    include ActionView::Helpers::NumberHelper

    COLUMN_NAMES = {
      FIRST_NAME: 0,
      LAST_NAME: 1,
      EMAIL: 2,
      PHONE_NUMBER: 3,
      POSTCODE: 4,
      CONTACT_ME_BY: 5,
      ZP_USER: 6,
      LEAD_CODE: 7
    }.freeze

    def call
      file = context.file
      users = []

      # Abre o arquivo da planilha
      workbook = SimpleXlsxReader.open(file)
      worksheet = workbook.sheets.first

      # Para cara items da planilha
      worksheet.rows.each_with_index do |row, index|
        next if index.zero?

        users << invite_user(row:)
      end
    end

    private

    def extract_first_name(row:)
      titleize(row[COLUMN_NAMES[:FIRST_NAME]])
    end

    def extract_last_name(row:)
      titleize(row[COLUMN_NAMES[:LAST_NAME]])
    end

    def extract_email(row:)
      strip_email(row[COLUMN_NAMES[:EMAIL]])
    end

    def extract_phone_number(row:)
      strip(row[COLUMN_NAMES[:PHONE_NUMBER]])
    end

    def extract_postcode(row:)
      strip(row[COLUMN_NAMES[:POSTCODE]])
    end

    def extract_contact_me_by(row:)
      underscore(row[COLUMN_NAMES[:CONTACT_ME_BY]])
    end

    def zp_user?(row:)
      val = strip(row[COLUMN_NAMES[:ZP_USER]])
      return false if val.blank?

      val == 'Sim'
    end

    def extract_lead_code(row:)
      val = strip(row[COLUMN_NAMES[:LEAD_CODE]])
      return nil if val.blank?

      val.to_i
    end

    def titleize(value)
      val = value.to_s.strip.titleize
      return nil if val.blank?

      val
    end

    def humanize(value)
      val = value.to_s.strip.humanize
      return nil if val.blank?

      val
    end

    def underscore(value)
      val = value.to_s.strip.underscore
      return nil if val.blank?

      val
    end

    def strip_email(value)
      val = value.to_s.strip.downcase
      return nil if val.blank?

      val
    end

    def strip(value)
      val = value.to_s.strip
      return nil if val.blank?

      val
    end

    def invite_user(row:)
      email = extract_email(row:)
      return User.find_by!(email:) if User.where(email:).exists?

      User.invite!(invite_params(row:, email:))
    end

    def invite_params(row:, email:)
      {
        email:,
        first_name: extract_first_name(row:),
        last_name: extract_last_name(row:),
        phone_number: extract_phone_number(row:),
        postcode: extract_postcode(row:),
        contact_me_by: extract_contact_me_by(row:),
        zp_user: zp_user?(row:),
        lead_code: extract_lead_code(row:)
      }
    end
  end
end
