class LoadSegmentsFromJsonFile < ActiveRecord::Migration[7.0]
  def up
    # Load segments from json file
    segments = JSON.parse(File.read(Rails.root.join('db/seeds/categories_per_segment.json')))
    segments.each do |segment|
      business_sector = BusinessSector.find_or_create_by!(name: segment['Grupo'])
      sector_activity = business_sector.sector_activities.find_or_create_by!(name: segment['Segmento'])
      sector_activity.category_presets.find_or_create_by!(
        transaction_type_cd: Transaction::TRANSACTION_TYPES[segment['Tipo'].to_sym],
        name: segment['Categoria'],
        description: segment['Descricao']
      )
    end
  end

  def down
    # Delete all segments
    CategoryPreset.destroy_all
    SectorActivity.destroy_all
    BusinessSector.destroy_all
  end
end
