# frozen_string_literal: true

require 'test_helper'

module GoogleCalendar
  class SyncAppointmentTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @account_user = @account.account_users.first
      @account_user.update!(schedule: {
        'monday'    => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 20 },
        'tuesday'   => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 20 },
        'wednesday' => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 20 },
        'thursday'  => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 20 },
        'friday'    => { 'enabled' => true, 'start_hour' => 8, 'end_hour' => 20 }
      })
      @service = create_service(@account)
      @contact = create_contact(@account)

      # Silencia os jobs disparados pelos callbacks do Appointment
      GoogleCalendarSyncJob.stubs(:perform_later)
    end

    def make_appointment(overrides = {})
      tomorrow = next_weekday
      @account.appointments.create!({
        account_user:    @account_user,
        service:         @service,
        contact:         @contact,
        start_time:      tomorrow,
        end_time:        tomorrow + 1.hour,
        price_cents:     5000,
        whatsapp_number: '5511900000001',
        status:          :confirmed,
        payment_status:  :pending
      }.merge(overrides))
    end

    def next_weekday
      t = 1.day.from_now.change(hour: 10, min: 0, sec: 0)
      t += 1.day while [0, 6].include?(t.wday)
      t
    end

    # ─────────────────────────────────────────────────────────────────────
    # Conta não conectada
    # ─────────────────────────────────────────────────────────────────────

    test "retorna silenciosamente quando a conta não tem Google Calendar conectado" do
      # Conta sem colunas de Google Calendar → google_calendar_connected? false
      GoogleCalendar::CreateEvent.expects(:call).never
      GoogleCalendar::UpdateEvent.expects(:call).never
      GoogleCalendar::DeleteEvent.expects(:call).never

      appointment = make_appointment
      result = GoogleCalendar::SyncAppointment.call(appointment: appointment)
      assert result.success?
    end

    # ─────────────────────────────────────────────────────────────────────
    # Criar evento (google_calendar_event_id ausente)
    # ─────────────────────────────────────────────────────────────────────

    test "chama CreateEvent quando agendamento não tem google_calendar_event_id" do
      connect_calendar(@account)
      appointment = make_appointment

      create_result = stub(success?: true)
      GoogleCalendar::CreateEvent.expects(:call).once
        .with(appointment: appointment)
        .returns(create_result)
      GoogleCalendar::UpdateEvent.expects(:call).never
      GoogleCalendar::DeleteEvent.expects(:call).never

      GoogleCalendar::SyncAppointment.call(appointment: appointment)
    end

    # ─────────────────────────────────────────────────────────────────────
    # Atualizar evento (google_calendar_event_id presente)
    # ─────────────────────────────────────────────────────────────────────

    test "chama UpdateEvent quando agendamento já tem google_calendar_event_id" do
      connect_calendar(@account)
      appointment = make_appointment
      appointment.update_columns(google_calendar_event_id: 'evt_existente_123')

      update_result = stub(success?: true)
      GoogleCalendar::UpdateEvent.expects(:call).once
        .with(appointment: appointment)
        .returns(update_result)
      GoogleCalendar::CreateEvent.expects(:call).never
      GoogleCalendar::DeleteEvent.expects(:call).never

      GoogleCalendar::SyncAppointment.call(appointment: appointment)
    end

    # ─────────────────────────────────────────────────────────────────────
    # Deletar evento (agendamento cancelado)
    # ─────────────────────────────────────────────────────────────────────

    test "chama DeleteEvent quando agendamento está cancelado" do
      connect_calendar(@account)
      appointment = make_appointment
      appointment.update_columns(
        status:                  Appointment::APPOINTMENT_STATUS[:canceled],
        google_calendar_event_id: 'evt_para_deletar'
      )

      delete_result = stub(success?: true)
      GoogleCalendar::DeleteEvent.expects(:call).once
        .with(appointment: appointment)
        .returns(delete_result)
      GoogleCalendar::CreateEvent.expects(:call).never
      GoogleCalendar::UpdateEvent.expects(:call).never

      GoogleCalendar::SyncAppointment.call(appointment: appointment)
    end

    # ─────────────────────────────────────────────────────────────────────
    # IDEMPOTÊNCIA — Teste central anti-duplicidade
    #
    # Cenário: o SyncJob falha DEPOIS de criar o evento no Google mas
    # ANTES de persistir o google_calendar_event_id no banco.
    # O Sidekiq retry roda o job novamente.
    #
    # RISCO: se o reload do appointment não for feito antes do create,
    # o job verá event_id nulo e tentará criar um segundo evento.
    # ─────────────────────────────────────────────────────────────────────

    test "IDEMPOTÊNCIA: dois syncs consecutivos não criam dois eventos" do
      connect_calendar(@account)
      appointment = make_appointment

      create_call_count = 0

      # Simula CreateEvent: na primeira chamada cria evento e persiste o ID;
      # se chamado uma segunda vez o teste falha por count > 1.
      GoogleCalendar::CreateEvent.stubs(:call).with(appointment: appointment) do
        create_call_count += 1
        appointment.update_columns(google_calendar_event_id: "evt_#{create_call_count}")
        stub(success?: true)
      end
      GoogleCalendar::UpdateEvent.stubs(:call).returns(stub(success?: true))

      # Primeira sync (simula job original)
      GoogleCalendar::SyncAppointment.call(appointment: appointment)
      assert_equal 1, create_call_count, 'CreateEvent deve ser chamado exatamente 1 vez'
      assert appointment.reload.google_calendar_event_id.present?,
             'google_calendar_event_id deve ser persistido após o primeiro sync'

      # Segunda sync (simula retry do Sidekiq)
      appointment.reload
      GoogleCalendar::SyncAppointment.call(appointment: appointment)

      assert_equal 1, create_call_count,
                   'CreateEvent NÃO deve ser chamado novamente — o event_id já existe no banco'
    end

    test "IDEMPOTÊNCIA: job executado N vezes só cria 1 evento no Calendar" do
      connect_calendar(@account)
      appointment = make_appointment

      create_call_count = 0
      GoogleCalendar::CreateEvent.stubs(:call).with(appointment: appointment) do
        create_call_count += 1
        appointment.update_columns(google_calendar_event_id: "evt_unique_#{SecureRandom.hex(4)}")
        stub(success?: true)
      end
      GoogleCalendar::UpdateEvent.stubs(:call).returns(stub(success?: true))

      5.times do
        appointment.reload
        GoogleCalendar::SyncAppointment.call(appointment: appointment)
      end

      assert_equal 1, create_call_count,
                   '5 execuções do sync devem resultar em apenas 1 CreateEvent'
    end

    # ─────────────────────────────────────────────────────────────────────
    # Callbacks do Appointment model — quais mudanças disparam sync
    # ─────────────────────────────────────────────────────────────────────

    test "after_create agenda GoogleCalendarSyncJob" do
      connect_calendar(@account)

      GoogleCalendarSyncJob.unstub(:perform_later)
      assert_enqueued_with(job: GoogleCalendarSyncJob) do
        make_appointment
      end
    end

    test "atualizar start_time agenda GoogleCalendarSyncJob" do
      connect_calendar(@account)
      appointment = make_appointment

      GoogleCalendarSyncJob.unstub(:perform_later)
      new_start = next_weekday + 2.days
      assert_enqueued_with(job: GoogleCalendarSyncJob) do
        appointment.update!(start_time: new_start, end_time: new_start + 1.hour)
      end
    end

    test "atualizar apenas price_cents NÃO agenda GoogleCalendarSyncJob" do
      connect_calendar(@account)
      appointment = make_appointment

      GoogleCalendarSyncJob.unstub(:perform_later)
      assert_no_enqueued_jobs(only: GoogleCalendarSyncJob) do
        appointment.update_columns(price_cents: 9999)
      end
    end

    # ─────────────────────────────────────────────────────────────────────
    # Resilência — erro no Calendar não quebra fluxo principal
    # ─────────────────────────────────────────────────────────────────────

    test "exceção dentro do SyncAppointment é capturada e não propaga" do
      connect_calendar(@account)
      appointment = make_appointment

      GoogleCalendar::CreateEvent.stubs(:call).raises(RuntimeError, 'Google API falhou')

      assert_nothing_raised do
        GoogleCalendar::SyncAppointment.call(appointment: appointment)
      end
    end

    # ─────────────────────────────────────────────────────────────────────
    # Job wrapper
    # ─────────────────────────────────────────────────────────────────────

    test "GoogleCalendarSyncJob ignora appointment inexistente sem lançar erro" do
      assert_nothing_raised do
        GoogleCalendarSyncJob.perform_now(999_999_999)
      end
    end

    test "GoogleCalendarSyncJob delega para SyncAppointment" do
      connect_calendar(@account)
      appointment = make_appointment
      appointment.update_columns(google_calendar_event_id: nil)

      GoogleCalendar::SyncAppointment.expects(:call).once.with(appointment: appointment)

      GoogleCalendarSyncJob.perform_now(appointment.id)
    end

    private

    def connect_calendar(account)
      account.update_columns(
        google_access_token:       'access_token_test',
        google_refresh_token:      'refresh_token_test',
        google_token_expires_at:   1.hour.from_now,
        google_calendar_connected: true,
        google_calendar_id:        'primary'
      )
    end
  end
end
