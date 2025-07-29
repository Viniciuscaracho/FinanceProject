# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: email_address_with_name('no-reply@procfy.io', 'Procfy'),
          sender: email_address_with_name('no-reply@procfy.io', 'Procfy'),
          reply_to: email_address_with_name('support@procfy.io', 'Procfy')

  layout 'mailer'
end
