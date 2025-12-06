# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: email_address_with_name('no-reply@barbermanagement.io', 'BarberManagement'),
          sender: email_address_with_name('no-reply@barbermanagement.io', 'BarberManagement'),
          reply_to: email_address_with_name('support@barbermanagement.io', 'BarberManagement')

  layout 'mailer'
end
