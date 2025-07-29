class CreateAddresses < ActiveRecord::Migration[7.0]
  def change
    create_table :addresses do |t|
      t.references :addressable, null: false, polymorphic: true
      t.string :postcode
      t.string :country
      t.string :state
      t.string :city
      t.string :address_line1
      t.string :address_line2
      t.string :district

      t.timestamps
    end
  end
end
