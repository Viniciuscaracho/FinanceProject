# frozen_string_literal: true

require 'test_helper'

# Teste de integração semi-real: stuba apenas a Evolution API e o Whisper,
# deixando ParseAudioContextService chamar o Claude (ANTHROPIC_API_KEY real).
# Valida que o prompt extrai os campos corretamente de uma transcrição verossímil.
#
# Executar isolado:
#   bundle exec rails test test/integration/coaching/process_whatsapp_audio_integration_test.rb
class Coaching::ProcessWhatsappAudioIntegrationTest < ActiveSupport::TestCase
  TRANSCRIPT = <<~TEXT.strip
    João Silva treinou muito bem hoje. Dormiu umas 7 horas, bem descansado.
    A carga de treino foi moderada, sem reclamações. O objetivo dele é ganhar
    massa muscular. Vou reavaliar o planejamento em 14 dias.
  TEXT

  setup do
    skip 'ANTHROPIC_API_KEY não configurado' unless ENV['ANTHROPIC_API_KEY'].present?

    _, @account = register_user

    WhatsApp::EvolutionApiClient.stubs(:download_media).returns(
      { base64: Base64.strict_encode64('fake_audio'), mimetype: 'audio/ogg', filename: 'ptt.ogg' }
    )

    Coaching::TranscribeAudioService.any_instance.stubs(:call).returns(TRANSCRIPT)
  end

  # ── Criação automática ─────────────────────────────────────────────────────

  test 'cria Contact, CoachingProfile e TimelineEvent quando atleta não existe' do
    assert_difference('Contact.count') do
      assert_difference('CoachingProfile.count') do
        assert_difference('TimelineEvent.count') do
          perform_job
        end
      end
    end

    event = TimelineEvent.order(created_at: :desc).first
    assert_equal 'whatsapp_audio', event.source
    assert_equal TRANSCRIPT,       event.raw_input
    assert_not_nil event.contact
  end

  test 'Claude extrai nome do atleta e cria contato com esse nome' do
    perform_job

    contact = Contact.where(account: @account).order(created_at: :desc).first
    assert_match /silva/i, contact.name
  end

  test 'Claude extrai goal e atualiza CoachingProfile' do
    perform_job

    profile = CoachingProfile.where(account: @account).order(created_at: :desc).first
    assert_not_nil profile.goal
    assert_match /massa/i, profile.goal
  end

  test 'Claude extrai days_to_reassessment e calcula next_reassessment_at' do
    freeze_time do
      perform_job

      profile = CoachingProfile.where(account: @account).order(created_at: :desc).first
      assert_not_nil profile.next_reassessment_at
      # aceita ±1 dia — LLM pode interpretar "14 dias" como 13–15
      assert_in_delta 14.days.from_now.to_i, profile.next_reassessment_at.to_i, 1.day.to_i
    end
  end

  test 'Claude extrai sono e preenche TimelineEvent' do
    perform_job

    event = TimelineEvent.order(created_at: :desc).first
    assert_not_nil event.sono
    assert_match /7/, event.sono
  end

  test 'Claude extrai carga e preenche TimelineEvent' do
    perform_job

    event = TimelineEvent.order(created_at: :desc).first
    assert_not_nil event.carga
    assert_match /modera/i, event.carga
  end

  # ── Contato pré-existente ──────────────────────────────────────────────────

  test 'vincula ao contato existente quando nome extraído bate com o banco' do
    contact = create_contact(@account, name: 'João Silva')

    assert_no_difference('Contact.count') do
      assert_difference('TimelineEvent.count') do
        perform_job
      end
    end

    assert_equal contact, TimelineEvent.order(created_at: :desc).first.contact
  end

  test 'atualiza last_feedback_at do CoachingProfile existente' do
    contact = create_contact(@account, name: 'João Silva')
    profile = CoachingProfile.create!(account: @account, contact:, last_feedback_at: 10.days.ago)

    freeze_time do
      perform_job
      assert_in_delta Time.current.to_i, profile.reload.last_feedback_at.to_i, 2
    end
  end

  private

  def perform_job(from: '5511999990000')
    Coaching::ProcessWhatsappAudioJob.perform_now(
      account_id:   @account.id,
      message_key:  { 'remoteJid' => "#{from}@s.whatsapp.net", 'fromMe' => true, 'id' => 'INT_TEST' },
      message_body: { 'audioMessage' => { 'url' => 'fake', 'mimetype' => 'audio/ogg' } },
      from:         from
    )
  end
end
