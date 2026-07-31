# frozen_string_literal: true

require 'test_helper'

class Coaching::ProcessWhatsappAudioJobTest < ActiveSupport::TestCase
  setup do
    _, @account   = register_user
    @account_user = @account.account_users.first
    @contact      = create_contact(@account, name: 'Atleta Existente')

    # Stub Evolution API media download
    WhatsApp::EvolutionApiClient.stubs(:download_media).returns(
      { base64: Base64.strict_encode64('fake_audio'), mimetype: 'audio/ogg', filename: 'ptt.ogg' }
    )

    # Stub Whisper
    Coaching::TranscribeAudioService.any_instance.stubs(:call).returns(
      'Atleta Existente, treinou bem. Dormiu 7h. Objetivo: ganho de massa. Reavaliação em 14 dias.'
    )

    # Stub ParseAudioContextService
    Coaching::ParseAudioContextService.any_instance.stubs(:call).returns(
      athlete_name: 'Atleta Existente', sono: '7h', carga: 'moderada',
      observacao: 'treinou bem', proxima_acao: nil,
      goal: 'ganho de massa', days_to_reassessment: 14
    )
  end

  # ── Encontra contato por nome ──────────────────────────────────────────────

  test 'cria TimelineEvent para contato encontrado pelo nome na transcrição' do
    CoachingProfile.create!(account: @account, contact: @contact)

    assert_difference('TimelineEvent.count') do
      perform_job
    end

    event = TimelineEvent.last
    assert_equal @contact,        event.contact
    assert_equal 'whatsapp_audio', event.source
    assert_equal '7h',             event.sono
  end

  test 'não cria contato novo quando nome extraído não existe na conta' do
    # ContactResolverService nunca cria contatos — o job agora delega a ele
    # em vez de criar contatos a partir de transcrições de IA.
    Coaching::ParseAudioContextService.any_instance.stubs(:call).returns(
      athlete_name: 'Novo Atleta', sono: nil, carga: nil,
      observacao: nil, proxima_acao: nil, goal: 'emagrecimento', days_to_reassessment: 30
    )

    assert_no_difference('Contact.count') do
      assert_no_difference('TimelineEvent.count') do
        perform_job
      end
    end
  end

  test 'não cria CoachingProfile quando contato não encontrado' do
    Coaching::ParseAudioContextService.any_instance.stubs(:call).returns(
      athlete_name: 'Atleta Desconhecido', sono: nil, carga: nil,
      observacao: nil, proxima_acao: nil, goal: 'resistência', days_to_reassessment: nil
    )

    assert_no_difference('CoachingProfile.count') do
      perform_job
    end
  end

  # ── Atualiza CoachingProfile ──────────────────────────────────────────────

  test 'atualiza goal no CoachingProfile quando extraído' do
    profile = CoachingProfile.create!(account: @account, contact: @contact)

    perform_job

    assert_equal 'ganho de massa', profile.reload.goal
  end

  test 'atualiza next_reassessment_at quando days_to_reassessment presente' do
    profile = CoachingProfile.create!(account: @account, contact: @contact)

    freeze_time do
      perform_job
      assert_in_delta 14.days.from_now.to_i, profile.reload.next_reassessment_at.to_i, 5
    end
  end

  test 'não atualiza goal quando nil' do
    profile = CoachingProfile.create!(account: @account, contact: @contact, goal: 'objetivo anterior')
    Coaching::ParseAudioContextService.any_instance.stubs(:call).returns(
      athlete_name: 'Atleta Existente', sono: '7h', carga: nil,
      observacao: nil, proxima_acao: nil, goal: nil, days_to_reassessment: nil
    )

    perform_job

    assert_equal 'objetivo anterior', profile.reload.goal
  end

  # ── Fallback por telefone e recente ──────────────────────────────────────

  test 'usa fallback por telefone quando sem nome na transcrição' do
    @contact.update!(cell_phone_number: '5541999990000')
    CoachingProfile.create!(account: @account, contact: @contact)
    Coaching::ParseAudioContextService.any_instance.stubs(:call).returns(
      athlete_name: nil, sono: '6h', carga: 'leve',
      observacao: nil, proxima_acao: nil, goal: nil, days_to_reassessment: nil
    )

    assert_difference('TimelineEvent.count') do
      perform_job(from: '5541999990000')
    end

    assert_equal @contact, TimelineEvent.last.contact
  end

  test 'usa fallback para CoachingProfile mais recente quando sem nome e sem número' do
    CoachingProfile.create!(account: @account, contact: @contact)
    Coaching::ParseAudioContextService.any_instance.stubs(:call).returns(
      athlete_name: nil, sono: nil, carga: nil,
      observacao: 'nota geral', proxima_acao: nil, goal: nil, days_to_reassessment: nil
    )

    assert_difference('TimelineEvent.count') do
      perform_job(from: '0000000000')
    end

    assert_equal @contact, TimelineEvent.last.contact
  end

  # ── Guarda de erros ──────────────────────────────────────────────────────

  test 'não cria nada quando download retorna nil' do
    WhatsApp::EvolutionApiClient.stubs(:download_media).returns(nil)

    assert_no_difference('TimelineEvent.count') { perform_job }
  end

  test 'não cria nada quando Whisper retorna vazio' do
    Coaching::TranscribeAudioService.any_instance.stubs(:call).returns(nil)

    assert_no_difference('TimelineEvent.count') { perform_job }
  end

  test 'não cria nada quando contato não encontrado e sem nome extraído' do
    Coaching::ParseAudioContextService.any_instance.stubs(:call).returns(
      athlete_name: nil, sono: nil, carga: nil,
      observacao: nil, proxima_acao: nil, goal: nil, days_to_reassessment: nil
    )

    assert_no_difference('TimelineEvent.count') { perform_job(from: '9999999999') }
  end

  test 'atualiza last_feedback_at após criar evento' do
    profile = CoachingProfile.create!(account: @account, contact: @contact, last_feedback_at: 10.days.ago)

    freeze_time do
      perform_job
      assert_in_delta Time.current.to_i, profile.reload.last_feedback_at.to_i, 2
    end
  end

  private

  def perform_job(from: '5511999990000')
    Coaching::ProcessWhatsappAudioJob.perform_now(
      account_id:   @account.id,
      message_key:  { 'remoteJid' => "#{from}@s.whatsapp.net", 'fromMe' => true, 'id' => 'TEST' },
      message_body: { 'audioMessage' => { 'url' => 'fake', 'mimetype' => 'audio/ogg' } },
      from:         from
    )
  end
end
