# frozen_string_literal: true

require 'test_helper'

# Valida que as URLs de imagem retornadas pela API são permanentes (não expiram).
#
# Cenário do bug: url_for(attachment) com Disk storage gera URLs assinadas que
# expiram em 5 minutos. O correto é rails_blob_url que gera redirect URLs
# estáveis (/rails/active_storage/blobs/redirect/...).
class ImagePersistenceTest < ActionDispatch::IntegrationTest
  include ActionDispatch::TestProcess::FixtureFile

  REDIRECT_URL_PATTERN = %r{/rails/active_storage/blobs/redirect/}
  EXPIRING_URL_PATTERN  = %r{/rails/active_storage/disk/}

  setup do
    @user, @account = register_user
    @token = generate_auth_token(@user)
    @auth  = { 'Authorization' => "Bearer #{@token}" }

    # Habilitar vitrine para o discover
    @account.update!(directory_visible: true, profession_category: 'Nutricionista')
    @account.company.update!(email: 'teste@exemplo.com')
  end

  # ── Cenário 1: upload_logo retorna URL permanente ───────────────────────────

  test 'upload_logo returns a non-expiring redirect URL' do
    file = fixture_file_upload('profile.jpg', 'image/jpeg')

    patch upload_logo_api_v1_account_settings_url,
          params: { logo: file },
          headers: @auth

    assert_response :success
    body = response.parsed_body

    assert body['logo_url'].present?, 'logo_url deve estar presente na resposta'
    assert_match REDIRECT_URL_PATTERN, body['logo_url'],
                 "logo_url deve ser URL de redirect permanente, recebeu: #{body['logo_url']}"
    assert_no_match EXPIRING_URL_PATTERN, body['logo_url'],
                    "logo_url NÃO deve ser URL de disco com expiração, recebeu: #{body['logo_url']}"
  end

  # ── Cenário 2: upload_cover retorna URL permanente ──────────────────────────

  test 'upload_cover returns a non-expiring redirect URL' do
    file = fixture_file_upload('profile.jpg', 'image/jpeg')

    patch upload_cover_api_v1_account_settings_url,
          params: { cover: file },
          headers: @auth

    assert_response :success
    body = response.parsed_body

    assert body['cover_url'].present?, 'cover_url deve estar presente'
    assert_match REDIRECT_URL_PATTERN, body['cover_url'],
                 "cover_url deve ser URL de redirect permanente, recebeu: #{body['cover_url']}"
    assert_no_match EXPIRING_URL_PATTERN, body['cover_url'],
                    "cover_url NÃO deve ser URL de disco com expiração, recebeu: #{body['cover_url']}"
  end

  # ── Cenário 3: GET account_settings persiste logo_url após navegação ────────

  test 'logo_url persists across page reloads (simulated navigation away and back)' do
    # 1. Faz upload
    file = fixture_file_upload('profile.jpg', 'image/jpeg')
    patch upload_logo_api_v1_account_settings_url, params: { logo: file }, headers: @auth
    assert_response :success
    uploaded_url = response.parsed_body['logo_url']

    # 2. Simula navegação para outra tela e retorno (GET fresh)
    get api_v1_account_settings_url, headers: @auth, as: :json
    assert_response :success
    reloaded_url = response.parsed_body.dig('account', 'company', 'logo_url')

    assert reloaded_url.present?, 'logo_url deve estar presente após recarregar'
    assert_match REDIRECT_URL_PATTERN, reloaded_url,
                 "logo_url após reload deve ser URL permanente, recebeu: #{reloaded_url}"
  end

  # ── Cenário 4: cover_url persiste após navegação ────────────────────────────

  test 'cover_url persists across page reloads' do
    file = fixture_file_upload('profile.jpg', 'image/jpeg')
    patch upload_cover_api_v1_account_settings_url, params: { cover: file }, headers: @auth
    assert_response :success

    get api_v1_account_settings_url, headers: @auth, as: :json
    assert_response :success
    reloaded_url = response.parsed_body.dig('account', 'company', 'cover_url')

    assert reloaded_url.present?, 'cover_url deve estar presente após recarregar'
    assert_match REDIRECT_URL_PATTERN, reloaded_url,
                 "cover_url após reload deve ser URL permanente, recebeu: #{reloaded_url}"
  end

  # ── Cenário 5: vitrine pública (DiscoverController) retorna URL permanente ──

  test 'public discover profile returns non-expiring logo_url' do
    file = fixture_file_upload('profile.jpg', 'image/jpeg')
    patch upload_logo_api_v1_account_settings_url, params: { logo: file }, headers: @auth
    assert_response :success

    get "/api/v1/public/discover/#{@account.id}", as: :json
    assert_response :success
    logo_url = response.parsed_body['logo_url']

    assert logo_url.present?, 'logo_url deve estar presente na vitrine pública'
    assert_match REDIRECT_URL_PATTERN, logo_url,
                 "Vitrine pública deve retornar URL permanente, recebeu: #{logo_url}"
    assert_no_match EXPIRING_URL_PATTERN, logo_url,
                    "Vitrine pública NÃO deve retornar URL de disco expirada"
  end

  # ── Cenário 6: GET account_settings sem imagem retorna nil (não quebra) ─────

  test 'logo_url is nil when no image has been uploaded' do
    get api_v1_account_settings_url, headers: @auth, as: :json
    assert_response :success

    logo_url = response.parsed_body.dig('account', 'company', 'logo_url')
    assert_nil logo_url, 'logo_url deve ser nil quando nenhuma imagem foi enviada'
  end

  # ── Cenário 7: URL retornada é acessível (não 404) ──────────────────────────

  test 'uploaded logo_url responds with redirect (not 404 or 422)' do
    file = fixture_file_upload('profile.jpg', 'image/jpeg')
    patch upload_logo_api_v1_account_settings_url, params: { logo: file }, headers: @auth
    assert_response :success

    logo_url = response.parsed_body['logo_url']
    path = URI.parse(logo_url).path

    get path
    assert_includes [200, 302], response.status,
                    "URL da imagem deve ser acessível, recebeu status #{response.status} para #{path}"
  end

  # ── Cenário 8: attachment é salvo no banco (não só em memória) ───────────────

  test 'upload_logo persists ActiveStorage::Attachment record to database' do
    company = @account.company
    assert_equal 0, ActiveStorage::Attachment.where(record_id: company.id, name: 'logo').count,
                 'Não deve ter attachment antes do upload'

    file = fixture_file_upload('profile.jpg', 'image/jpeg')
    patch upload_logo_api_v1_account_settings_url, params: { logo: file }, headers: @auth
    assert_response :success

    assert_equal 1, ActiveStorage::Attachment.where(record_id: company.id, name: 'logo').count,
                 'Deve ter exatamente 1 attachment no banco após upload'

    attachment = ActiveStorage::Attachment.find_by(record_id: company.id, name: 'logo')
    assert attachment.blob.present?, 'Blob deve estar presente'
    assert_equal 'profile.jpg', attachment.blob.filename.to_s
  end

  # ── Cenário 9: cover_image é salvo no banco ──────────────────────────────────

  test 'upload_cover persists ActiveStorage::Attachment record to database' do
    company = @account.company
    assert_equal 0, ActiveStorage::Attachment.where(record_id: company.id, name: 'cover_image').count

    file = fixture_file_upload('profile.jpg', 'image/jpeg')
    patch upload_cover_api_v1_account_settings_url, params: { cover: file }, headers: @auth
    assert_response :success

    assert_equal 1, ActiveStorage::Attachment.where(record_id: company.id, name: 'cover_image').count,
                 'Deve ter exatamente 1 cover_image no banco após upload'
  end

  # ── Cenário 10: segundo upload substitui sem duplicar ────────────────────────

  test 'second upload_logo replaces previous without duplicating' do
    company = @account.company
    file = fixture_file_upload('profile.jpg', 'image/jpeg')

    patch upload_logo_api_v1_account_settings_url, params: { logo: file }, headers: @auth
    assert_response :success
    first_url = response.parsed_body['logo_url']

    patch upload_logo_api_v1_account_settings_url, params: { logo: file }, headers: @auth
    assert_response :success
    second_url = response.parsed_body['logo_url']

    count = ActiveStorage::Attachment.where(record_id: company.id, name: 'logo').count
    assert_equal 1, count, "Não deve duplicar attachments — encontrou #{count}"
    assert_not_equal first_url, second_url, 'Segunda URL deve ser diferente (novo blob)'
  end

  # ── Cenário 11: account_id do attachment bate com a conta que fez upload ────

  test 'attachment account_id matches the uploading account' do
    company = @account.company
    file = fixture_file_upload('profile.jpg', 'image/jpeg')

    patch upload_logo_api_v1_account_settings_url, params: { logo: file }, headers: @auth
    assert_response :success

    attachment = ActiveStorage::Attachment.find_by(record_id: company.id, name: 'logo')
    assert_not_nil attachment, 'Attachment deve existir no banco'
    assert_equal @account.id, attachment.account_id,
                 'account_id do attachment deve corresponder à conta que fez o upload'
  end
end
