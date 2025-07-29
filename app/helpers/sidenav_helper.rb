# frozen_string_literal: true

module SidenavHelper
  def group_active?(ctrl_names)
    ctrl_names.include?(controller_name)
  end

  def active_class?(ctrl_name)
    controller_name == ctrl_name
  end
end
