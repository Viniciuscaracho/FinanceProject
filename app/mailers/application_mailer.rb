# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: email_address_with_name('no-reply@orbi.app', 'Orbi'),
          sender: email_address_with_name('no-reply@orbi.app', 'Orbi'),
          reply_to: email_address_with_name('suporte@orbi.app', 'Orbi')

  layout 'mailer'
end
