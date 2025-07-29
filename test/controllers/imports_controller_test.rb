require 'test_helper'

class ImportsControllerTest < ActionDispatch::IntegrationTest
  # setup do
  #   @import = imports(:import_one)
  #   @bank = bank_accounts(:bank_one)
  #   @user = users(:user_one)
  #   @account = accounts(:account)
  #   sign_in(@user)
  # end
  #
  # test 'should get index' do
  #   get imports_url
  #   assert_response :success
  # end
  #
  # test 'should get new' do
  #   get new_import_url
  #   assert_response :success
  # end
  #
  # test 'should create import' do
  #   assert_difference('Import.count') do
  #     post imports_url,
  #          params: { import: { account_id: @import.account_id, progress_number: @import.progress_number,
  #                              progress_total: @import.progress_total, source_cd: @import.source_cd, state: :in_progress } }
  #   end
  #   assert_equal 'Importação iniciada com sucesso', flash[:notice]
  #   assert_redirected_to imports_url
  # end
  #
  # test 'should show import' do
  #   get import_url(@import)
  #   assert_response :found
  # end
  #
  # test 'should get edit' do
  #   get edit_import_url(@import)
  #   assert_response :success
  # end
  #
  # test 'should update import' do
  #   patch import_url(@import),
  #         params: { import: { account_id: @import.account_id, progress_number: @import.progress_number,
  #                             progress_total: @import.progress_total, source_cd: @import.source_cd } }
  #   assert_response :found
  # end
  #
  # test 'should destroy import' do
  #   assert_difference('Import.count', -1) do
  #     delete import_url(@import)
  #   end
  #
  #   assert_redirected_to imports_url
  # end
  #
  # # fails
  #
  # test 'should get index:fail' do
  #   sign_out(@user)
  #   get imports_url
  #   assert_response :found
  # end
  #
  # test 'should get new:fail' do
  #   sign_out(@user)
  #   get new_import_url
  #   assert_response :found
  # end
  #
  # test 'should not save a import' do
  #   import = Import.new
  #   assert_not import.save
  # end
end
