# frozen_string_literal: true

module Page
  class PaginatorComponent < ApplicationComponent
    include Pagy::Frontend

    def initialize(paginator:, options: {})
      @paginator = paginator
      @options = options
      super
    end
  end
end
