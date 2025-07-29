class FeedbackDeliverError < StandardError
  def initialize(message = 'Feedback delivery failed')
    super
  end
end

class FeedbackDeliverJob < ApplicationJob
  include HTTParty
  retry_on FeedbackDeliverError, wait: :exponentially_longer

  def perform(feedback_id)
    feedback = Feedback.find(feedback_id)
    payload = message_json(feedback)
    deliver_discord(payload)
  end

  private

  def deliver_discord(payload)
    webhook_url = Rails.application.credentials.discord.webhook_url

    response = HTTParty.post(webhook_url,
                             body: payload.to_json,
                             headers: { 'Content-Type' => 'application/json' })

    raise FeedbackDeliverError unless response.success?
  end

  def message_json(feedback)
    rating_emojis = '⭐ ' * feedback.rating
    color_hex = "%06x" % (rand * 0xffffff)
    observation_content = feedback.observations.present? ? feedback.observations : I18n.t('feedbacks.create.empty')

    {
      embeds: [
        {
          title: "Nova avaliação recebida",
          description: "**Usuário**: #{feedback.user.name}\n-----------------------------------------------------------",
          color: color_hex.to_i(16),
          fields: [
            {
              name: "Nota",
              value: "#{rating_emojis}",
              inline: true
            },
            {
              name: "Média do sistema",
              value: "#{(Feedback.sum(:rating) / Feedback.count.to_f).round(2)}",
              inline: true
            },
            {
              name: "Observações",
              value: "#{observation_content}"
            }
          ],
          thumbnail: {
            url: "https://cdn-images-1.medium.com/max/1200/1*wJCeGZGraH1eY3HdB_HxaQ.png"
          }
        }
      ],
      attachments: []
    }
  end
end