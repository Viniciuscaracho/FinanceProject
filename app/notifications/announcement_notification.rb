# To deliver this notification:
#
# AnnouncementNotification.with(post: @post).deliver_later(current_user)
# AnnouncementNotification.with(post: @post).deliver(current_user)

class AnnouncementNotification < Noticed::Base
  # Add your delivery methods
  deliver_by :database

  # Add required params
  param :announcement

  # Define helper methods to make rendering easier.
  #
  def title
    params[:announcement].title
  end

  def message
    params[:announcement].abstract
  end

  def url
    announcement_path(params[:announcement])
  end

  def turbo_frame
    :modal
  end
end
