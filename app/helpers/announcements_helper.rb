module AnnouncementsHelper

  # new fix improvement update warning alert
  def banner_variant(kind)
    case kind
    when :new
      'banner--new'
    when :fix
      'banner--fix'
    when :improvement
      'banner--improvement'
    when :update
      'banner--update'
    when :warning
      'banner--warning'
    else
      'banner--alert'
    end
  end


end
