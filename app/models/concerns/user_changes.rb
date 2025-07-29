# frozen_string_literal: true

module UserChanges
  extend ActiveSupport::Concern

  included do
    belongs_to :created_by, class_name: 'User', optional: true
    belongs_to :updated_by, class_name: 'User', optional: true

    before_create :set_created_by, if: :current_user_present?
    before_update :set_updated_by, if: :current_user_present?
  end

  private

  def set_created_by
    self.created_by = Current.user
    self.updated_by = created_by
  end

  def set_updated_by
    self.updated_by = Current.user
  end

  def current_user_present?
    Current.user.present?
  end
end
