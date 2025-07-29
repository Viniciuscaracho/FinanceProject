# frozen_string_literal: true

module AttachmentsHelper
  def image_tag_from_attachment(attachment)
    if attachment.representable?
      image_tag attachment.representation(resize_to_limit: [100, 100]).processed.url
    else
      heroicon 'paper-clip', options: { class: 'h-5 w-5 flex-shrink-0 text-gray-400' }
    end
  rescue StandardError => e
    Rails.logger.error e.message
    heroicon 'paper-clip', options: { class: 'h-5 w-5 flex-shrink-0 text-gray-400' }
  end
end
