# frozen_string_literal: true

class ToggleComponent < ApplicationComponent
  def initialize(url:, method: :patch, enabled: false, params: {}, id: nil)
    super
    @url = url
    @method = method
    @enabled = enabled
    @params = params
    @id = id
  end
end
