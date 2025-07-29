module Documents
  module Templates
    class DocumentEditorComponent < ApplicationComponent
      include ReceiptTemplatesHelper

      renders_one :header
      renders_one :footer
      renders_one :buttons

      def initialize(actions:, default_content:, name_variables:, marks: %w[bold italic strike underline], alignments: %w[left center right justify], text_size: %w[h1 h2 h3 h4 h5])
        super
        @default_content = default_content
        @actions = actions
        @marks = marks
        @alignments = alignments
        @text_size = text_size
        @suggestions = suggestions_variables(name_variables)
      end
    end
  end
end
