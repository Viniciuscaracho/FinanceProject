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
    mock_response = mock('response')
    mock_response.stubs(:parsed_response).returns({
      'content' => [{ 'text' => VALID_JSON.to_json }]
    })
    HTTParty.stubs(:post).returns(mock_response)

    result = Coaching::StructureNoteService.new('treinou bem, dormiu 7h').call

    assert_equal '7h',          result[:sono]
    assert_equal 'moderada',    result[:carga]
    assert_equal 'atleta bem disposto', result[:observacao]
    assert_equal 'aumentar séries na próxima semana', result[:proxima_acao]
  end

  test 'falls back when API returns malformed JSON' do
    mock_response = mock('response')
    mock_response.stubs(:parsed_response).returns({
      'content' => [{ 'text' => 'não é json válido' }]
    })
    HTTParty.stubs(:post).returns(mock_response)

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

  test 'falls back when API key is absent (nil response content)' do
    mock_response = mock('response')
    mock_response.stubs(:parsed_response).returns({ 'error' => 'unauthorized' })
    HTTParty.stubs(:post).returns(mock_response)

    input  = 'sem chave de api'
    result = Coaching::StructureNoteService.new(input).call

    assert_equal input, result[:observacao]
  end

  test 'symbolizes keys in parsed response' do
    mock_response = mock('response')
    mock_response.stubs(:parsed_response).returns({
      'content' => [{ 'text' => VALID_JSON.to_json }]
    })
    HTTParty.stubs(:post).returns(mock_response)

    result = Coaching::StructureNoteService.new('teste').call
    assert result.key?(:sono), 'Expected symbolized keys'
  end
end
