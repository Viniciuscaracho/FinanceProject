# frozen_string_literal: true

class FixPersonTypeToPeople < ActiveRecord::Migration[7.0]
  def up
    FixCompanyPersonTypeWorker.perform_async
  rescue => e
    Rails.logger.warn "FixPersonTypeToPeople migration: skipping async job (#{e.class}: #{e.message})"
  end

  def down; end
end
