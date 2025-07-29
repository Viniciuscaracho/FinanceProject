# require "test_helper"
#
# class FeedbacksControllerTest < ActionDispatch::IntegrationTest
#   setup do
#     @user, @account = register_user
#     sign_in(@user)
#   end
#
#   test "should get new" do
#     get new_feedback_url(format: :turbo_stream)
#     assert_response :success
#   end
#
#   test "should create feedback" do
#     assert_difference('Feedback.count') do
#       post feedbacks_path(format: :turbo_stream), params: { feedback: { user_id: @user.id, rating: 5, observations: "Great feedback!" } }
#     end
#
#     assert_response :success
#     assert_select 'turbo-stream[target=?]', 'flash'
#     assert_select 'turbo-stream[action=?]', 'update'
#   end
#
#   test "should not create feedback with invalid params" do
#     assert_no_difference('Feedback.count') do
#       post feedbacks_url, params: { feedback: { user_id: nil, rating: nil, observations: nil } }
#     end
#   end
# end