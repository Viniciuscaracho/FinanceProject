---
name: Google Calendar Integration
description: Full Google Calendar API integration added to sync appointments — services, controller, job, migrations, model callbacks
type: project
---

## Google Calendar integration (added 2026-05-02)

Full `googleapis.com/calendar/v3` integration implemented across the app.

**Why:** User requested routing the scheduling flow through Google Calendar to sync appointments and generate real Google Meet links.

**How to apply:** When editing appointment or calendar logic, be aware this integration is active — changes to Appointment lifecycle (create/update/cancel) will trigger calendar syncs.

### Files added
- `db/migrate/20260502000001_add_google_calendar_to_accounts.rb` — adds OAuth token columns + `google_calendar_connected` to accounts
- `db/migrate/20260502000002_add_google_calendar_event_id_to_appointments.rb` — adds `google_calendar_event_id` to appointments
- `app/services/google_calendar/client.rb` — builds authenticated Google::Apis::CalendarV3::CalendarService, auto-refreshes token
- `app/services/google_calendar/create_event.rb` — creates Calendar event with conferenceData (real Meet link)
- `app/services/google_calendar/update_event.rb` — updates existing event; re-creates if 404
- `app/services/google_calendar/delete_event.rb` — deletes event on cancellation
- `app/services/google_calendar/sync_appointment.rb` — orchestrator: decides create/update/delete based on appointment state
- `app/jobs/google_calendar_sync_job.rb` — Sidekiq job wrapping SyncAppointment (async, safe)
- `app/controllers/api/v1/google_calendar_controller.rb` — endpoints: status, oauth_url, callback (OAuth), disconnect, sync
- `app/models/concerns/accounts/google_calendar.rb` — concern with `google_calendar_connected?` and `disconnect_google_calendar!`

### Files modified
- `Gemfile` — added `google-apis-calendar_v3 ~> 0.42` and `googleauth ~> 1.11`
- `config/routes/api.rb` — added `scope :google_calendar` with 5 endpoints
- `app/models/account.rb` — `include Accounts::GoogleCalendar`
- `app/models/appointment.rb` — `after_create :schedule_google_calendar_sync`, `after_update :schedule_google_calendar_sync_on_change`
- `app/services/appointments/generate_google_meet_link.rb` — now uses Calendar API when account is connected; falls back to static ENV or random code

### OAuth flow (account-level, not user-level)
1. GET `/api/v1/google_calendar/oauth_url` (authenticated) → returns Google OAuth URL with `calendar` scope
2. User authorizes → Google POSTs to `/api/v1/google_calendar/callback?code=...&state=JWT`
3. Backend exchanges code, stores tokens in Account (`google_access_token`, `google_refresh_token`, `google_token_expires_at`, `google_calendar_connected = true`)
4. Future syncs use stored tokens; auto-refresh when < 60s to expiry

### Required ENV variables
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FRONTEND_URL` (for OAuth redirect after callback)
