# frozen_string_literal: true

module Banners
  class SystemBannerComponent < ApplicationComponent
    renders_many :actions
    def initialize(text:, description:, color: :system_info)
      @text = text
      @description = description
      @color = color
      super
    end

    def select_color
      case @color
      when :system_info
        'bg-white sm:border-indigo-500 text-indigo-500'
      when :trial
        'bg-blue-100 sm:border-blue-300 text-blue-700'
      when :purple
        'bg-purple-100 sm:border-purple-300 text-purple-700'
      when :warning
        'bg-danger-100 sm:border-danger-300 text-danger-600'
      when :alert
        'bg-orange-100 sm:border-orange-300 text-orange-600'
      when :success
        'bg-success-100 sm:border-success-300 text-success-700'
      when :slate
        'bg-slate-600 sm:border-slate-800 text-white'
      else 
        'bg-white sm:border-indigo-500 text-indigo-500'
      end
    end

  end
end