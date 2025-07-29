# frozen_string_literal: true

# This module is responsible for grouping methods that are used to generate reports.
module Transactions
  module ReportsMethods
    extend ActiveSupport::Concern

    included do

      def self.descriptions_with_amount_to_hash
        group(:name).sum(:exchanged_amount_cents).transform_values { |v| v.to_f / 100 }
      end

      def self.contact_with_amount_to_hash
        left_joins(:contact).group('first_name', 'last_name',
                                   'contact_id').sum(:exchanged_amount_cents).transform_values do |v|
          v.to_f / 100
        end
      end

      def self.categories_with_amount_to_hash
        left_joins(:category).group('domains.name', :category_id).sum(:exchanged_amount_cents).transform_values do |v|
          v.to_f / 100
        end
      end

      def self.cost_centers_with_amount_to_hash
        left_joins(:cost_center).group('domains.name', :cost_center_id).sum(:exchanged_amount_cents).transform_values do |v|
          v.to_f / 100
        end
      end
      
      def self.tags_with_amount_to_hash
        left_joins(:tags).group('tags.name', :tag_id).sum(:exchanged_amount_cents).transform_values do |v|
          v.to_f / 100
        end
      end
      
      def self.days_with_amount_to_hash(date_type: :due_date)
        group_by_day(date_type, time_zone: false).sum(:exchanged_amount_cents)
      end

      def self.transaction_type_with_amount_to_hash
        group(:transaction_type_cd).sum(:exchanged_amount_cents).transform_values { |v| v.to_f / 100 }
      end

      def self.months_with_amount_to_hash(date_type: :due_date)
        group_by_month(date_type, time_zone: false).sum(:exchanged_amount_cents)
      end

      def self.years_with_amount_to_hash(date_type: :due_date)
        group_by_year(date_type, time_zone: false).sum(:exchanged_amount_cents)
      end

      def date_by_type(date_type: :due_date)
        if date_type == :due_date
          due_date
        else
          competency_date
        end
      end

      def self.payment_method_with_amount_to_hash
        group(:payment_method_cd).sum(:exchanged_amount_cents).transform_values { |v| v.to_f / 100 }
      end
    end
  end
end