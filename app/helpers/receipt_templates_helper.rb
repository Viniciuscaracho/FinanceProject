module ReceiptTemplatesHelper
  def suggestions_variables(name_variables = [])

    name_variables = name_variables.map do |name_variable|
      {
        "name" => name_variable
      }
    end

    return name_variables.to_json
  end
end
