class EnablePgcryptoUuidossp < ActiveRecord::Migration[5.2]
  def change
    enable_extension 'pgcrypto' unless extension_enabled?('pgcrypto')
    enable_extension 'uuid-ossp' unless extension_enabled?('uuid-ossp')
  end
end
