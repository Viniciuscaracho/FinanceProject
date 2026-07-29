class CreateAiTokenUsages < ActiveRecord::Migration[7.0]
  def change
    create_table :ai_token_usages do |t|
      t.bigint  :account_id                       # conta atribuída (best-effort; pode ser nula)
      t.bigint  :contact_id                       # atleta relacionado, quando conhecido
      t.string  :service,       null: false       # ex.: StructureNoteService
      t.string  :model,         null: false       # ex.: claude-haiku-4-5-20251001
      t.integer :input_tokens,  null: false, default: 0
      t.integer :output_tokens, null: false, default: 0

      t.timestamps
    end

    add_index :ai_token_usages, :created_at
    add_index :ai_token_usages, [:account_id, :created_at]
    add_index :ai_token_usages, [:service, :created_at]
    add_foreign_key :ai_token_usages, :accounts, column: :account_id, on_delete: :nullify
    add_foreign_key :ai_token_usages, :people,   column: :contact_id, on_delete: :nullify
  end
end
