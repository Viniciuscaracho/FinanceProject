module SegmentsHelper
  def grouped_segment_options(selected_segment:, order: 'business_sectors_segments.name')
    list = SectorActivity.includes(:business_sector).order(order)
    grouped_list = list.group_by { |segment| segment.business_sector.name }
    grouped_list = grouped_list.map do |group, segments|
      [group, segments.map { |segment| [segment.name, segment.id] }]
    end

    grouped_options_for_select(grouped_list, selected_segment&.id)
  end
end
