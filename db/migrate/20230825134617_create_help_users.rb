class CreateHelpUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :help_users do |t|
      t.string :type, null: false
      t.text :link, null: false
      t.text :title
      t.text :description

      t.timestamps
    end
  end
end
