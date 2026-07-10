# frozen_string_literal: true

require 'test_helper'

class Coaching::TranscribeAudioServiceTest < ActiveSupport::TestCase
  def stub_http(status_class, body)
    mock_response = mock('http_response')
    mock_response.stubs(:is_a?).with(Net::HTTPSuccess).returns(status_class == Net::HTTPSuccess)
    mock_response.stubs(:code).returns(status_class == Net::HTTPSuccess ? '200' : '500')
    mock_response.stubs(:body).returns(body)

    mock_http = mock('http')
    mock_http.stubs(:use_ssl=)
    mock_http.stubs(:read_timeout=)
    mock_http.stubs(:request).returns(mock_response)

    Net::HTTP.stubs(:new).returns(mock_http)
  end

  def fake_audio_file(content: 'FAKE_AUDIO', filename: 'rec.webm', type: 'audio/webm')
    file = Rack::Test::UploadedFile.new(
      StringIO.new(content),
      type,
      original_filename: filename
    )
    file
  end

  test 'retorna transcrição em texto simples quando API responde com sucesso' do
    stub_http(Net::HTTPSuccess, 'atleta relatou dor no joelho esquerdo')

    result = Coaching::TranscribeAudioService.new(fake_audio_file).call
    assert_equal 'atleta relatou dor no joelho esquerdo', result
  end

  test 'retorna nil quando API responde com erro' do
    stub_http(Net::HTTPServerError, '{"error":"model_not_found"}')

    result = Coaching::TranscribeAudioService.new(fake_audio_file).call
    assert_nil result
  end

  test 'retorna nil e não levanta exceção quando conexão falha' do
    Net::HTTP.stubs(:new).raises(SocketError, 'connection refused')

    result = Coaching::TranscribeAudioService.new(fake_audio_file).call
    assert_nil result
  end

  test 'retorna nil quando read_timeout expira' do
    Net::HTTP.stubs(:new).raises(Net::ReadTimeout)

    result = Coaching::TranscribeAudioService.new(fake_audio_file).call
    assert_nil result
  end

  test 'remove espaços em branco extras da transcrição' do
    stub_http(Net::HTTPSuccess, "  treino pesado hoje  \n")

    result = Coaching::TranscribeAudioService.new(fake_audio_file).call
    assert_equal 'treino pesado hoje', result
  end
end
