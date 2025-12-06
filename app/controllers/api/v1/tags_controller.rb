# frozen_string_literal: true

module Api
  module V1
    class TagsController < ApplicationController
      def index
        tags = Current.account.transactions.tag_counts_on(:tags).order(:name)
        
        render json: {
          tags: tags.map { |tag| { id: tag.id, name: tag.name } }
        }
      end
    end
  end
end

