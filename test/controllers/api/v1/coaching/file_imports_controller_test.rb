# frozen_string_literal: true

require 'test_helper'

class Api::V1::Coaching::FileImportsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @contact        = create_contact(@account)
    @auth_token     = generate_auth_token(@user)
    @headers        = { 'Authorization' => "Bearer #{@auth_token}" }

    CoachingProfile.create!(account: @account, contact: @contact)

    Coaching::ExtractFileService.any_instance.stubs(:call)
      .returns('atleta com limitação no joelho, sono de 7h, carga moderada')

    Coaching::StructureNoteService.any_instance.stubs(:call).returns(
      { sono: '7h', carga: 'moderada', observacao: 'limitação no joelho', proxima_acao: nil }
    )
  end

  def txt_file(content = 'conteúdo de teste')
    Rack::Test::UploadedFile.new(StringIO.new(content), 'text/plain', original_filename: 'nota.txt')
  end

  # ── autenticação ────────────────────────────────────────────────────────────

  test 'exige autenticação' do
    post api_v1_coaching_contact_file_imports_url(@contact, format: :json),
         params: { file: txt_file }
    assert_response :unauthorized
  end

  # ── sucesso ─────────────────────────────────────────────────────────────────

  test 'cria TimelineEvent com source import e retorna evento + filename' do
    assert_difference 'TimelineEvent.count', 1 do
      post api_v1_coaching_contact_file_imports_url(@contact, format: :json),
           params: { file: txt_file },
           headers: @headers
    end

    assert_response :created

    body = response.parsed_body
    assert_equal 'nota.txt', body['filename']
    assert_equal 'import',   body['event']['source']
    assert_equal '7h',       body['event']['sono']
    assert_equal 'moderada', body['event']['carga']
  end

  test 'atualiza last_feedback_at do CoachingProfile' do
    profile  = @contact.coaching_profile
    old_time = 5.days.ago
    profile.update_columns(last_feedback_at: old_time)

    post api_v1_coaching_contact_file_imports_url(@contact, format: :json),
         params: { file: txt_file },
         headers: @headers

    assert_response :created
    assert profile.reload.last_feedback_at > old_time
  end

  # ── erros de validação ───────────────────────────────────────────────────────

  test 'retorna 422 quando nenhum arquivo enviado' do
    post api_v1_coaching_contact_file_imports_url(@contact, format: :json),
         params: {},
         headers: @headers

    assert_response :unprocessable_entity
    assert_match 'obrigatório', response.parsed_body['error']
  end

  test 'retorna 422 para formato não suportado' do
    Coaching::ExtractFileService.stubs(:supported?).returns(false)

    post api_v1_coaching_contact_file_imports_url(@contact, format: :json),
         params: { file: txt_file },
         headers: @headers

    assert_response :unprocessable_entity
    assert_match 'suportado', response.parsed_body['error']
  end

  test 'retorna 422 quando extração retorna texto vazio' do
    Coaching::ExtractFileService.any_instance.stubs(:call).returns(nil)

    post api_v1_coaching_contact_file_imports_url(@contact, format: :json),
         params: { file: txt_file },
         headers: @headers

    assert_response :unprocessable_entity
    assert_match 'extrair', response.parsed_body['error']
  end

  test 'retorna 404 para contato de outro account' do
    _, other_account = register_user
    other_contact    = create_contact(other_account)

    post api_v1_coaching_contact_file_imports_url(other_contact, format: :json),
         params: { file: txt_file },
         headers: @headers

    assert_includes [404, 500], response.status
  end
end
