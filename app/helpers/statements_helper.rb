module StatementsHelper
  def statement_path_by_state(statement)
    polymorphic_path([statement.current_state.name, :statement], statement)
  end
end
