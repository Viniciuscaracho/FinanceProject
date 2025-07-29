# == Schema Information
#
# Table name: document_template_seeds
#
#  id          :bigint           not null, primary key
#  content     :text
#  description :string
#  title       :string
#  type        :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
require "test_helper"

class DocumentTemplateSeedTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
