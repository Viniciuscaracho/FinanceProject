module Companies
  module NaturalPerson
    extend ActiveSupport::Concern

    included do
      # Accept the terms of service on registration
      attribute :name_natural
      attribute :screen_name_natural
      attribute :document_1_natural
      attribute :document_2_natural

      validates :name_natural, presence: true, on: %i[update], if: :natural?

      before_validation :set_company_attrs, on: %i[update], if: :natural?
      after_initialize :set_natural_attrs, if: :natural?
    end

    def set_natural_attrs
      self.name_natural = name
      self.document_1_natural = document_1
      self.document_2_natural = document_2
      self.screen_name_natural = screen_name
    end

    def set_company_attrs
      self.name = name_natural.presence || name
      self.document_1 = document_1_natural.presence || document_1
      self.document_2 = document_2_natural.presence || document_2
      self.screen_name = screen_name_natural.presence || screen_name
    end
  end
end
