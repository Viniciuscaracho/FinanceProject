class ModalController < ApplicationController

  def index; end

  def print
    @body = params.fetch(:body, nil)
    @src = params.fetch(:src, nil)
    @turbo_frame = params.fetch(:turbo_frame, nil)
  end
end
