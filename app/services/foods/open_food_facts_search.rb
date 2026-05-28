# frozen_string_literal: true

module Foods
  class OpenFoodFactsSearch
    BASE_URL = 'https://world.openfoodfacts.org'

    def self.by_name(query, limit: 10)
      response = connection.get('/cgi/search.pl') do |req|
        req.params['search_terms'] = query
        req.params['search_simple'] = 1
        req.params['action']        = 'process'
        req.params['json']          = 1
        req.params['page_size']     = limit
        req.params['lc']            = 'pt'
        req.params['cc']            = 'br'
        req.params['fields']        = 'id,product_name,brands,nutriments'
      end

      data = JSON.parse(response.body)
      (data['products'] || []).filter_map { |p| parse_product(p) }
    rescue StandardError
      []
    end

    def self.by_barcode(barcode)
      response = connection.get("/api/v0/product/#{barcode}.json")
      data     = JSON.parse(response.body)
      return nil unless data['status'] == 1

      parse_product(data['product'])
    rescue StandardError
      nil
    end

    def self.connection
      Faraday.new(url: BASE_URL) do |f|
        f.options.timeout      = 5
        f.options.open_timeout = 3
        f.adapter Faraday.default_adapter
      end
    end

    def self.parse_product(product)
      return nil if product.blank?

      name = product['product_name'].presence
      return nil if name.blank?

      nutriments = product['nutriments'] || {}

      {
        external_id:      product['id'] || product['_id'],
        name:             name,
        brand:            product['brands'],
        source:           'open_food_facts',
        kcal_per_100g:    nutriment(nutriments, 'energy-kcal'),
        protein_per_100g: nutriment(nutriments, 'proteins'),
        carbs_per_100g:   nutriment(nutriments, 'carbohydrates'),
        fat_per_100g:     nutriment(nutriments, 'fat'),
        fiber_per_100g:   nutriment(nutriments, 'fiber'),
        vitamins_per_100g: {
          sodium_mg:    (nutriment(nutriments, 'sodium') * 1000).round(1),
          calcium_mg:   (nutriment(nutriments, 'calcium') * 1000).round(1),
          iron_mg:      (nutriment(nutriments, 'iron') * 1000).round(3),
          potassium_mg: (nutriment(nutriments, 'potassium') * 1000).round(1)
        }
      }
    end
    private_class_method :connection, :parse_product

    def self.nutriment(nutriments, key)
      (nutriments["#{key}_100g"] || nutriments[key] || 0).to_f.round(2)
    end
    private_class_method :nutriment
  end
end
