# frozen_string_literal: true

module Api
  module V1
    module Coaching
      # Saldo de créditos de áudio da conta autenticada — para o app exibir
      # "X áudios restantes" e o aviso de recarga.
      class CreditsController < ApplicationController
        def show
          credits = ::Coaching::CreditsService.for(Current.account)

          render json: {
            balance:           credits.balance,
            monthly_allowance: credits.monthly_allowance,
            renews_at:         credits.renews_at&.iso8601,
            recharge_pack:     CoachingCreditWallet::RECHARGE_PACK_SIZE
          }
        end
      end
    end
  end
end
