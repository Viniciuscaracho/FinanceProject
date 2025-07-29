# frozen_string_literal: true

module Elements
  module Filter
    class OptionComponent < ApplicationComponent
      renders_one :checkbox, Elements::Filter::CheckboxComponent
      renders_one :input, Elements::Filter::InputComponent

    end
  end
end
