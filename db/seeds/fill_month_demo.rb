# frozen_string_literal: true
# Script para preencher a agenda do mês inteiro para fins de demonstração.
# Execução: rails runner db/seeds/fill_month_demo.rb
# Remoção:  Appointment.where(is_demo: true).destroy_all

TOKEN      = 'bS0y5H0KPp4Bqki3zMFCByfzR5CrT0ns'.freeze
TARGET_MONTH = Date.new(2026, 6, 1)

link = AppointmentLink.find_by(token: TOKEN)
unless link
  puts "❌ AppointmentLink não encontrado para token: #{TOKEN}"
  exit
end

account    = link.account
account_user_id = link.account_user_id
service_id = link.service_id

unless account_user_id
  puts "❌ AppointmentLink não tem profissional fixo. Informe o account_user_id manualmente."
  exit
end

account_user = account.account_users.find(account_user_id)
service = service_id ? account.services.find(service_id) : account.services.where(enabled: 't').first

unless service
  puts "❌ Nenhum serviço encontrado para a conta."
  exit
end

settings       = link.settings.presence || {}
start_hour     = [settings['start_hour']&.to_i || 9, 9].max
end_hour       = [settings['end_hour']&.to_i   || 18, 18].min
slot_duration  = service.metadata&.dig('duration_minutes')&.to_i ||
                 settings['default_duration_minutes']&.to_i || 60
slot_interval  = [settings['slot_interval_minutes']&.to_i || 30, slot_duration].max
price_cents    = service.selling_price_cents

puts "=== Configuração ==="
puts "  Conta:       #{account.name}"
puts "  Profissional: #{account_user.user.first_name} #{account_user.user.last_name}"
puts "  Serviço:     #{service.name} (#{slot_duration} min, R$ #{price_cents / 100.0})"
puts "  Horários:    #{start_hour}h às #{end_hour}h, slots de #{slot_interval} min"
puts "  Mês:         #{TARGET_MONTH.strftime('%B/%Y')}"
puts

FAKE_CLIENTS = [
  { first_name: 'Ana',      last_name: 'Souza',     phone: '11991110001' },
  { first_name: 'Bruno',    last_name: 'Almeida',   phone: '11991110002' },
  { first_name: 'Carla',    last_name: 'Ferreira',  phone: '11991110003' },
  { first_name: 'Diego',    last_name: 'Lima',      phone: '11991110004' },
  { first_name: 'Elisa',    last_name: 'Martins',   phone: '11991110005' },
  { first_name: 'Fabio',    last_name: 'Rocha',     phone: '11991110006' },
  { first_name: 'Gabriela', last_name: 'Costa',     phone: '11991110007' },
  { first_name: 'Henrique', last_name: 'Pereira',   phone: '11991110008' },
  { first_name: 'Isabela',  last_name: 'Neves',     phone: '11991110009' },
  { first_name: 'João',     last_name: 'Cardoso',   phone: '11991110010' },
  { first_name: 'Kamila',   last_name: 'Ribeiro',   phone: '11991110011' },
  { first_name: 'Lucas',    last_name: 'Teixeira',  phone: '11991110012' },
  { first_name: 'Mariana',  last_name: 'Araújo',    phone: '11991110013' },
  { first_name: 'Nicolas',  last_name: 'Barbosa',   phone: '11991110014' },
  { first_name: 'Olivia',   last_name: 'Carvalho',  phone: '11991110015' },
  { first_name: 'Paulo',    last_name: 'Mendes',    phone: '11991110016' },
  { first_name: 'Renata',   last_name: 'Gomes',     phone: '11991110017' },
  { first_name: 'Samuel',   last_name: 'Nascimento',phone: '11991110018' },
  { first_name: 'Tatiane',  last_name: 'Pinto',     phone: '11991110019' },
  { first_name: 'Ursula',   last_name: 'Monteiro',  phone: '11991110020' },
].freeze

# Cria ou recupera contatos demo
contacts = FAKE_CLIENTS.map do |c|
  ActsAsTenant.with_tenant(account) do
    Contact.find_or_create_by!(account: account, cell_phone_number: c[:phone]) do |ct|
      ct.first_name        = c[:first_name]
      ct.last_name         = c[:last_name]
      ct.contact_type_cd   = Contact::CONTACT_TYPES[:customer]
    end
  end
end

created = 0
skipped = 0
client_index = 0

days_in_month = TARGET_MONTH.end_of_month.day

(1..days_in_month).each do |day|
  date = Date.new(TARGET_MONTH.year, TARGET_MONTH.month, day)
  next if date.saturday? || date.sunday?

  current_time = date.beginning_of_day + start_hour.hours

  while current_time < date.beginning_of_day + end_hour.hours
    slot_end = current_time + slot_duration.minutes
    break if slot_end > date.beginning_of_day + end_hour.hours

    contact = contacts[client_index % contacts.size]
    client_index += 1

    ActsAsTenant.with_tenant(account) do
      existing = Appointment.find_by(
        account_user_id: account_user_id,
        start_time: current_time
      )

      if existing
        skipped += 1
      else
        Appointment.create!(
          account:              account,
          account_user:         account_user,
          service:              service,
          contact:              contact,
          appointment_link:     link,
          start_time:           current_time,
          end_time:             slot_end,
          price_cents:          price_cents,
          price_currency:       'BRL',
          status:               :confirmed,
          payment_status:       :paid,
          whatsapp_number:      contact.cell_phone_number,
          is_demo:              true,
          whatsapp_reminder_sent:    true,
          whatsapp_1h_reminder_sent: true,
          billing_notification_sent: true,
          pix_reminder_sent:         true,
          overdue_notification_sent: true
        )
        created += 1
      end
    end

    current_time += slot_interval.minutes
  end
end

puts "✅ Concluído!"
puts "   Criados:   #{created} agendamentos demo"
puts "   Ignorados: #{skipped} (já existiam)"
puts
puts "Para remover depois: Appointment.where(is_demo: true).destroy_all"
