# frozen_string_literal: true

module Reports
  module Exports
    class Export < ApplicationService
      def call

        result = case context.params.fetch(:report_type, :extract)
                 when :dre
                   Reports::Exports::Dre.call(
                     params: context.params,
                     account: context.account
                   )

                 when :extract
                   Reports::Exports::Extract.call(
                     params: context.params,
                     account: context.account
                   )

                 end

        context.data = result.data

      end
    end
  end
end
