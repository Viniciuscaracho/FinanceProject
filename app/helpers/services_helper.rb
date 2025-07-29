# frozen_string_literal: true

module ServicesHelper
  def services(sort_col: :name, sort_dir: :asc)
    Current.account.services.order(sort_col => sort_dir).kept.map do |service|
      OpenStruct.new(
        id: service.id,
        name: service.name,
        formatted_name: <<~TEXT
          <div class="flex space-x-3 max-w-sm">
            <div class="block flex-1 overflow-hidden">
              <div class="paragraph-base">#{service.name}</div>
              <div class="paragraph-muted overflow-hidden">#{service.description}</div>
            </div>
          </div>
        TEXT
      )
    end
  end

  def service_options(selected: nil, sort_col: :name, sort_dir: :asc)
    options_for_select(services(sort_col:, sort_dir:).map { |c| [c.name, c.id, { 'data-html' => c.formatted_name }] }, selected)
  end
end
