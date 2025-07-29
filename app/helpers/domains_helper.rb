# frozen_string_literal: true

module DomainsHelper
  def categories(selected_category: nil, transaction_type: nil, order: :name, include_none: false)

    list = Current.account.categories
    list = list.or(Current.account.categories.with_discarded.where(id: selected_category.id)) if selected_category.present?
    list = list.where(transaction_type_cd: [Category.transaction_types[transaction_type], nil].flatten.uniq).order(order) if transaction_type.present?
    list = [Current.account.categories.new(id: -1, name: t('shared.not_informed_female'))] + list if include_none

    list.uniq
  end

  def category_options(selected_category:, transaction_type:, order: :name)
    list = categories(selected_category:, transaction_type:, order:)
    options_for_select(list.map { |c| [c.name, c.id] }, selected_category&.id)
  end

  def transction_type_cd_to_filter_categories(transaction_type:)
    transaction_type == :revenue ? [0] : [1...5]
  end

  def grouped_category_options(selected_category: nil, transaction_type_cd:, order: :name)
    list = Current.account.categories
    list = list.where(transaction_type_cd: [transaction_type_cd, nil].flatten.uniq)
    list = list.or(Current.account.categories.with_discarded.where(id: selected_category.id)) if selected_category.present?
    list = list.order(:transaction_type_cd).order(order)
    list = list.group_by(&:transaction_type_cd)

    grouped_list = list.map do |group, categories|
      [
        t("enums.transaction_type.#{group.nil? ? 'others' : Category.transaction_types.key(group)}"),
        categories.map { |category| [category.name, category.id] }
      ]
    end

    if selected_category&.present?
      grouped_options_for_select(grouped_list, selected_category.id)
    else
      grouped_options_for_select(grouped_list)
    end
  end

  def category_options_grouped_by_expenses(selected_category:, order: :name)
    list = Current.account.categories
    list = list.where(transaction_type_cd: [1, 2, 3, 4, nil])
    list = list.or(Current.account.categories.with_discarded.where(id: selected_category.id)) if selected_category.present?
    list = list.order(:transaction_type_cd).order(order)
    list = list.group_by(&:transaction_type_cd)

    grouped_list = list.map do |transaction_type_cd, categories|
      [t("enums.transaction_type.#{transaction_type_cd.nil? ? 'others' : Category.transaction_types.key(transaction_type_cd)}"), categories.map { |category| [category.name, category.id] }]
    end

    if selected_category&.present?
      grouped_options_for_select(grouped_list, selected_category.id)
    else
      grouped_options_for_select(grouped_list)
    end
  end

  def cost_centers(selected_cost_center: nil, order: :name, include_none: false)
    list = if include_none
             [Current.account.cost_centers.new(id: -1,
                                               name: t('shared.not_informed'))] + Current.account.cost_centers.order(order)
           else
             Current.account.cost_centers.order(order)
           end
    return [selected_cost_center] + list if selected_cost_center&.present?

    list
  end

  def select_category_data(transaction_type: nil)
    {
      controller: 'select-domain',
      select_domain_allow_deselect_value: true,
      select_domain_url_value: categories_path,
      select_domain_model_name_value: 'category',
      select_domain_transaction_type_value: transaction_type,
      select_domain_search_text_value: I18n.t('shared.search_category_text'),
      select_domain_search_placeholder_value: I18n.t('shared.search_category_placeholder'),
      auto_category_transaction_target: 'category'
    }
  end

  def select_cost_center_data
    {
      controller: 'select-domain',
      select_domain_allow_deselect_value: true,
      select_domain_url_value: cost_centers_path,
      select_domain_model_name_value: 'cost_center',
      select_domain_search_text_value: I18n.t('shared.search_cost_center_text'),
      select_domain_search_placeholder_value: I18n.t('shared.search_cost_center_placeholder')
    }
  end
end
