# frozen_string_literal: true

require 'test_helper'

class Api::V1::Coaching::AudioNotesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @contact        = create_contact(@account)
    @auth_token     = generate_auth_token(@user)
    @headers        = { 'Authorization' => "Bearer #{@auth_token}" }

    CoachingProfile.create!(account: @account, contact: @contact)

    Coaching::TranscribeAudioService.any_instance.stubs(:call)
      .returns('atleta relatou sono de 8h e treino leve hoje')

    Coaching::StructureNoteService.any_instance.stubs(:call).returns(
      { sono: '8h', carga: 'leve', observacao: 'ótimo treino', proxima_acao: nil }
    )
  end

  def audio_file
    fixture_file_upload('sample.webm', 'audio/webm')
  end

  # ── autenticação ────────────────────────────────────────────────────────────

  test 'requires authentication' do
    post api_v1_coaching_contact_audio_notes_url(@contact, format: :json),
         params: { audio: audio_file }
    assert_response :unauthorized
  end

  # ── sucesso ─────────────────────────────────────────────────────────────────

  test 'cria TimelineEvent com source whisper e retorna evento + transcrição' do
    assert_difference 'TimelineEvent.count', 1 do
      post api_v1_coaching_contact_audio_notes_url(@contact, format: :json),
           params: { audio: audio_file },
           headers: @headers
    end

    assert_response :created

    body = response.parsed_body
    assert_equal 'atleta relatou sono de 8h e treino leve hoje', body['transcript']
    assert_equal 'whisper',                                       body['event']['source']
    assert_equal 'atleta relatou sono de 8h e treino leve hoje', body['event']['raw_input']
    assert_equal '8h',                                            body['event']['sono']
    assert_equal 'leve',                                          body['event']['carga']
  end

  test 'atualiza last_feedback_at do CoachingProfile' do
    profile = @contact.coaching_profile
    old_time = 5.days.ago
    profile.update_columns(last_feedback_at: old_time)

    post api_v1_coaching_contact_audio_notes_url(@contact, format: :json),
         params: { audio: audio_file },
         headers: @headers

    assert_response :created
    assert profile.reload.last_feedback_at > old_time
  end

  # ── erros ───────────────────────────────────────────────────────────────────

  test 'retorna 422 quando nenhum arquivo enviado' do
    post api_v1_coaching_contact_audio_notes_url(@contact, format: :json),
         params: {},
         headers: @headers

    assert_response :unprocessable_entity
    assert_match 'obrigatório', response.parsed_body['error']
  end

  test 'retorna 422 quando Whisper falha em transcrever' do
    Coaching::TranscribeAudioService.any_instance.stubs(:call).returns(nil)

    post api_v1_coaching_contact_audio_notes_url(@contact, format: :json),
         params: { audio: audio_file },
         headers: @headers

    assert_response :unprocessable_entity
    assert_match 'transcrever', response.parsed_body['error']
  end

  test 'retorna 404 para contato de outro account' do
    _, other_account = register_user
    other_contact = create_contact(other_account)

    post api_v1_coaching_contact_audio_notes_url(other_contact, format: :json),
         params: { audio: audio_file },
         headers: @headers

    assert_includes [404, 500], response.status
  end
end
