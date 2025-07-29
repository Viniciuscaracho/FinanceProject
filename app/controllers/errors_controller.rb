# frozen_string_literal: true

class ErrorsController < ApplicationController
  skip_before_action :authenticate_user!
  def not_found
  end
  def internal_error
  end
  def unprocessable
  end
  def access_forbidden
  end
end
