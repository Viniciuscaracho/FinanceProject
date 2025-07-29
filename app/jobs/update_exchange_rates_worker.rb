class UpdateExchangeRatesWorker
  include Sidekiq::Worker

  def perform
    Money.default_bank.update_rates
  end
end
