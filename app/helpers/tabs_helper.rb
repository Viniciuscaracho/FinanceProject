# frozen_string_literal: true

module TabsHelper
  def active_tab?(value, param_name)
    value == params.fetch(param_name.to_sym, nil)
  end

  def active_tab_if(value, compare)
    value == compare
  end
end
