# frozen_string_literal: true

module Tabs
  class NavComponent < ApplicationComponent
    renders_many :items, 'Tabs::NavItemComponent'
  end
end
