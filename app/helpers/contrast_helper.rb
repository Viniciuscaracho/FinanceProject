module ContrastHelper
  def contrast_toggle_button
    content_tag :button, 
                "Contraste Normal", 
                class: "contrast-toggle",
                data: { 
                  controller: "contrast",
                  action: "click->contrast#toggle",
                  contrast_target: "button"
                }
  end

  def contrast_indicator
    content_tag :div,
                "Modo Alto Contraste Ativo",
                class: "contrast-indicator hidden",
                data: { contrast_target: "indicator" }
  end

  def contrast_menu
    content_tag :div, class: "contrast-menu" do
      safe_join([
        content_tag(:button, "Contraste Normal", 
                   class: "contrast-option",
                   data: { action: "click->contrast#setNormal" }),
        content_tag(:button, "Alto Contraste", 
                   class: "contrast-option",
                   data: { action: "click->contrast#setHigh" }),
        content_tag(:button, "Contraste Máximo", 
                   class: "contrast-option",
                   data: { action: "click->contrast#setUltra" })
      ])
    end
  end

  def contrast_controls
    safe_join([
      contrast_toggle_button,
      contrast_indicator,
      contrast_menu
    ])
  end
end 