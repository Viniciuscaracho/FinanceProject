# frozen_string_literal: true

require 'test_helper'

class Coaching::ParseAudioContextServiceTest < ActiveSupport::TestCase
  setup do
    stub_anthropic({ athlete_name: 'João Silva', sono: '7h', carga: 'moderada',
                     observacao: 'atleta motivado', proxima_acao: 'aumentar carga',
                     goal: 'hipertrofia', days_to_reassessment: 15 }.to_json)
  end

  test 'retorna hash com todos os campos esperados' do
    result = Coaching::ParseAudioContextService.new('João Silva, treino bom').call

    assert_equal 'João Silva', result[:athlete_name]
    assert_equal '7h',         result[:sono]
    assert_equal 'moderada',   result[:carga]
    assert_equal 15,           result[:days_to_reassessment]
    assert_equal 'hipertrofia', result[:goal]
  end

  test 'retorna fallback quando API falha' do
    HTTParty.stubs(:post).raises(SocketError, 'connection refused')

    result = Coaching::ParseAudioContextService.new('texto qualquer').call

    assert_nil result[:athlete_name]
    assert_nil result[:goal]
    assert_equal 'texto qualquer', result[:observacao]
  end

  test 'retorna fallback quando resposta não é JSON válido' do
    stub_anthropic('resposta inválida não-JSON')

    result = Coaching::ParseAudioContextService.new('texto').call

    assert_nil result[:athlete_name]
    assert_equal 'texto', result[:observacao]
  end

  test 'aceita resposta com markdown code fence' do
    stub_anthropic("```json\n#{({ athlete_name: 'Maria', goal: 'emagrecimento', days_to_reassessment: 30 }).to_json}\n```")

    result = Coaching::ParseAudioContextService.new('Maria, objetivo emagrecer').call

    assert_equal 'Maria',          result[:athlete_name]
    assert_equal 'emagrecimento',  result[:goal]
    assert_equal 30,               result[:days_to_reassessment]
  end

  test 'days_to_reassessment pode ser null' do
    stub_anthropic({ athlete_name: 'Pedro', days_to_reassessment: nil }.to_json)

    result = Coaching::ParseAudioContextService.new('Pedro, treino leve').call

    assert_nil result[:days_to_reassessment]
  end

  private

  def stub_anthropic(json_text)
    mock_resp = mock('response')
    mock_resp.stubs(:success?).returns(true)
    mock_resp.stubs(:parsed_response).returns({ 'choices' => [{ 'message' => { 'content' => json_text } }] })
    HTTParty.stubs(:post).returns(mock_resp)
  end
end
