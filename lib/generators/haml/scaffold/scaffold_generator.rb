# frozen_string_literal: true

require 'rails/generators/erb/scaffold/scaffold_generator'

module Haml
  module Generators
    class ScaffoldGenerator < Erb::Generators::ScaffoldGenerator
      source_root File.expand_path("../templates", __FILE__)

      def copy_view_files
        available_views.each do |view|
          filename = filename_with_extensions(view)
          template "#{view}.html.haml", File.join("app/views", controller_file_path, filename)
        end
        template "partial.html.haml", File.join("app/views", controller_file_path, "_#{singular_name}.html.haml")
        template "create.turbo_stream.haml", File.join("app/views", controller_file_path, "create.turbo_stream.haml")
        template "update.turbo_stream.haml", File.join("app/views", controller_file_path, "update.turbo_stream.haml")
        template "destroy.turbo_stream.haml", File.join("app/views", controller_file_path, "destroy.turbo_stream.haml")
      end

      hook_for :form_builder, :as => :scaffold

      def copy_form_file
        if options[:form_builder].nil?
          filename = filename_with_extensions("_form")
          template "_form.html.haml", File.join("app/views", controller_file_path, filename)
        end
      end

      protected

      def available_views
        %w(index edit show new)
      end

      def handler
        :haml
      end

    end
  end
end