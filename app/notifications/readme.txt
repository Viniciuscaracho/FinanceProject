Pasta utilizada para armazenar as notifications do sistema
Para criar uma notification, utilizar o comando:
- rails generate noticed:notification ExampleNotification

# To deliver this notification:
#
# ExampleNotification.with(<model_name>: @<model_name>).deliver_later(current_account_user)
# ExampleNotification.with(<model_name>: @<model_name>).deliver(current_account_user)

# Example using post object to notify de current account user:
# PostNotification.with(post: @post).deliver(current_account_user)

class ExampleNotification < Noticed::Base
  deliver_by :database

  param :<model_name>

  def title
    params[:<model_name>].title
    # or
    t(".title")
  end

  def message
    params[:<model_name>].message
    # or
    t(".message")
  end

  def url
    <model_name>_path(params[:<model_name>])
  end

  def turbo_frame
    :modal  # to open on modal
    :drawer # to open on drawer
    :_self  # to open on same page
  end
end
