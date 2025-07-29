# frozen_string_literal: true

require 'test_helper'

module Integrations
  module NuvemFiscal
    class EmitirNfseTest < ActiveSupport::TestCase
      setup do
        _, @account = register_user
        @integration_store = create_sample_nuvem_store
        @company = @account.reload.company
        @account_store = IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(@account.id)
        @invoiceable = OpenStruct.new(
          id: 1,
          account: @account,
          dto: mock_payload,
          able_to_send_nfse?: true
        )
      end

      test 'should emitir nfse in Nuvem Fiscal to update logs to processing and dispatch job' do
        Time.stubs(:current).returns(Time.parse('2024-01-01 00:00:00'))
        mock_response = file_fixture('nuvem_fiscal/emitir_nfse.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :emitir_nfse,
          account_id: @account.id,
          payload: @invoiceable.dto.to_h,
          params: {}
        ).returns(
          OpenStruct.new(
            success?: true,
            body: mock_json_response,
            response: OpenStruct.new(
              code: '200',
              body: mock_response
            )
          )
        )
        mock_set = mock
        Integrations::NuvemFiscal::CheckInvoiceStatusJob.expects(:set).with(wait: 5.seconds).returns(mock_set)
        mock_set.expects(:perform_later).returns(true)
        CompanyNfseConfigs::SyncRpsNumberingSubscriber.any_instance.expects(:on_relationship_store_updated).at_least_once
        result = Integrations::NuvemFiscal::EmitirNfse.call(company: @company, invoiceable: @invoiceable)
        assert result.success?
        assert result.relationship.sender_processing?
        assert 1, result.relationship.sender_logs.size
      end

      test 'should emitir nfse in Nuvem Fiscal to update logs to success when autorizada' do
        Time.stubs(:current).returns(Time.parse('2024-01-01 00:00:00'))
        mock_response = file_fixture('nuvem_fiscal/consultar_nfse_autorizada.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :emitir_nfse,
          account_id: @account.id,
          payload: @invoiceable.dto.to_h,
          params: {}
        ).returns(
          OpenStruct.new(
            success?: true,
            body: mock_json_response,
            response: OpenStruct.new(
              code: '200',
              body: mock_response
            )
          )
        )
        Integrations::NuvemFiscal::CheckInvoiceStatusJob.expects(:set).never
        CompanyNfseConfigs::SyncRpsNumberingSubscriber.any_instance.expects(:on_relationship_store_updated).at_least_once
        result = Integrations::NuvemFiscal::EmitirNfse.call(company: @company, invoiceable: @invoiceable)
        assert result.success?
        assert result.relationship.sender_synced?
        assert 1, result.relationship.sender_logs.size
      end

      test 'should emitir nfse in Nuvem Fiscal to update logs to failed when erro result' do
        Time.stubs(:current).returns(Time.parse('2024-01-01 00:00:00'))
        mock_response = file_fixture('nuvem_fiscal/consultar_nfse_erro.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :emitir_nfse,
          account_id: @account.id,
          payload: @invoiceable.dto.to_h,
          params: {}
        ).returns(
          OpenStruct.new(
            success?: true,
            body: mock_json_response,
            response: OpenStruct.new(
              code: '200',
              body: mock_response
            )
          )
        )
        Integrations::NuvemFiscal::CheckInvoiceStatusJob.expects(:set).never
        CompanyNfseConfigs::SyncRpsNumberingSubscriber.any_instance.expects(:on_relationship_store_updated).at_least_once
        result = Integrations::NuvemFiscal::EmitirNfse.call(company: @company, invoiceable: @invoiceable)
        assert result.failure?
        assert result.relationship.sender_failed?
        assert 1, result.relationship.sender_logs.size
      end

      test 'should emitir nfse in Nuvem Fiscal to update logs to failed when negada result' do
        Time.stubs(:current).returns(Time.parse('2024-01-01 00:00:00'))
        mock_response = file_fixture('nuvem_fiscal/consultar_nfse_negada.json').read
        mock_json_response = JSON.parse(mock_response, symbolize_names: true)
        Integrations::NuvemFiscal::Client.expects(:call).with(
          endpoint_key: :emitir_nfse,
          account_id: @account.id,
          payload: @invoiceable.dto.to_h,
          params: {}
        ).returns(
          OpenStruct.new(
            success?: true,
            body: mock_json_response,
            response: OpenStruct.new(
              code: '200',
              body: mock_response
            )
          )
        )
        Integrations::NuvemFiscal::CheckInvoiceStatusJob.expects(:set).never
        CompanyNfseConfigs::SyncRpsNumberingSubscriber.any_instance.expects(:on_relationship_store_updated).at_least_once
        result = Integrations::NuvemFiscal::EmitirNfse.call(company: @company, invoiceable: @invoiceable)
        assert result.failure?
        assert result.relationship.sender_failed?
        assert 1, result.relationship.sender_logs.size
      end

      private

      # TODO: this should be changed after the implementation of the real payload
      def mock_payload
        mock = {
          provedor: 'padrao',
          ambiente: 'homologacao',
          referencia: 'hmg20', # this should be the reference of the nfse (example: Invoice.id)
          infDPS: {
            tpAmb: 2,
            dhEmi: Time.current.strftime('%Y-%m-%dT%H:%M:%SZ'),
            dCompet: Time.current.strftime('%Y-%m-%d'),
            prest: {
              CNPJ: @company.document_1
            },
            toma: {
              xNome: 'A4PI SOFTWARE E SEVICOS LTDA ME',
              CNPJ: '21067676000172',
              IM: '101907',
              fone: '45988115410',
              email: 'thiagobonfante@gmail.com',
              end: {
                endNac: {
                  cMun: '4107207',
                  CEP: '85660000'
                },
                xLgr: 'VALERIO ZAMBONI',
                nro: '76',
                xBairro: 'VITORIA'
              }
            },
            serv: {
              cServ: {
                cTribNac: '1.04',
                xDescServ: 'Analise e desenvolvimento de software'
              }
            },
            valores: {
              vServPrest: {
                vServ: 100.0
              },
              trib: {
                tribMun: {
                  tribISSQN: 1,
                  pAliq: 2,
                  tpRetISSQN: 1
                }
              }
            }
          }
        }
        # convert all keys from mock to "string" symbols
        mock.stringify_keys
      end
    end
  end
end
