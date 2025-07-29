# frozen_string_literal: true

require "test_helper"

class WebhookDeliverJobTest < ActiveJob::TestCase
  setup do
    @user, @account = register_user
    @webhook = create_webhook(@account)
    @webhook_payload = create_webhook_payload
  end

  test 'should deliver webhook' do
    body = { "event": 'transaction_created', "data": @webhook_payload }

    HTTParty.expects(:post)
            .once.with(@webhook.url,
                       body: body.to_json,
                       headers: { 'Content-Type' => 'application/json' })
            .returns(
              OpenStruct.new(success?: true, code: 200)
            )

    WebhookDeliverJob.perform_now(webhook: @webhook, payload: @webhook_payload, event_name: 'transaction_created')

  end

  test 'should retry webhook delivery' do
    body = { "event": 'transaction_created', "data": @webhook_payload }

    HTTParty.expects(:post)
            .once.with(@webhook.url,
                       body: body.to_json,
                       headers: { 'Content-Type' => 'application/json' })
            .returns(
              OpenStruct.new(success?: false, code: 500)
            )

    assert_enqueued_with(job: WebhookDeliverJob, queue: 'webhook_retries') do
      WebhookDeliverJob.perform_now(webhook: @webhook, payload: @webhook_payload, event_name: 'transaction_created')
    end
  end

  test 'should not retry when webhook delivery is successful' do
    body = { "event": 'transaction_created', "data": @webhook_payload }

    HTTParty.expects(:post)
            .once.with(@webhook.url,
                       body: body.to_json,
                       headers: { 'Content-Type' => 'application/json' })
            .returns(
              OpenStruct.new(success?: false, code: 500)
            )

    assert_enqueued_with(job: WebhookDeliverJob, queue: 'webhook_retries') do
      WebhookDeliverJob.perform_now(webhook: @webhook, payload: @webhook_payload, event_name: 'transaction_created')
    end

    HTTParty.expects(:post)
            .once.with(@webhook.url,
                       body: body.to_json,
                       headers: { 'Content-Type' => 'application/json' })
            .returns(
              OpenStruct.new(success?: true, code: 200)
            )

    assert_no_enqueued_jobs(only: WebhookDeliverJob) do
      WebhookDeliverJob.perform_now(webhook: @webhook, payload: @webhook_payload, event_name: 'transaction_created')
    end
  end

  test 'should update webhook last response' do
    body = { "event": 'transaction_created', "data": @webhook_payload }

    HTTParty.expects(:post)
            .once.with(@webhook.url,
                       body: body.to_json,
                       headers: { 'Content-Type' => 'application/json' })
            .returns(
              OpenStruct.new(success?: true, code: 200)
            )

    WebhookDeliverJob.perform_now(webhook: @webhook, payload: @webhook_payload, event_name: 'transaction_created')

    assert_equal 200, @webhook.reload.last_response
    assert_not_nil @webhook.reload.last_used_at
  end

  test 'should not deliver webhook when webhook is blank' do
    HTTParty.expects(:post).never

    WebhookDeliverJob.perform_now(webhook: nil, payload: @webhook_payload, event_name: 'transaction_created')
  end


end
