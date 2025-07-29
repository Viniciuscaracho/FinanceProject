# frozen_string_literal: true

class TurboModalComponent < ApplicationComponent
  renders_many :bodies

  def initialize(title: t('shared.untitled'), size: :lg, options: {})
    @title = title
    @size = size
    @options = options
    super
  end

  def modal_size_class
    case @size
    when :sm
      'sm:max-w-sm'
    when :md
      'sm:max-w-md'
    when :lg
      'sm:max-w-lg'
    when :xl
      'sm:max-w-xl'
    when :xl2
      'sm:max-w-2xl'
    when :xl3
      'sm:max-w-3xl'
    when :xl4
      'sm:max-w-4xl'
    when :xl5
      'sm:max-w-5xl'
    when :xl6
      'sm:max-w-6xl'
    when :xl7
      'sm:max-w-7xl'
    when :xl8
      'sm:max-w-[1500px]'
    when :full
      'sm:max-w-full'
    else
      'sm:max-w-lg'
    end
  end
end
