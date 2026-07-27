# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    # Cobre a leitura do webhook oficial da WhatsApp Cloud API (Meta):
    # handshake de verificação, parsing por tipo, ignorar status callbacks,
    # dedupe por wamid, verificação de assinatura e sempre-200.
    class WhatsAppWebhookCloudTest < ActionDispatch::IntegrationTest
      include ActiveJob::TestHelper

      WEBHOOK_URL = '/api/v1/whatsapp/webhook'
      APP_SECRET  = 'test_app_secret'
      VERIFY_TOKEN = 'test_verify_token'
      TRAINER_PHONE = '5511999999999'

      setup do
        @prev_secret = ENV['WHATSAPP_APP_SECRET']
        @prev_token  = ENV['WHATSAPP_VERIFY_TOKEN']
        ENV['WHATSAPP_APP_SECRET'] = APP_SECRET
        ENV['WHATSAPP_VERIFY_TOKEN'] = VERIFY_TOKEN

        # Cache real para o dedupe por wamid (o test env padrão é null_store).
        @prev_cache = Rails.cache
        Rails.cache = ActiveSupport::Cache::MemoryStore.new

        @user, @account = register_user
        @user.update!(whatsapp_number: TRAINER_PHONE, account_id: @account.id)
      end

      teardown do
        ENV['WHATSAPP_APP_SECRET'] = @prev_secret
        ENV['WHATSAPP_VERIFY_TOKEN'] = @prev_token
        Rails.cache = @prev_cache
      end

      # ── Handshake (GET) ──────────────────────────────────────────────────────

      test 'verify handshake echoes the challenge with dotted hub.* params' do
        get WEBHOOK_URL, params: {
          'hub.mode' => 'subscribe',
          'hub.verify_token' => VERIFY_TOKEN,
          'hub.challenge' => '1234567890'
        }

        assert_response :success
        assert_equal '1234567890', response.body
      end

      test 'verify handshake rejects a wrong token' do
        get WEBHOOK_URL, params: {
          'hub.mode' => 'subscribe',
          'hub.verify_token' => 'wrong',
          'hub.challenge' => '1234567890'
        }

        assert_response :forbidden
      end

      # ── Mensagens (POST) ─────────────────────────────────────────────────────

      test 'text message enqueues a coaching note and returns 200' do
        body = cloud_payload(message: {
          from: TRAINER_PHONE, id: 'wamid.TEXT1', type: 'text',
          text: { body: 'João: dormiu 8h, treino pesado' }
        })

        assert_enqueued_jobs 1, only: Coaching::ProcessWhatsappMessageJob do
          post_signed(body)
        end
        assert_response :success
      end

      test 'status callbacks (no messages) are ignored with 200' do
        body = {
          object: 'whatsapp_business_account',
          entry: [{ changes: [{ field: 'messages', value: {
            messaging_product: 'whatsapp',
            statuses: [{ id: 'wamid.X', status: 'delivered', recipient_id: TRAINER_PHONE }]
          } }] }]
        }.to_json

        assert_no_enqueued_jobs only: Coaching::ProcessWhatsappMessageJob do
          post_signed(body)
        end
        assert_response :success
      end

      test 'duplicate wamid is processed only once' do
        body = cloud_payload(message: {
          from: TRAINER_PHONE, id: 'wamid.DUP', type: 'text', text: { body: 'Maria: ok' }
        })

        assert_enqueued_jobs 1, only: Coaching::ProcessWhatsappMessageJob do
          post_signed(body)
          post_signed(body) # reentrega da Meta — não deve enfileirar de novo
        end
        assert_response :success
      end

      test 'invalid signature is rejected with 401 and enqueues nothing' do
        body = cloud_payload(message: {
          from: TRAINER_PHONE, id: 'wamid.BAD', type: 'text', text: { body: 'x' }
        })

        assert_no_enqueued_jobs do
          post WEBHOOK_URL, params: body,
               headers: { 'CONTENT_TYPE' => 'application/json',
                          'X-Hub-Signature-256' => 'sha256=deadbeef' }
        end
        assert_response :unauthorized
      end

      test 'unknown sender phone is ignored with 200' do
        body = cloud_payload(message: {
          from: '5511000000000', id: 'wamid.UNK', type: 'text', text: { body: 'oi' }
        })

        assert_no_enqueued_jobs only: Coaching::ProcessWhatsappMessageJob do
          post_signed(body)
        end
        assert_response :success
      end

      test 'non-text media (audio) does not enqueue a text note but still 200s' do
        body = cloud_payload(message: {
          from: TRAINER_PHONE, id: 'wamid.AUD', type: 'audio',
          audio: { id: 'MEDIA123', mime_type: 'audio/ogg' }
        })

        assert_no_enqueued_jobs only: Coaching::ProcessWhatsappMessageJob do
          post_signed(body)
        end
        assert_response :success
      end

      private

      def cloud_payload(message:)
        {
          object: 'whatsapp_business_account',
          entry: [{
            id: 'WABA_ID',
            changes: [{
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '551133334444', phone_number_id: 'PNID' },
                contacts: [{ profile: { name: 'Treinador' }, wa_id: message[:from] }],
                messages: [message]
              }
            }]
          }]
        }.to_json
      end

      def sign(raw)
        'sha256=' + OpenSSL::HMAC.hexdigest('SHA256', APP_SECRET, raw)
      end

      def post_signed(raw_body)
        post WEBHOOK_URL, params: raw_body,
             headers: { 'CONTENT_TYPE' => 'application/json',
                        'X-Hub-Signature-256' => sign(raw_body) }
      end
    end
  end
end
