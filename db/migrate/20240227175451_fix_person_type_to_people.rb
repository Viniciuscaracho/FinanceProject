# frozen_string_literal: true

class FixPersonTypeToPeople < ActiveRecord::Migration[7.0]
  def up
    FixCompanyPersonTypeWorker.perform_async
  end

  def down; end
end
