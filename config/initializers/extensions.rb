# frozen_string_literal: true

class Hash
  def squish_levels(prefix = nil)
    each_pair.reduce({}) do |a, (k, v)|
      v.is_a?(Hash) ? a.merge(v.squish_levels("#{prefix}#{k}.")) : a.merge("#{prefix}#{k}" => v)
    end
  end

  def to_ostruct
    JSON.parse to_json, object_class: OpenStruct
  rescue JSON::ParserError
    OpenStruct.new({})
  end
end

class String
  def to_boolean
    ActiveRecord::Type::Boolean.new.cast(self)
  end

  def to_ostruct
    return OpenStruct.new({}) if blank?

    JSON.parse self, object_class: OpenStruct
  rescue JSON::ParserError
    OpenStruct.new({})
  end
end

class NilClass
  def to_boolean
    false
  end

  def to_ostruct
    OpenStruct.new({})
  end
end

class TrueClass
  def to_boolean
    true
  end

  def to_i
    1
  end
end

class FalseClass
  def to_boolean
    false
  end

  def to_i
    0
  end
end

class Integer
  delegate :to_boolean, to: :to_s
end

class Date
  def self.parseable?(string)
    parse(string)
    true
  rescue ArgumentError
    false
  end
end

class OpenStructSerializer
  def self.dump(ostruct)
    return '{}' if ostruct.blank? || ostruct.to_hash.blank?
    return ostruct.to_hash.to_json if ostruct.is_a?(OpenStruct)

    '{}'
  end

  def self.load(json)
    return json.to_ostruct if json.respond_to?(:to_ostruct)

    OpenStruct.new({})
  end
end

class OpenStruct
  def to_hash(options = nil)
    @table&.as_json(options) || {}
  end
end
