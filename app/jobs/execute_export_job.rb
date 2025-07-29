class ExecuteExportJob < ApplicationJob
  queue_as :exports

  def perform(export_id)

    export = Export.find(export_id)
    params = export.params.with_indifferent_access

    transactions = export.account.transactions
                          .includes(:contact, :category, :cost_center, :bank_account, :transfer_to, { tags: { taggings: :tag } })
                          .filter_by(start_date: params[:start_date],
                                     end_date: params[:end_date],
                                     bank_account_ids: params[:bank_account_ids],
                                     cost_center_ids: params[:cost_center_ids],
                                     paid: params[:paid_values])

    export.file.attach(
      io: Exports::BackupXlsx.call(transactions:, bank_account_ids: params[:bank_account_ids], export: export).data,
      filename: backup_xlsx_filename,
      content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    export.state = :done

    export.save

  rescue StandardError => e
    Rails.logger.error(e)
  end

  def backup_xlsx_filename
    base = "Backup-Procfy-#{I18n.l(Time.zone.now)}"
    "#{base}.xlsx"
  end
end
