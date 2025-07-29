# frozen_string_literal: true

module EnumsHelper
  def cnaes_options(selected: nil)
    items = Cnae.order(:key).map do |enum|
      [enum.name, enum.id]
    end

    # options_for_select(items, { selected:, disabled: selected })
    options_for_select(items, { selected: })
  end
end
