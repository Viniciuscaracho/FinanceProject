require 'test_helper'

class ReportsControllerTest < ActionDispatch::IntegrationTest
  # setup do
  #   sign_in users(:user_one)
  # end
  #
  # test 'should get index' do
  #   get reports_url
  #   assert_response :success
  # end
  #
  # test 'get a nil dre_graph' do
  #   get reports_url, params: { graph: 'dre_graph', order: 'asc', start_date: Time.now.next_month, end_date: Time.now }
  #   assert assigns(:response)[:gross_income].nil?
  #   assert_response :success
  #   assert_nil session[:user_id]
  #   logout
  #   get reports_url
  #   assert_response :found
  # end
  #
  # test 'get nil out_description_graph' do
  #   get reports_url,
  #       params: { graph: 'out_description_graph', order: 'asc', start_date: Time.now.next_month, end_date: Time.now }
  #
  #   assert_nil assigns(:response).first
  #   assert_response :success
  #   assert_nil session[:user_id]
  #   logout
  #   get reports_url
  #   assert_response :found
  # end
  #
  # test 'get nil in_description_graph' do
  #   get reports_url,
  #       params: { graph: 'in_description_graph', order: 'asc', start_date: Time.now.next_month, end_date: Time.now }
  #
  #   assert_nil assigns(:response).first
  #   assert_response :success
  #   assert_nil session[:user_id]
  #   logout
  #   get reports_url
  #   assert_response :found
  # end
  #
  # test 'get nil out_per_day_graph' do
  #   get reports_url,
  #       params: { graph: 'out_per_day_graph', order: 'asc', start_date: Time.now.next_month, end_date: Time.now }
  #
  #   assert_nil assigns(:response).first
  #   assert_response :success
  #   assert_nil session[:user_id]
  #   logout
  #   get reports_url
  #   assert_response :found
  # end
  #
  # test 'get nil out_per_type_graph' do
  #   get reports_url,
  #       params: { graph: 'out_per_type_graph', order: 'asc', start_date: Time.now.next_month, end_date: Time.now }
  #
  #   assert_nil assigns(:response).first
  #   assert_response :success
  #   assert_nil session[:user_id]
  #   logout
  #   get reports_url
  #   assert_response :found
  # end
  #
  # test 'get nil out_per_category_graph' do
  #   get reports_url,
  #       params: { graph: 'out_per_category_graph', order: 'asc', start_date: Time.now.next_month, end_date: Time.now }
  #
  #   assert_nil assigns(:response).first
  #   assert_response :success
  #   assert_nil session[:user_id]
  #   logout
  #   get reports_url
  #   assert_response :found
  # end
  #
  # test 'get nil out_per_cost_center_graph' do
  #   get reports_url,
  #       params: { graph: 'out_per_cost_center_graph', order: 'asc', start_date: Time.now.next_month,
  #                 end_date: Time.now }
  #
  #   assert_nil assigns(:response).first
  #   assert_response :success
  #   assert_nil session[:user_id]
  #   logout
  #   get reports_url
  #   assert_response :found
  # end
  #
  # test 'get nil in_per_day_graph' do
  #   get reports_url,
  #       params: { graph: 'in_per_day_graph', order: 'asc', start_date: Time.now.next_month, end_date: Time.now }
  #
  #   assert_nil assigns(:response).first
  #   assert_response :success
  #   assert_nil session[:user_id]
  #   logout
  #   get reports_url
  #   assert_response :found
  # end
  #
  # test 'get nil in_per_category_graph' do
  #   get reports_url,
  #       params: { graph: 'in_per_category_graph', order: 'asc', start_date: Time.now.next_month, end_date: Time.now }
  #
  #   assert_nil assigns(:response).first
  #   assert_response :success
  #   assert_nil session[:user_id]
  #   logout
  #   get reports_url
  #   assert_response :found
  # end
  #
  # test 'get nil in_per_cost_center_graph' do
  #   get reports_url,
  #       params: { graph: 'in_per_cost_center_graph', order: 'asc', start_date: Time.now.next_month, end_date: Time.now }
  #
  #   assert_nil assigns(:response).first
  #   assert_response :success
  #   assert_nil session[:user_id]
  #   logout
  #   get reports_url
  #   assert_response :found
  # end
  #
  # test 'get in_per_cost_center_graph' do
  #   get reports_url,
  #       params: { graph: 'in_per_cost_center_graph', start_date: 10.years.ago, end_date: Time.now.end_of_month }
  #
  #   assert_nil assigns(:response).first
  #   assert_response :success
  #   assert_nil session[:user_id]
  #   logout
  #   get reports_url
  #   assert_response :found
  # end
end
