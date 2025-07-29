# frozen_string_literal: true

module Elements
  class ProgressBarComponent < ApplicationComponent
    include CalculationsHelper

    renders_one :header
    renders_one :footer

    # color = somente passe o nome da cor exemplo: "green-500"
    # show_percentage = mostra a porcentagem ou nao
    # class = classe extra do component
    # options = {
    #   rounded: progress bar com bordas arredondadas,
    # }
    # partial_title = titles.fetch(:partial, nil)
    # total_title = titles.fetch(:total, nil)

    # voce pode passar a porcentagem ou o total e o parcial e ele calcula a porcentagem automaticamente
    def initialize(options: {}, percentage: nil, titles: {}, size: :md, total: nil, partial: nil)

      @options = options
      @titles = titles

      @total = total
      @partial = partial
      @size = calculate_size(size:)
      @percentage = percentage.nil? ? calculate_percentage(@partial.to_f, @total.to_f) : percentage

      @percentage = 100.00 if @percentage > 100.00
    end

    private

    def calculate_size(size:)
      case size
      when :sm
        "h-1.5"
      when :md
        "h-2.5"
      when :lg
        "h-4"
      when :xl
        "h-6"
      end
    end
  end
end
