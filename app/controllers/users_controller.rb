# frozen_string_literal: true

class UsersController < ApplicationController
  def index
    # Dados mock para usuários
    @users = [
      OpenStruct.new(
        id: 1,
        name: "Admin Principal",
        email: "admin@financialproject.com",
        role: "admin",
        status: "active",
        last_login: Date.current - 1.day
      ),
      OpenStruct.new(
        id: 2,
        name: "João Silva",
        email: "joao.silva@financialproject.com",
        role: "user",
        status: "active",
        last_login: Date.current - 3.days
      ),
      OpenStruct.new(
        id: 3,
        name: "Maria Santos",
        email: "maria.santos@financialproject.com",
        role: "manager",
        status: "inactive",
        last_login: Date.current - 10.days
      )
    ]
    
    if params[:new_design]
      render layout: 'views_v2/layouts/application'
    end
  end

  def show
    @user = OpenStruct.new(
      id: params[:id],
      name: "Admin Principal",
      email: "admin@financialproject.com",
      role: "admin",
      status: "active",
      last_login: Date.current - 1.day,
      created_at: Date.current - 30.days,
      permissions: ["read", "write", "admin"]
    )
    
    if params[:new_design]
      render layout: 'views_v2/layouts/application'
    end
  end

  def new
    @user = OpenStruct.new
    render layout: 'views_v2/layouts/application' if params[:new_design]
  end

  def edit
    @user = OpenStruct.new(
      id: params[:id],
      name: "Admin Principal",
      email: "admin@financialproject.com",
      role: "admin",
      status: "active",
      last_login: Date.current - 1.day,
      created_at: Date.current - 30.days,
      permissions: ["read", "write", "admin"]
    )
    render layout: 'views_v2/layouts/application' if params[:new_design]
  end
end
