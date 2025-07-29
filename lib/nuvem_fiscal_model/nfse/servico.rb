# frozen_string_literal: true

module NuvemFiscalModel
  module Nfse
    # {
    #   "locPrest": {}    # LocPrest object
    #   "cServ": {}       # CServ object
    #   "comExt": {}      # ComExt object
    #   "lsadppu": {}     # Lsadppu object
    #   "obra": {} #      # Obra object
    #   "atvEvento": {}   # AtvEvento object
    #   "explRod": {}     # ExplRod object
    #   "infoCompl": {}   # InfoCompl object
    # }
    class Servico < NuvemFiscalModel::Base
      attr_accessor :locPrest, :cServ, :comExt, :lsadppu, :obra, :atvEvento, :explRod, :infoCompl

      validates :cServ, presence: true

      def initialize(attributes = {})
        attributes.each do |name, value|
          value = case name.to_s
                  when 'locPrest'
                    LocPrest.new(value)
                  when 'cServ'
                    CServ.new(value)
                  when 'comExt'
                    ComExt.new(value)
                  when 'lsadppu'
                    Lsadppu.new(value)
                  when 'obra'
                    Obra.new(value)
                  when 'atvEvento'
                    AtvEvento.new(value)
                  when 'explRod'
                    ExplRod.new(value)
                  when 'infoCompl'
                    InfoCompl.new(value)
                  else
                    value
                  end
          send("#{name}=", value)
        end
        super
      end
    end
  end
end
