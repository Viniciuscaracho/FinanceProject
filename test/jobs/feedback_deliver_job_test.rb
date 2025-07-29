# require "test_helper"
#
# class FeedbackDeliverJobTest < ActiveJob::TestCase
#   setup do
#     @user, @account = register_user
#     @feedback = Feedback.create(user: @user, rating: 5, observations: "Teste de observação")
#     @url = Rails.application.credentials.discord.webhook_url
#   end
#
#   test 'should deliver discord message' do
#     payload = FeedbackDeliverJob.new.send(:message_json, @feedback)
#
#     HTTParty.expects(:post)
#             .once.with(@url,
#                        body: payload.to_json,
#                        headers: { 'Content-Type' => 'application/json' })
#             .returns(OpenStruct.new(success?: true, code: 200))
#
#     FeedbackDeliverJob.perform_now(@feedback.id)
#   end
#
#   test 'should retry discord delivery on failure' do
#     payload = FeedbackDeliverJob.new.send(:message_json, @feedback)
#
#     HTTParty.expects(:post)
#             .once.with(@url,
#                        body: payload.to_json,
#                        headers: { 'Content-Type' => 'application/json' })
#             .returns(OpenStruct.new(success?: false, code: 500))
#
#     assert_enqueued_with(job: FeedbackDeliverJob) do
#       FeedbackDeliverJob.perform_now(@feedback.id)
#     end
#   end
#
#   test 'should not retry when discord delivery is successful after failure' do
#     payload = FeedbackDeliverJob.new.send(:message_json, @feedback)
#
#     HTTParty.expects(:post)
#             .twice.with(@url,
#                         body: payload.to_json,
#                         headers: { 'Content-Type' => 'application/json' })
#             .returns(OpenStruct.new(success?: false, code: 500), OpenStruct.new(success?: true, code: 200))
#
#     assert_enqueued_with(job: FeedbackDeliverJob) do
#       FeedbackDeliverJob.perform_now(@feedback.id)
#     end
#
#     assert_no_enqueued_jobs(only: FeedbackDeliverJob) do
#       FeedbackDeliverJob.perform_now(@feedback.id)
#     end
#   end
# end