# frozen_string_literal: true

module ApplicationHelper
  include Pagy::Frontend
  include ActsAsTaggableOn::TagsHelper

  def field_error_message(object, attribute, custom_css_class = 'field_error_message')
    open_tag  = "<p class=\"#{custom_css_class}\">"
    error     = object&.errors&.full_messages_for(attribute)&.first
    close_tag = '</p>'

    [open_tag, error, close_tag].join.html_safe
  end

  def required_field(message: t('shared.required'))
    "<div class=\"flex absolute right-0 top-0 text-danger-500 space-x-1.5 text-xs items-center\">#{message}</div>".html_safe
  end

  def required_field_symbol
    '<span class="flex absolute right-0 top-0 text-danger-500 space-x-1.5 text-xs items-center">*</span>'.html_safe
  end

  def currency_data_params(allow_negative_value: true)
    if allow_negative_value
      {
        controller: 'currency-mask',
        currency_mask_pattern_value: '000.000.000.000,00',
        currency_mask_clear_if_not_match_value: true
      }
    else
      {
        controller: 'masks',
        masks_pattern_value: '###.###.###.##0,00',
        masks_reverse_value: true,
        masks_select_on_focus_value: true,
        masks_placeholder_value: '0,00',
        masks_clear_if_not_match_value: true
      }
    end
  end

  def coalesce(value, default: '-')
    return default if (value || '').strip.blank?

    value
  end

  def expandable_params(expanded:)
    {
      class: expanded && 'text-gray-700 hover:text-gray-700',
      "data-controller": 'expandable',
      "data-expandable-expanded-class": 'bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700',
      "data-expandable-rotate-class": 'rotate-90',
      "data-expandable-expanded-value": expanded
    }
  end

  def current_date
    params[:month].present? ? Time.parse(params[:month]).in_time_zone : Current.time.iso8601.in_time_zone
  end

  def accepted_currencies
    Transaction::ACCEPTED_CURRENCIES.map { |v| [t("enums.currency.#{v}"), v] }
  end

  def date_picker_data
    {
      controller: 'date-picker masks',
      action: 'change->date-picker#update',
      date_picker_locale_value: I18n.locale,
      date_picker_format_value: t('shared.date_format'),
      masks_pattern_value: t('shared.date_pattern')
    }
  end

  def datepicker_data
    {
      controller: 'datepicker masks',
      action: 'keyup->date-picker#update',
      date_picker_locale_value: I18n.locale,
      date_picker_format_value: t('shared.date_format'),
      masks_pattern_value: t('shared.date_pattern')
    }
  end

  def date_picker_data_range(min_date: nil, max_date: nil, month_styling: false)
    config = {
      controller: 'date-picker',
      action: 'keyup->date-picker#update',
      date_picker_locale_value: I18n.locale,
      date_picker_range_value: true,
      date_picker_format_value: t('shared.date_format'),
      masks_pattern_value: t('shared.date_pattern'),
      date_picker_selected_month_value: (min_date || Date.current.beginning_of_month).iso8601,
      date_picker_month_styling_value: month_styling
    }

    config[:date_picker_min_date_value] = min_date.iso8601 if min_date.present?
    config[:date_picker_max_date_value] = max_date.iso8601 if max_date.present?

    config
  end

  def parse_date(date)
    Date&.strptime(date, t('date.formats.default'))
  end

  def viewport_meta_tag(content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0')
    tag.meta name: 'viewport', content:
  end

  def hand_held_friendly_meta_tag(content: 'True')
    tag.meta name: 'HandheldFriendly', content:
  end

  def canonical_link_tag(href:)
    tag.link rel: 'canonical', href:
  end

  def content_type_meta_tag(content: 'text/html; charset=UTF-8')
    tag.meta content:, 'http-equiv': 'Content-Type'
  end

  def description_tag(content: I18n.t('shared.description'))
    tag.meta name: 'description', content:
  end

  def google_fonts_link_tag(href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')
    tag.link rel: :preload, href:, as: :style, onload: "this.onload=null;this.rel='stylesheet'"
  end

  def dns_prefetch_link_tag(href:)
    tag.link rel: 'dns-prefetch', href:
  end

  def google_analytics_script(src: 'https://www.googletagmanager.com/gtag/js?id=G-HV31PBQRQD%22%3E')
    tag.script async: true, src:
  end

  def theme_color_meta_tag(content: '#6366F1')
    tag.meta name: 'theme-color', content:
  end

  def ms_tile_color_meta_tag(content: '#ffffff')
    tag.meta name: 'msapplication-TileColor', content:
  end

  def turbo_cache_control_meta_tag(content: 'no-cache')
    tag.meta name: 'turbo-cache-control', content:
  end

  def turbo_root_meta_tag(content: '/')
    tag.meta name: 'turbo-root', content:
  end

  def current_env_meta_tag(content: Rails.env)
    tag.meta name: 'current-env', content:
  end

  def current_user_meta_tag(user: Current.user)
    [
      tag.meta(name: 'current-user-id', content: user&.id),
      # tag.meta(name: 'current-user-gid', content: user&.to_global_id&.to_s),
      tag.meta(name: 'current-user-email', content: user&.email),
      tag.meta(name: 'current-user-name', content: user&.name),
      tag.meta(name: 'current-user-owner', content: user&.current_account_owner?),
      tag.meta(name: 'current-user-admin', content: user&.is?(:admin))
    ].join.html_safe
  end

  def current_account_meta_tag(account: Current.account)
    [
      tag.meta(name: 'current-account-id', content: account&.id),
      tag.meta(name: 'current-account-type', content: account&.account_type),
      # tag.meta(name: 'current-account-gid', content: account&.to_global_id&.to_s),
      tag.meta(name: 'current-account-name', content: account&.name),
      tag.meta(name: 'current-account-owner-name', content: account&.owner&.name),
      tag.meta(name: 'current-account-owner-email', content: account&.owner&.email)
    ].join.html_safe
  end

  def sentry_dsn_meta_tag(content: Rails.application.credentials.dig(:sentry, :dsn_frontend))
    tag.meta name: 'sentry-dsn', content:
  end

  def meta_tag(name:, content:)
    tag.meta name:, content:
  end

  def greeting_day(hour:)
    case hour
    when 6..11
      t('shared.good_morning', name: Current.user.first_name)
    when 12..16
      t('shared.good_afternoon', name: Current.user.first_name)
    when 17..19
      t('shared.good_evening', name: Current.user.first_name)
    else
      t('shared.good_night', name: Current.user.first_name)
    end
  end

  def text_color_class(value)
    if value.negative?
      'text-danger-500 font-semibold'
    else
      value.zero? ? 'text-gray-300' : 'text-success-500 font-semibold'
    end
  end

  def render_if(condition, options = {}, locals = {}, &block)
    render options, locals, &block if condition
  end
end