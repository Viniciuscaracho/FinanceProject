# frozen_string_literal: true

require 'test_helper'

class Coaching::StructureNoteServiceTest < ActiveSupport::TestCase
  VALID_JSON = {
    'sono'         => '7h',
    'carga'        => 'moderada',
    'observacao'   => 'atleta bem disposto',
    'proxima_acao' => 'aumentar séries na próxima semana'
  }.freeze

  test 'returns structured hash when API responds with valid JSON' do
    stub_anthropic_ok(VALID_JSON.to_json)

    result = Coaching::StructureNoteService.new('treinou bem, dormiu 7h').call

    assert_equal '7h',          result[:sono]
    assert_equal 'moderada',    result[:carga]
    assert_equal 'atleta bem disposto', result[:observacao]
    assert_equal 'aumentar séries na próxima semana', result[:proxima_acao]
  end

  test 'falls back when API returns malformed JSON' do
    stub_anthropic_ok('não é json válido')

    input  = 'texto livre do treinador'
    result = Coaching::StructureNoteService.new(input).call

    assert_nil result[:sono]
    assert_nil result[:carga]
    assert_equal input, result[:observacao]
    assert_nil result[:proxima_acao]
  end

  test 'falls back when HTTParty raises a network error' do
    HTTParty.stubs(:post).raises(SocketError, 'connection refused')

    input  = 'algo aconteceu com a rede'
    result = Coaching::StructureNoteService.new(input).call

    assert_nil result[:sono]
    assert_equal input, result[:observacao]
  end

  test 'falls back when API returns non-2xx (e.g. 401 missing key)' do
    stub_anthropic_error(401, '{"error":"unauthorized"}')

    input  = 'sem chave de api'
    result = Coaching::StructureNoteService.new(input).call

    assert_equal input, result[:observacao]
  end

  test 'falls back when API returns 429 rate limit' do
    stub_anthropic_error(429, '{"error":"rate_limit_exceeded"}')

    input = 'muitas requisições'
    result = Coaching::StructureNoteService.new(input).call

    assert_equal input, result[:observacao]
  end

  test 'symbolizes keys in parsed response' do
    stub_anthropic_ok(VALID_JSON.to_json)

    result = Coaching::StructureNoteService.new('teste').call
    assert result.key?(:sono), 'Expected symbolized keys'
  end

  private

  def stub_anthropic_ok(text)
    mock_response = mock('response')
    mock_response.stubs(:success?).returns(true)
    mock_response.stubs(:parsed_response).returns({ 'choices' => [{ 'message' => { 'content' => text } }] })
    HTTParty.stubs(:post).returns(mock_response)
  end

  def stub_anthropic_error(code, body)
    mock_response = mock('response')
    mock_response.stubs(:success?).returns(false)
    mock_response.stubs(:code).returns(code)
    mock_response.stubs(:body).returns(body)
    HTTParty.stubs(:post).returns(mock_response)
  end
end
