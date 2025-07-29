# frozen_string_literal: true

MEMBER_POLICIES = YAML.load_file(Rails.root.join('config/policies.yml')).deep_symbolize_keys.freeze
Rails.logger.info('--> All member policies was loaded successfully!')
