module DocumentTemplatesHelper

  def can_access_document_templates?
    DocumentTemplate.subclasses.each do |subclass|
      return true if can?(:read, subclass)
    end

    false
  end

end
