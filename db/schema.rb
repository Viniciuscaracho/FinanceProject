# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2026_07_28_120000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "fuzzystrmatch"
  enable_extension "pg_trgm"
  enable_extension "pgcrypto"
  enable_extension "plpgsql"
  enable_extension "unaccent"
  enable_extension "uuid-ossp"

  create_table "account_invitations", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "invited_by_id", null: false
    t.integer "role_cd", default: 0, null: false
    t.string "email", null: false
    t.string "token", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "name"
    t.index ["account_id"], name: "index_account_invitations_on_account_id"
    t.index ["invited_by_id"], name: "index_account_invitations_on_invited_by_id"
  end

  create_table "account_users", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "user_id", null: false
    t.integer "role_cd", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "policies", default: [], null: false
    t.jsonb "schedule", default: {}
    t.decimal "commission_percentage", precision: 8, scale: 2, default: "50.0", null: false
    t.index ["account_id", "user_id"], name: "index_account_users_on_account_id_and_user_id", unique: true
    t.index ["account_id"], name: "index_account_users_on_account_id"
    t.index ["role_cd"], name: "index_account_users_on_role_cd"
    t.index ["schedule"], name: "index_account_users_on_schedule", using: :gin
    t.index ["user_id"], name: "index_account_users_on_user_id"
  end

  create_table "accounts", force: :cascade do |t|
    t.string "default_currency", limit: 3, default: "BRL"
    t.string "country_code", limit: 2, default: "BR"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.bigint "owner_id"
    t.bigint "company_id", null: false
    t.string "processor_customer_id"
    t.string "processor_plan_id"
    t.string "processor_plan_name"
    t.string "subscription_status", default: "incomplete"
    t.date "trial_ends_at"
    t.bigint "balance_cents", default: 0, null: false
    t.string "balance_currency", limit: 3, default: "BRL", null: false
    t.boolean "admin", default: false, null: false
    t.integer "account_type_cd", default: 0, null: false
    t.boolean "free", default: false, null: false
    t.boolean "trial", default: false, null: false
    t.bigint "max_storage_size_in_bytes", default: 5368709120, null: false
    t.integer "max_active_users", default: 3, null: false
    t.datetime "current_period_starts_at"
    t.datetime "current_period_ends_at"
    t.integer "account_users_count"
    t.integer "account_invitations_count"
    t.integer "bank_accounts_count"
    t.integer "contacts_count"
    t.integer "categories_count"
    t.integer "cost_centers_count"
    t.integer "transactions_count"
    t.bigint "referral_code_id", comment: "Referral code used by the referrer"
    t.bigint "related_to_id", comment: "Related to account"
    t.integer "relation_type_cd", comment: "Relation type"
    t.bigint "subscription_id"
    t.boolean "suspended", default: false, null: false
    t.jsonb "preferences", default: {}, null: false
    t.string "google_access_token"
    t.string "google_refresh_token"
    t.datetime "google_token_expires_at"
    t.string "google_calendar_id", default: "primary"
    t.boolean "google_calendar_connected", default: false, null: false
    t.boolean "directory_visible", default: false, null: false
    t.string "profession_category"
    t.text "directory_description"
    t.string "abacate_pay_customer_id"
    t.string "google_contacts_access_token"
    t.string "google_contacts_refresh_token"
    t.datetime "google_contacts_token_expires_at"
    t.boolean "google_contacts_connected", default: false, null: false
    t.string "pix_key"
    t.string "instagram_url"
    t.string "specialties", default: [], array: true
    t.integer "profile_views", default: 0, null: false
    t.string "professional_registration"
    t.index ["company_id"], name: "index_accounts_on_company_id"
    t.index ["directory_visible"], name: "index_accounts_on_directory_visible"
    t.index ["discarded_at"], name: "index_accounts_on_discarded_at"
    t.index ["owner_id"], name: "index_accounts_on_owner_id"
    t.index ["profession_category"], name: "index_accounts_on_profession_category"
    t.index ["referral_code_id"], name: "index_accounts_on_referral_code_id"
    t.index ["related_to_id"], name: "index_accounts_on_related_to_id"
    t.index ["subscription_id"], name: "index_accounts_on_subscription_id"
  end

  create_table "action_text_rich_texts", force: :cascade do |t|
    t.string "name", null: false
    t.text "body"
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["record_type", "record_id", "name"], name: "index_action_text_rich_texts_uniqueness", unique: true
  end

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.tsvector "tsv_body"
    t.bigint "account_id"
    t.index ["account_id"], name: "index_active_storage_attachments_on_account_id"
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
    t.index ["tsv_body"], name: "index_active_storage_attachments_on_tsv_body", using: :gin
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "addresses", force: :cascade do |t|
    t.string "addressable_type", null: false
    t.bigint "addressable_id", null: false
    t.string "postcode"
    t.string "country"
    t.string "state"
    t.string "city"
    t.string "address_line1"
    t.string "address_line2"
    t.string "district"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "address_number"
    t.string "ibge_city_code"
    t.decimal "latitude", precision: 10, scale: 7
    t.decimal "longitude", precision: 10, scale: 7
    t.index ["addressable_type", "addressable_id"], name: "index_addresses_on_addressable"
  end

  create_table "ai_token_usages", force: :cascade do |t|
    t.bigint "account_id"
    t.bigint "contact_id"
    t.string "service", null: false
    t.string "model", null: false
    t.integer "input_tokens", default: 0, null: false
    t.integer "output_tokens", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "created_at"], name: "index_ai_token_usages_on_account_id_and_created_at"
    t.index ["created_at"], name: "index_ai_token_usages_on_created_at"
    t.index ["service", "created_at"], name: "index_ai_token_usages_on_service_and_created_at"
  end

  create_table "anamnese_responses", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "appointment_id"
    t.bigint "contact_id"
    t.bigint "anamnese_template_id"
    t.jsonb "responses", default: {}, null: false
    t.datetime "filled_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "appointment_id"], name: "idx_anamnese_responses_unique_appointment", unique: true, where: "(appointment_id IS NOT NULL)"
    t.index ["account_id"], name: "index_anamnese_responses_on_account_id"
    t.index ["anamnese_template_id"], name: "index_anamnese_responses_on_anamnese_template_id"
    t.index ["appointment_id"], name: "index_anamnese_responses_on_appointment_id"
    t.index ["contact_id"], name: "index_anamnese_responses_on_contact_id"
  end

  create_table "anamnese_templates", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "name", null: false
    t.text "description"
    t.jsonb "fields", default: [], null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_anamnese_templates_on_account_id"
  end

  create_table "announcements", force: :cascade do |t|
    t.string "kind", default: "new", null: false, comment: "Kind of announcement"
    t.string "title", null: false, comment: "Title of announcement"
    t.string "abstract", comment: "Abstract of announcement"
    t.datetime "published_at", null: false, comment: "Date of publication"
    t.boolean "show_banner", default: false, null: false, comment: "Show banner on dashboard"
    t.boolean "send_notification", default: false, null: false, comment: "Send notification to users"
    t.datetime "notification_sent_at", comment: "Date of notification sent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["id"], name: "index_announcements_on_id", order: :desc
    t.index ["show_banner", "published_at"], name: "index_announcements_on_show_banner_and_published_at"
  end

  create_table "api_tokens", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "token", null: false
    t.datetime "last_used_at"
    t.datetime "expires_at"
    t.string "name"
    t.string "description"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_api_tokens_on_account_id"
    t.index ["token"], name: "index_api_tokens_on_token", unique: true
    t.index ["user_id"], name: "index_api_tokens_on_user_id"
  end

  create_table "appointment_commissions", force: :cascade do |t|
    t.bigint "appointment_id", null: false
    t.bigint "account_user_id", null: false
    t.integer "commission_type", null: false
    t.decimal "commission_value", precision: 8, scale: 2, null: false
    t.integer "commission_amount_cents", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_user_id"], name: "index_appointment_commissions_on_account_user_id"
    t.index ["appointment_id"], name: "index_appointment_commissions_on_appointment_id"
  end

  create_table "appointment_links", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "token", null: false
    t.string "name"
    t.text "description"
    t.boolean "active", default: true, null: false
    t.bigint "service_id"
    t.bigint "account_user_id"
    t.jsonb "settings", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "enable_google_meet", default: false
    t.index ["account_id"], name: "index_appointment_links_on_account_id"
    t.index ["account_user_id"], name: "index_appointment_links_on_account_user_id"
    t.index ["active"], name: "index_appointment_links_on_active"
    t.index ["service_id"], name: "index_appointment_links_on_service_id"
    t.index ["token", "active"], name: "index_appointment_links_on_token_and_active", where: "(active = true)"
    t.index ["token"], name: "index_appointment_links_on_token", unique: true
  end

  create_table "appointment_notes", force: :cascade do |t|
    t.bigint "appointment_id", null: false
    t.bigint "account_id", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "patient_tasks", default: [], null: false
    t.index ["account_id", "appointment_id"], name: "index_appointment_notes_on_account_id_and_appointment_id"
    t.index ["account_id"], name: "index_appointment_notes_on_account_id"
    t.index ["appointment_id"], name: "index_appointment_notes_on_appointment_id"
    t.index ["patient_tasks"], name: "index_appointment_notes_on_patient_tasks", using: :gin
  end

  create_table "appointments", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "account_user_id", null: false
    t.bigint "service_id", null: false
    t.datetime "start_time"
    t.datetime "end_time"
    t.integer "price_cents", null: false
    t.string "price_currency", default: "BRL"
    t.integer "status", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "whatsapp_number"
    t.string "stripe_payment_link_id"
    t.integer "payment_status"
    t.bigint "contact_id"
    t.string "stripe_payment_intent_id"
    t.string "google_meet_link"
    t.jsonb "recurrence_pattern", default: {}
    t.bigint "parent_appointment_id"
    t.boolean "whatsapp_reminder_sent", default: false
    t.datetime "whatsapp_reminder_sent_at"
    t.string "google_calendar_event_id"
    t.bigint "appointment_link_id"
    t.boolean "whatsapp_1h_reminder_sent", default: false, null: false
    t.datetime "whatsapp_1h_reminder_sent_at"
    t.boolean "billing_notification_sent", default: false, null: false
    t.datetime "billing_notification_sent_at"
    t.boolean "pix_reminder_sent", default: false, null: false
    t.datetime "pix_reminder_sent_at"
    t.boolean "overdue_notification_sent", default: false, null: false
    t.datetime "overdue_notification_sent_at"
    t.jsonb "additional_service_ids", default: [], null: false
    t.string "manage_token"
    t.bigint "anamnese_template_id"
    t.boolean "is_demo", default: false, null: false
    t.string "stripe_payment_link_url"
    t.index ["account_id", "account_user_id", "status", "start_time"], name: "index_appointments_on_account_professional_status_time"
    t.index ["account_id", "start_time", "status"], name: "index_appointments_on_account_time_status"
    t.index ["account_id"], name: "index_appointments_on_account_id"
    t.index ["account_user_id"], name: "index_appointments_on_account_user_id"
    t.index ["anamnese_template_id"], name: "index_appointments_on_anamnese_template_id"
    t.index ["appointment_link_id"], name: "index_appointments_on_appointment_link_id"
    t.index ["billing_notification_sent"], name: "index_appointments_on_billing_notification_sent"
    t.index ["contact_id"], name: "index_appointments_on_contact_id"
    t.index ["google_calendar_event_id"], name: "index_appointments_on_google_calendar_event_id"
    t.index ["manage_token"], name: "index_appointments_on_manage_token", unique: true
    t.index ["overdue_notification_sent"], name: "index_appointments_on_overdue_notification_sent"
    t.index ["parent_appointment_id"], name: "index_appointments_on_parent_appointment_id"
    t.index ["payment_status"], name: "index_appointments_on_payment_status"
    t.index ["service_id"], name: "index_appointments_on_service_id"
    t.index ["stripe_payment_link_id"], name: "index_appointments_on_stripe_payment_link_id"
    t.index ["whatsapp_number"], name: "index_appointments_on_whatsapp_number"
  end

  create_table "audits", force: :cascade do |t|
    t.bigint "auditable_id"
    t.string "auditable_type"
    t.bigint "associated_id"
    t.string "associated_type"
    t.bigint "user_id"
    t.string "user_type"
    t.string "username"
    t.string "action"
    t.jsonb "audited_changes"
    t.integer "version", default: 0
    t.string "comment"
    t.string "remote_address"
    t.string "request_uuid"
    t.datetime "created_at"
    t.index ["associated_id", "associated_type", "auditable_type", "user_type"], name: "index_audits_on_home_page"
    t.index ["associated_type", "associated_id", "auditable_type", "user_type", "created_at"], name: "index_audits_on_home_page_with_created_at", order: { created_at: :desc }
    t.index ["associated_type", "associated_id"], name: "associated_index"
    t.index ["auditable_type", "auditable_id", "version"], name: "auditable_index"
    t.index ["created_at"], name: "index_audits_on_created_at"
    t.index ["request_uuid"], name: "index_audits_on_request_uuid"
    t.index ["user_id", "user_type"], name: "user_index"
  end

  create_table "bank_accounts", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.integer "account_type_cd", default: 0, null: false
    t.string "name", null: false
    t.boolean "default", default: false, null: false
    t.bigint "initial_balance_cents", default: 0, null: false
    t.string "initial_balance_currency", limit: 3, default: "BRL", null: false
    t.bigint "balance_cents", default: 0, null: false
    t.string "balance_currency", limit: 3, default: "BRL", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "created_by_id"
    t.bigint "updated_by_id"
    t.string "agency"
    t.string "account_number"
    t.bigint "bank_id"
    t.datetime "discarded_at"
    t.index ["account_id", "discarded_at"], name: "index_bank_accounts_on_multisearch_columns", order: { discarded_at: "NULLS FIRST" }
    t.index ["account_id", "id"], name: "index_bank_accounts_on_account_id_and_id"
    t.index ["account_id"], name: "index_bank_accounts_on_account_id"
    t.index ["account_type_cd"], name: "index_bank_accounts_on_account_type_cd"
    t.index ["bank_id"], name: "index_bank_accounts_on_bank_id"
    t.index ["created_by_id"], name: "index_bank_accounts_on_created_by_id"
    t.index ["discarded_at"], name: "index_bank_accounts_on_discarded_at"
    t.index ["updated_by_id"], name: "index_bank_accounts_on_updated_by_id"
  end

  create_table "banks", force: :cascade do |t|
    t.string "country", null: false
    t.integer "code", null: false
    t.string "name", null: false
    t.text "description"
    t.string "ispb"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["country", "code"], name: "index_banks_on_country_and_code", unique: true
  end

  create_table "coaching_insights", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "contact_id", null: false
    t.string "insight_type", null: false
    t.text "insight_text", null: false
    t.string "severity", default: "medium", null: false
    t.jsonb "related_dates", default: [], null: false
    t.datetime "expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "contact_id", "created_at"], name: "idx_coaching_insights_account_contact_date"
    t.index ["account_id", "created_at"], name: "index_coaching_insights_on_account_id_and_created_at"
    t.index ["account_id"], name: "index_coaching_insights_on_account_id"
  end

  create_table "coaching_profiles", force: :cascade do |t|
    t.bigint "contact_id", null: false
    t.bigint "account_id", null: false
    t.text "goal"
    t.text "limitations"
    t.datetime "next_reassessment_at"
    t.datetime "last_feedback_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "last_feedback_at"], name: "index_coaching_profiles_on_account_id_and_last_feedback_at"
    t.index ["account_id", "next_reassessment_at"], name: "index_coaching_profiles_on_account_id_and_next_reassessment_at"
    t.index ["account_id"], name: "index_coaching_profiles_on_account_id"
    t.index ["contact_id"], name: "index_coaching_profiles_on_contact_id"
  end

  create_table "company_nfse_configs", force: :cascade do |t|
    t.bigint "company_id", null: false, comment: "Empresa / Company"
    t.boolean "enabled", default: false, null: false, comment: "NFS-e habilitada?"
    t.string "provider", default: "padrao", null: false, comment: "Identificação do provedor para transmissão da DPS: - \"padrao\": Provedor padrão da prefeitura; \"nacional\": Ambiente de Dados Nacional (ADN) do Sistema Nacional NFS-e"
    t.string "environment", default: "homologacao", null: false, comment: "Ambiente de emissão da NFSe"
    t.integer "simplified_tax_system_cd", default: 1, null: false, comment: "Situação perante o Simples Nacional: 1 - Não optante; 2 - Optante (MEI); 3 - Optante (ME/EPP)"
    t.integer "tax_calculation_regime_cd", comment: "Regime de apuração dos tributos: Opção para que o contribuinte optante pelo Simples Nacional ME/EPP (opSimpNac = 3) possa indicar, ao emitir o documento fiscal, em qual regime de apuração os tributos federais e municipal estão inseridos"
    t.integer "special_tax_regime_cd", default: 0, null: false, comment: "Regime especial de tributação"
    t.integer "rps_initial_batch_number", comment: "Número do Lote de RPS. Informe o próximo número do lote RPS a ser utilizado."
    t.string "rps_series", comment: "Série do RPS. A série dos RPS varia de acordo com cada prefeitura, podendo ser número (1, 2 ou 3, por exemplo) ou letras (A, S, NFS, por exemplo)"
    t.integer "rps_initial_number", comment: "Número do RPS. Informe o próximo número de RPS a ser utilizado"
    t.string "provider_login"
    t.string "provider_senha"
    t.string "provider_token"
    t.boolean "tax_incentive", default: false, null: false, comment: "Indicador se a empresa possui algum tipo de incentivo fiscal."
    t.string "a1_cert_password", comment: "Senha do Certificado Digital A1"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "national_tax_code", comment: "Código de tributação nacional do ISSQN: Regra de formação - 6 dígitos numéricos sendo: 2 para Item (LC 116/2003), 2 para Subitem (LC 116/2003) e 2 para Desdobro Naciona"
    t.string "municipal_tax_code", comment: "Código de tributação municipal do ISSQN."
    t.string "service_description", comment: "Descrição padrão do serviço prestado"
    t.integer "iss_service_provided_tax_cd", comment: "Tributação do ISSQN sobre o serviço prestado"
    t.integer "iss_withholding_type_cd", comment: "Tipo de retenção do ISS"
    t.decimal "iss_tax_rate", comment: "Alíquota do ISS"
    t.index ["company_id"], name: "index_company_nfse_configs_on_company_id"
  end

  create_table "contracts", force: :cascade do |t|
    t.text "title"
    t.text "description"
    t.text "content"
    t.bigint "contract_template_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "contact_id"
    t.index ["contact_id"], name: "index_contracts_on_contact_id"
    t.index ["contract_template_id"], name: "index_contracts_on_contract_template_id"
  end

  create_table "document_template_seeds", force: :cascade do |t|
    t.string "type"
    t.string "title"
    t.string "description"
    t.text "content"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "document_templates", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "type"
    t.integer "transaction_type_cd"
    t.text "content"
    t.bigint "account_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "default", default: false
    t.boolean "enable_sessions", default: false, null: false
    t.integer "session_count"
    t.integer "session_number"
    t.string "session_type"
    t.string "professional_type", comment: "Tipo de profissional (psicólogo, professor, nutricionista, etc.)"
    t.index ["account_id"], name: "index_document_templates_on_account_id"
    t.index ["type", "account_id", "id"], name: "index_document_templates_on_type_and_account_id_and_id"
  end

  create_table "domains", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "type", null: false
    t.string "name", null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.bigint "created_by_id"
    t.bigint "updated_by_id"
    t.integer "transaction_type_cd"
    t.tsvector "tsv_body"
    t.index ["account_id", "type", "discarded_at"], name: "index_domains_on_account_id_and_type_and_discarded_at"
    t.index ["account_id"], name: "index_domains_on_account_id"
    t.index ["created_by_id"], name: "index_domains_on_created_by_id"
    t.index ["discarded_at", "type", "account_id", "id"], name: "index_domains_on_discarded_at_and_type_and_account_id_and_id"
    t.index ["discarded_at"], name: "index_domains_on_discarded_at"
    t.index ["id", "type"], name: "index_domains_on_id_and_type"
    t.index ["transaction_type_cd"], name: "index_domains_on_transaction_type_cd"
    t.index ["tsv_body"], name: "index_domains_on_tsv_body", using: :gin
    t.index ["type"], name: "index_domains_on_type"
    t.index ["updated_by_id"], name: "index_domains_on_updated_by_id"
  end

  create_table "enums", force: :cascade do |t|
    t.bigint "parent_id"
    t.string "type", null: false
    t.string "key", null: false
    t.string "value", null: false
    t.text "description"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.index ["parent_id"], name: "index_enums_on_parent_id"
    t.index ["type", "discarded_at"], name: "index_enums_on_type_and_discarded_at"
    t.index ["type", "key"], name: "index_enums_on_type_and_key", unique: true
  end

  create_table "event_store_events", force: :cascade do |t|
    t.uuid "event_id", null: false
    t.string "event_type", null: false
    t.jsonb "metadata"
    t.jsonb "data", null: false
    t.datetime "created_at", null: false
    t.datetime "valid_at"
    t.index ["created_at"], name: "index_event_store_events_on_created_at"
    t.index ["event_id"], name: "index_event_store_events_on_event_id", unique: true
    t.index ["event_type"], name: "index_event_store_events_on_event_type"
    t.index ["valid_at"], name: "index_event_store_events_on_valid_at"
  end

  create_table "event_store_events_in_streams", force: :cascade do |t|
    t.string "stream", null: false
    t.integer "position"
    t.uuid "event_id", null: false
    t.datetime "created_at", null: false
    t.index ["created_at"], name: "index_event_store_events_in_streams_on_created_at"
    t.index ["event_id"], name: "index_event_store_events_in_streams_on_event_id"
    t.index ["stream", "event_id"], name: "index_event_store_events_in_streams_on_stream_and_event_id", unique: true
    t.index ["stream", "position"], name: "index_event_store_events_in_streams_on_stream_and_position", unique: true
  end

  create_table "exchange_rates", force: :cascade do |t|
    t.string "from", limit: 3, null: false
    t.string "to", limit: 3, null: false
    t.decimal "rate", precision: 20, scale: 5, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["from", "to"], name: "index_exchange_rates_on_from_and_to"
  end

  create_table "exports", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.jsonb "params", default: {}, null: false
    t.integer "state_cd", default: 0
    t.integer "source_cd"
    t.bigint "progress_number"
    t.bigint "progress_total"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_exports_on_account_id"
  end

  create_table "feedbacks", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "rating"
    t.text "observations"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_feedbacks_on_user_id"
  end

  create_table "foods", force: :cascade do |t|
    t.bigint "account_id"
    t.string "name", null: false
    t.decimal "kcal_per_100g", precision: 8, scale: 2, default: "0.0"
    t.decimal "protein_per_100g", precision: 8, scale: 2, default: "0.0"
    t.decimal "carbs_per_100g", precision: 8, scale: 2, default: "0.0"
    t.decimal "fat_per_100g", precision: 8, scale: 2, default: "0.0"
    t.decimal "fiber_per_100g", precision: 8, scale: 2, default: "0.0"
    t.string "source", default: "custom", null: false
    t.string "external_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "vitamins_per_100g", default: {}
    t.string "brand"
    t.index ["account_id"], name: "index_foods_on_account_id"
    t.index ["name"], name: "index_foods_on_name"
    t.index ["source"], name: "index_foods_on_source"
  end

  create_table "help_users", force: :cascade do |t|
    t.string "type", null: false
    t.text "link", null: false
    t.text "title"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "youtube_video_id"
  end

  create_table "imports", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.integer "source_cd"
    t.integer "state_cd"
    t.bigint "progress_number"
    t.bigint "progress_total"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "message"
    t.datetime "discarded_at"
    t.index ["account_id"], name: "index_imports_on_account_id"
  end

  create_table "integration_stores", force: :cascade do |t|
    t.string "name", null: false
    t.integer "store_type_cd", null: false
    t.bigint "account_id"
    t.bigint "parent_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "type"
    t.text "description"
    t.datetime "integrated_at"
    t.string "state"
    t.index ["account_id"], name: "index_integration_stores_on_account_id"
    t.index ["parent_id"], name: "index_integration_stores_on_parent_id"
    t.index ["state"], name: "index_integration_stores_on_state"
    t.index ["type", "store_type_cd", "account_id"], name: "idx_integrations_stores_uniq", unique: true
  end

  create_table "invoice_lines", force: :cascade do |t|
    t.bigint "invoice_id", null: false
    t.string "record_type"
    t.bigint "record_id"
    t.bigint "offer_id"
    t.integer "sequential_id"
    t.text "description"
    t.decimal "quantity", precision: 10, scale: 2, default: "0.0", null: false
    t.string "unit"
    t.bigint "unit_price_cents", default: 0, null: false
    t.bigint "total_price_cents", default: 0, null: false
    t.string "currency", default: "BRL", null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["invoice_id"], name: "index_invoice_lines_on_invoice_id"
    t.index ["offer_id"], name: "index_invoice_lines_on_offer_id"
    t.index ["record_type", "record_id"], name: "index_invoice_lines_on_record"
  end

  create_table "invoices", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "bank_account_id", null: false
    t.bigint "provider_id", null: false
    t.bigint "recipient_id", null: false
    t.string "record_type"
    t.bigint "record_id"
    t.string "status", default: "draft", null: false
    t.integer "number"
    t.date "issue_date"
    t.date "due_date"
    t.string "name"
    t.text "description"
    t.bigint "amount_cents", default: 0, null: false
    t.bigint "subtotal_cents", default: 0, null: false
    t.string "discount_description"
    t.decimal "discount_percentage", precision: 10, scale: 2, default: "0.0", null: false
    t.bigint "discount_cents", default: 0, null: false
    t.string "tax_description"
    t.decimal "tax_percentage", precision: 10, scale: 2, default: "0.0", null: false
    t.bigint "tax_cents", default: 0, null: false
    t.boolean "tax_already_applied", default: true, null: false
    t.bigint "total_before_tax_cents", default: 0, null: false
    t.bigint "total_cents", default: 0, null: false
    t.string "currency", default: "BRL", null: false
    t.boolean "sync_with_transaction", default: true, null: false
    t.datetime "drafted_at"
    t.datetime "opened_at"
    t.datetime "paid_at"
    t.datetime "canceled_at"
    t.datetime "sent_at"
    t.tsvector "tsv_body"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "due_date"], name: "index_invoices_on_account_id_and_due_date"
    t.index ["account_id", "issue_date"], name: "index_invoices_on_account_id_and_issue_date"
    t.index ["account_id", "number"], name: "index_invoices_on_account_id_and_number"
    t.index ["account_id", "status"], name: "index_invoices_on_account_id_and_status"
    t.index ["account_id"], name: "index_invoices_on_account_id"
    t.index ["bank_account_id"], name: "index_invoices_on_bank_account_id"
    t.index ["provider_id"], name: "index_invoices_on_provider_id"
    t.index ["recipient_id"], name: "index_invoices_on_recipient_id"
    t.index ["record_type", "record_id"], name: "index_invoices_on_record"
    t.index ["tsv_body"], name: "index_invoices_on_tsv_body", using: :gin
  end

  create_table "meal_foods", force: :cascade do |t|
    t.bigint "meal_id", null: false
    t.bigint "food_id", null: false
    t.decimal "quantity", precision: 8, scale: 2, default: "100.0", null: false
    t.string "unit", default: "g", null: false
    t.text "notes"
    t.decimal "kcal_snapshot", precision: 8, scale: 2, default: "0.0"
    t.decimal "protein_snapshot", precision: 8, scale: 2, default: "0.0"
    t.decimal "carbs_snapshot", precision: 8, scale: 2, default: "0.0"
    t.decimal "fat_snapshot", precision: 8, scale: 2, default: "0.0"
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "fiber_snapshot", precision: 8, scale: 2, default: "0.0"
    t.jsonb "vitamins_snapshot", default: {}
    t.index ["food_id"], name: "index_meal_foods_on_food_id"
    t.index ["meal_id"], name: "index_meal_foods_on_meal_id"
  end

  create_table "meal_plan_days", force: :cascade do |t|
    t.bigint "meal_plan_id", null: false
    t.integer "day_number", null: false
    t.string "label"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["meal_plan_id", "day_number"], name: "index_meal_plan_days_on_meal_plan_id_and_day_number", unique: true
    t.index ["meal_plan_id"], name: "index_meal_plan_days_on_meal_plan_id"
  end

  create_table "meal_plans", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "contact_id"
    t.string "title", null: false
    t.text "description"
    t.text "notes"
    t.integer "status", default: 0, null: false
    t.string "public_token", null: false
    t.date "start_date"
    t.date "end_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_template", default: false, null: false
    t.string "template_category"
    t.decimal "target_kcal", precision: 8, scale: 2, default: "0.0"
    t.decimal "target_protein_g", precision: 8, scale: 2, default: "0.0"
    t.decimal "target_carbs_g", precision: 8, scale: 2, default: "0.0"
    t.decimal "target_fat_g", precision: 8, scale: 2, default: "0.0"
    t.decimal "target_fiber_g", precision: 8, scale: 2, default: "0.0"
    t.index ["account_id", "contact_id"], name: "index_meal_plans_on_account_id_and_contact_id"
    t.index ["account_id"], name: "index_meal_plans_on_account_id"
    t.index ["contact_id"], name: "index_meal_plans_on_contact_id"
    t.index ["is_template"], name: "index_meal_plans_on_is_template"
    t.index ["public_token"], name: "index_meal_plans_on_public_token", unique: true
  end

  create_table "meals", force: :cascade do |t|
    t.bigint "meal_plan_day_id", null: false
    t.string "name", null: false
    t.string "time_suggestion"
    t.text "notes"
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["meal_plan_day_id", "position"], name: "index_meals_on_meal_plan_day_id_and_position"
    t.index ["meal_plan_day_id"], name: "index_meals_on_meal_plan_day_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.string "recipient_type", null: false
    t.bigint "recipient_id", null: false
    t.string "type", null: false
    t.jsonb "params"
    t.datetime "read_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["read_at"], name: "index_notifications_on_read_at"
    t.index ["recipient_type", "recipient_id"], name: "index_notifications_on_recipient"
  end

  create_table "offers", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "type", null: false
    t.string "internal_code"
    t.string "name", null: false
    t.text "description"
    t.string "unit"
    t.string "currency", default: "BRL", null: false
    t.jsonb "data", default: {}, null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "enabled", default: "t", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.integer "offer_type_cd"
    t.bigint "selling_price_cents", default: 0, null: false
    t.bigint "cost_price_cents", default: 0, null: false
    t.integer "modality", default: 0, null: false
    t.string "meeting_url"
    t.index ["account_id", "discarded_at"], name: "index_offers_on_account_id_and_discarded_at"
    t.index ["account_id", "enabled"], name: "index_offers_on_account_id_and_enabled"
    t.index ["account_id", "internal_code"], name: "index_offers_on_account_id_and_internal_code"
    t.index ["account_id", "type"], name: "index_offers_on_account_id_and_type"
    t.index ["account_id"], name: "index_offers_on_account_id"
    t.index ["discarded_at", "type", "account_id"], name: "index_offers_on_discarded_at_and_type_and_account_id"
  end

  create_table "patient_documents", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "contact_id", null: false
    t.string "title", null: false
    t.text "content"
    t.string "document_type"
    t.string "public_token", null: false
    t.boolean "shared", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "contact_id"], name: "index_patient_documents_on_account_id_and_contact_id"
    t.index ["account_id"], name: "index_patient_documents_on_account_id"
    t.index ["contact_id"], name: "index_patient_documents_on_contact_id"
    t.index ["public_token"], name: "index_patient_documents_on_public_token", unique: true
  end

  create_table "patient_goals", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "contact_id", null: false
    t.string "title", null: false
    t.string "unit"
    t.decimal "target_value", precision: 10, scale: 2
    t.decimal "current_value", precision: 10, scale: 2
    t.date "deadline"
    t.text "notes"
    t.integer "status", default: 0, null: false
    t.jsonb "progress_history", default: [], null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "contact_id"], name: "index_patient_goals_on_account_id_and_contact_id"
    t.index ["account_id"], name: "index_patient_goals_on_account_id"
    t.index ["contact_id"], name: "index_patient_goals_on_contact_id"
  end

  create_table "patient_notes", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "contact_id", null: false
    t.text "content"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "contact_id"], name: "index_patient_notes_on_account_id_and_contact_id"
    t.index ["account_id"], name: "index_patient_notes_on_account_id"
    t.index ["contact_id"], name: "index_patient_notes_on_contact_id"
  end

  create_table "payment_plans", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "amount_cents", default: 0, null: false
    t.string "amount_currency", limit: 3, default: "BRL", null: false
    t.integer "amount_type_cd", default: 0, null: false
    t.integer "frequency_cd", default: 3, null: false
    t.integer "number_of_installments", default: 3, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.integer "type_cd", default: 0, null: false
    t.index ["account_id", "type_cd"], name: "index_payment_plans_on_account_id_and_type_cd"
    t.index ["account_id"], name: "index_payment_plans_on_account_id"
    t.index ["amount_type_cd"], name: "index_payment_plans_on_amount_type_cd"
    t.index ["discarded_at"], name: "index_payment_plans_on_discarded_at"
    t.index ["frequency_cd"], name: "index_payment_plans_on_frequency_cd"
  end

  create_table "payouts", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "account_user_id", null: false
    t.integer "total_amount_cents", null: false
    t.string "currency", default: "BRL"
    t.datetime "paid_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_payouts_on_account_id"
    t.index ["account_user_id"], name: "index_payouts_on_account_user_id"
  end

  create_table "people", force: :cascade do |t|
    t.bigint "account_id"
    t.string "type", null: false
    t.integer "person_type_cd", default: 0, null: false
    t.string "first_name", null: false
    t.string "last_name"
    t.string "document_1"
    t.string "document_2"
    t.string "email"
    t.string "phone_number"
    t.date "birth_date"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.integer "contact_type_cd", default: 0, null: false
    t.bigint "created_by_id"
    t.bigint "updated_by_id"
    t.tsvector "tsv_body"
    t.string "cell_phone_number"
    t.bigint "sector_activity_id"
    t.string "cert_password", comment: "Senha do Certificado Digital"
    t.bigint "cnae_id"
    t.string "document_3", comment: "Inscrição Municial (PJ) / CNH (PF)"
    t.string "screen_name", comment: "Nome fantasia para PJ / Nome social para PF"
    t.boolean "is_demo", default: false, null: false
    t.index ["account_id", "contact_type_cd"], name: "index_people_on_account_id_and_contact_type_cd"
    t.index ["account_id", "type", "discarded_at"], name: "index_people_on_account_id_and_type_and_discarded_at"
    t.index ["account_id"], name: "index_people_on_account_id"
    t.index ["cnae_id"], name: "index_people_on_cnae_id"
    t.index ["contact_type_cd"], name: "index_people_on_contact_type_cd"
    t.index ["created_by_id"], name: "index_people_on_created_by_id"
    t.index ["discarded_at", "type", "account_id", "id"], name: "index_people_on_discarded_at_and_type_and_account_id_and_id"
    t.index ["discarded_at"], name: "index_people_on_discarded_at"
    t.index ["id", "type"], name: "index_people_on_id_and_type"
    t.index ["person_type_cd"], name: "index_people_on_person_type_cd"
    t.index ["sector_activity_id"], name: "index_people_on_sector_activity_id"
    t.index ["tsv_body"], name: "index_people_on_tsv_body", using: :gin
    t.index ["type"], name: "index_people_on_type"
    t.index ["updated_by_id"], name: "index_people_on_updated_by_id"
  end

  create_table "pg_search_documents", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "searchable_type"
    t.bigint "searchable_id"
    t.text "content"
    t.date "date"
    t.tsvector "tsv_body"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_pg_search_documents_on_account_id"
    t.index ["date"], name: "index_pg_search_documents_on_date"
    t.index ["searchable_type", "searchable_id"], name: "index_pg_search_documents_on_searchable"
    t.index ["tsv_body"], name: "index_pg_search_documents_on_tsv_body", using: :gin
  end

  create_table "pix_billings", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "billing_id", null: false
    t.string "billing_url"
    t.integer "amount", null: false
    t.string "status", default: "PENDING", null: false
    t.string "frequency", default: "MONTHLY", null: false
    t.string "plan_id"
    t.string "plan_name"
    t.datetime "paid_at"
    t.datetime "expires_at"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "status"], name: "index_pix_billings_on_account_id_and_status"
    t.index ["account_id"], name: "index_pix_billings_on_account_id"
    t.index ["billing_id"], name: "index_pix_billings_on_billing_id", unique: true
  end

  create_table "professional_commissions", force: :cascade do |t|
    t.bigint "account_user_id", null: false
    t.bigint "service_id", null: false
    t.integer "commission_type", default: 0
    t.decimal "commission_value", precision: 8, scale: 2, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_user_id"], name: "index_professional_commissions_on_account_user_id"
    t.index ["service_id"], name: "index_professional_commissions_on_service_id"
  end

  create_table "receipt_templates", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "referral_codes", force: :cascade do |t|
    t.string "code", null: false, comment: "Unique referral code"
    t.string "name", null: false, comment: "Name of the referral code"
    t.text "description", comment: "Description of the referral code"
    t.integer "benefit_type_cd", default: 0, null: false, comment: "Benefit type"
    t.integer "benefit", default: 0, null: false, comment: "Benefit (in percentage)"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.string "referrer_type"
    t.bigint "referrer_id", comment: "Referrer that owns this referral code"
    t.integer "trial_days", default: 30, null: false
    t.boolean "create_free_personal_account", default: true, null: false
    t.integer "account_type_cd", default: 0, null: false
    t.index ["code"], name: "index_referral_codes_on_code", unique: true
    t.index ["discarded_at"], name: "index_referral_codes_on_discarded_at"
    t.index ["referrer_type", "referrer_id"], name: "index_referral_codes_on_referrer"
  end

  create_table "relationship_stores", force: :cascade do |t|
    t.string "endpoint"
    t.string "external_entity"
    t.string "external_id"
    t.string "internal_entity"
    t.bigint "internal_id"
    t.datetime "source_last_update"
    t.integer "sync_type_cd", null: false
    t.datetime "synced_at"
    t.bigint "integration_store_id", null: false
    t.bigint "account_id"
    t.bigint "synced_by_id"
    t.jsonb "raw_data"
    t.jsonb "extras"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "parent_id"
    t.integer "direction_cd", default: 0
    t.index ["account_id"], name: "index_relationship_stores_on_account_id"
    t.index ["external_entity", "external_id"], name: "index_relationship_stores_on_external_entity_and_external_id"
    t.index ["integration_store_id"], name: "index_relationship_stores_on_integration_store_id"
    t.index ["internal_entity", "internal_id"], name: "index_relationship_stores_on_internal_entity_and_internal_id"
    t.index ["parent_id"], name: "index_relationship_stores_on_parent_id"
    t.index ["sync_type_cd"], name: "index_relationship_stores_on_sync_type_cd"
    t.index ["synced_by_id"], name: "index_relationship_stores_on_synced_by_id"
  end

  create_table "reviews", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "reviewer_name", null: false
    t.string "reviewer_email"
    t.integer "rating", null: false
    t.text "comment"
    t.boolean "approved", default: true, null: false
    t.string "source", default: "direct"
    t.bigint "appointment_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "approved"], name: "index_reviews_on_account_id_and_approved"
    t.index ["account_id"], name: "index_reviews_on_account_id"
    t.index ["created_at"], name: "index_reviews_on_created_at"
  end

  create_table "secondary_cnaes", force: :cascade do |t|
    t.bigint "person_id", null: false
    t.bigint "cnae_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cnae_id"], name: "index_secondary_cnaes_on_cnae_id"
    t.index ["person_id", "cnae_id"], name: "index_secondary_cnaes_on_person_id_and_cnae_id", unique: true
    t.index ["person_id"], name: "index_secondary_cnaes_on_person_id"
  end

  create_table "segments", force: :cascade do |t|
    t.bigint "parent_id"
    t.string "type"
    t.integer "transaction_type_cd"
    t.string "language", default: "pt-BR", null: false
    t.string "name", null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.index ["discarded_at"], name: "index_segments_on_discarded_at"
    t.index ["language"], name: "index_segments_on_language"
    t.index ["parent_id"], name: "index_segments_on_parent_id"
    t.index ["transaction_type_cd"], name: "index_segments_on_transaction_type_cd"
    t.index ["type"], name: "index_segments_on_type"
  end

  create_table "service_nfse_configs", force: :cascade do |t|
    t.bigint "service_id", null: false, comment: "Serviço relacionado a configuração"
    t.string "cnae_code", comment: "Código CNAE do serviço"
    t.string "national_tax_code", comment: "Código de tributação nacional do ISSQN: Regra de formação - 6 dígitos numéricos sendo: 2 para Item (LC 116/2003), 2 para Subitem (LC 116/2003) e 2 para Desdobro Naciona"
    t.string "municipal_tax_code", comment: "Código de tributação municipal do ISSQN."
    t.string "nbs_code", comment: "Código NBS do serviço (somente NFSE Nacional)"
    t.string "city_code", comment: "Código IBGE da cidade de prestação do serviço"
    t.string "country_code", comment: "Código ISO do país de prestação do serviço"
    t.integer "iss_service_provided_tax_cd", comment: "Tributação do ISSQN sobre o serviço prestado"
    t.string "iss_country_code", comment: "País resultado da prestação do serviço"
    t.string "iss_city_code", comment: "Município de incidência do ISSQN"
    t.integer "iss_immunity_type_cd", comment: "Tipo de imunidade do ISS"
    t.integer "iss_withholding_type_cd", comment: "Tipo de retenção do ISS"
    t.decimal "iss_tax_rate", comment: "Alíquota do ISS"
    t.string "cst_code", comment: "Código de Situação Tributária do PIS/COFINS"
    t.integer "pis_cofins_withholding_type_cd", comment: "Tipo de retencao do Pis/Cofins: 1 - retido; 2 - não retido"
    t.decimal "pis_tax_rate", comment: "Alíquota de retenção do PIS"
    t.decimal "cofins_tax_rate", comment: "Alíquota de retenção do COFINS"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["service_id"], name: "index_service_nfse_configs_on_service_id"
  end

  create_table "services", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "name", null: false
    t.integer "price_cents", null: false
    t.string "price_currency", default: "BRL", null: false
    t.integer "default_commission_type", default: 0
    t.decimal "default_commission_value", precision: 8, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_services_on_account_id"
  end

  create_table "settings", id: :serial, force: :cascade do |t|
    t.string "var", null: false
    t.text "value"
    t.string "target_type", null: false
    t.integer "target_id", null: false
    t.datetime "created_at", precision: nil
    t.datetime "updated_at", precision: nil
    t.index ["target_type", "target_id", "var"], name: "index_settings_on_target_type_and_target_id_and_var", unique: true
    t.index ["target_type", "target_id"], name: "index_settings_on_target_type_and_target_id"
  end

  create_table "statement_items", force: :cascade do |t|
    t.bigint "statement_id", null: false
    t.bigint "contact_id"
    t.bigint "category_id"
    t.bigint "bank_account_source_id"
    t.bigint "bank_account_target_id"
    t.bigint "related_transaction_id"
    t.integer "status_cd", default: 0, null: false
    t.integer "transaction_type_cd"
    t.integer "type_cd", null: false
    t.date "posted_at", null: false
    t.string "memo", null: false
    t.bigint "amount_cents", default: 0, null: false
    t.string "amount_currency", limit: 3, default: "BRL", null: false
    t.date "due_date", null: false
    t.string "name", null: false
    t.string "document_number", null: false
    t.datetime "confirmed_at"
    t.datetime "ignored_at"
    t.datetime "reconciled_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.index ["bank_account_source_id"], name: "index_statement_items_on_bank_account_source_id"
    t.index ["bank_account_target_id"], name: "index_statement_items_on_bank_account_target_id"
    t.index ["category_id"], name: "index_statement_items_on_category_id"
    t.index ["contact_id"], name: "index_statement_items_on_contact_id"
    t.index ["discarded_at"], name: "index_statement_items_on_discarded_at"
    t.index ["related_transaction_id"], name: "index_statement_items_on_related_transaction_id"
    t.index ["statement_id"], name: "index_statement_items_on_statement_id"
    t.index ["status_cd"], name: "index_statement_items_on_status_cd"
    t.index ["transaction_type_cd"], name: "index_statement_items_on_transaction_type_cd"
    t.index ["type_cd"], name: "index_statement_items_on_type_cd"
  end

  create_table "statements", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "bank_account_id", null: false
    t.integer "type_cd", null: false
    t.string "workflow_state", null: false
    t.date "starts_at"
    t.date "ends_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "discarded_at"
    t.index ["account_id"], name: "index_statements_on_account_id"
    t.index ["bank_account_id"], name: "index_statements_on_bank_account_id"
    t.index ["discarded_at"], name: "index_statements_on_discarded_at"
    t.index ["type_cd"], name: "index_statements_on_type_cd"
    t.index ["workflow_state"], name: "index_statements_on_workflow_state"
  end

  create_table "subscription_charges", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "subscription_id", null: false
    t.bigint "subscription_invoice_id", null: false
    t.string "processor_id", null: false
    t.string "status", null: false
    t.bigint "amount_cents", default: 0, null: false
    t.bigint "amount_captured_cents", default: 0, null: false
    t.bigint "amount_refunded_cents", default: 0, null: false
    t.bigint "application_fee_amount_cents", default: 0, null: false
    t.string "currency", limit: 3, default: "BRL", null: false
    t.jsonb "metadata", default: {}, null: false
    t.jsonb "data", default: {}, null: false
    t.jsonb "invoice", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "subscription_id", "subscription_invoice_id", "processor_id"], name: "index_subscription_charges_on_composed_index"
    t.index ["account_id"], name: "index_subscription_charges_on_account_id"
    t.index ["processor_id"], name: "index_subscription_charges_on_processor_id", unique: true
    t.index ["status"], name: "index_subscription_charges_on_status"
    t.index ["subscription_id"], name: "index_subscription_charges_on_subscription_id"
    t.index ["subscription_invoice_id"], name: "index_subscription_charges_on_subscription_invoice_id"
  end

  create_table "subscription_invoices", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "subscription_id", null: false
    t.string "processor_id", null: false
    t.string "status", null: false
    t.jsonb "data", default: {}, null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "invoiced_at"
    t.index ["account_id", "subscription_id", "processor_id"], name: "index_subscription_invoices_on_composed_index"
    t.index ["account_id"], name: "index_subscription_invoices_on_account_id"
    t.index ["processor_id"], name: "index_subscription_invoices_on_processor_id", unique: true
    t.index ["subscription_id"], name: "index_subscription_invoices_on_subscription_id"
  end

  create_table "subscription_webhooks", force: :cascade do |t|
    t.string "event_type", null: false
    t.string "status", default: "pending", null: false
    t.jsonb "event", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "details", default: {}, null: false
  end

  create_table "subscriptions", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "processor_id", null: false
    t.string "processor_plan_id"
    t.string "processor_product_id"
    t.string "status", null: false
    t.string "name", null: false
    t.boolean "cancel_at_period_end", default: false, null: false
    t.datetime "current_period_start", null: false
    t.datetime "current_period_end", null: false
    t.jsonb "data", default: {}, null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "processor_id"], name: "index_subscriptions_on_account_id_and_processor_id"
    t.index ["account_id"], name: "index_subscriptions_on_account_id"
    t.index ["processor_id"], name: "index_subscriptions_on_processor_id", unique: true
  end

  create_table "taggings", force: :cascade do |t|
    t.bigint "tag_id"
    t.string "taggable_type"
    t.bigint "taggable_id"
    t.string "tagger_type"
    t.bigint "tagger_id"
    t.string "context", limit: 128
    t.datetime "created_at", precision: nil
    t.string "tenant", limit: 128
    t.index ["context"], name: "index_taggings_on_context"
    t.index ["tag_id", "taggable_id", "taggable_type", "context", "tagger_id", "tagger_type"], name: "taggings_idx", unique: true
    t.index ["tag_id"], name: "index_taggings_on_tag_id"
    t.index ["taggable_id", "taggable_type", "context"], name: "taggings_taggable_context_idx"
    t.index ["taggable_id", "taggable_type", "tagger_id", "context"], name: "taggings_idy"
    t.index ["taggable_id"], name: "index_taggings_on_taggable_id"
    t.index ["taggable_type", "taggable_id"], name: "index_taggings_on_taggable_type_and_taggable_id"
    t.index ["taggable_type"], name: "index_taggings_on_taggable_type"
    t.index ["tagger_id", "tagger_type"], name: "index_taggings_on_tagger_id_and_tagger_type"
    t.index ["tagger_id"], name: "index_taggings_on_tagger_id"
    t.index ["tagger_type", "tagger_id"], name: "index_taggings_on_tagger_type_and_tagger_id"
    t.index ["tenant"], name: "index_taggings_on_tenant"
  end

  create_table "tags", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "taggings_count", default: 0
    t.index ["name"], name: "index_tags_on_name", unique: true
  end

  create_table "timeline_events", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "contact_id", null: false
    t.bigint "account_user_id"
    t.text "raw_input"
    t.string "source", default: "manual"
    t.string "sono"
    t.string "carga"
    t.text "observacao"
    t.text "proxima_acao"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id", "contact_id", "created_at"], name: "idx_timeline_events_account_contact_date"
    t.index ["account_id"], name: "index_timeline_events_on_account_id"
  end

  create_table "transactions", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "bank_account_id"
    t.bigint "contact_id"
    t.bigint "category_id"
    t.bigint "cost_center_id"
    t.bigint "transfer_to_id"
    t.bigint "installment_source_id"
    t.integer "transaction_type_cd", default: 0, null: false
    t.integer "payment_method_cd", default: 0, null: false
    t.integer "payment_type_cd", default: 0, null: false
    t.integer "installment_type_cd"
    t.boolean "paid", default: false, null: false
    t.datetime "paid_at"
    t.date "due_date", null: false
    t.date "competency_date"
    t.string "document_number"
    t.string "name"
    t.text "description"
    t.integer "installment_number"
    t.integer "installment_total"
    t.bigint "amount_cents", default: 0, null: false
    t.string "amount_currency", limit: 3, default: "BRL", null: false
    t.bigint "exchanged_amount_cents", default: 0, null: false
    t.string "exchanged_amount_currency", limit: 3, default: "BRL", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "import_id"
    t.bigint "created_by_id"
    t.bigint "updated_by_id"
    t.tsvector "tsv_body"
    t.bigint "parent_id"
    t.integer "kind_cd", default: 0, null: false
    t.bigint "paid_amount_cents", default: 0, null: false
    t.string "paid_amount_currency", limit: 3, default: "BRL", null: false
    t.bigint "payment_plan_id"
    t.bigint "service_id"
    t.decimal "amount"
    t.bigint "appointment_id"
    t.index ["account_id", "category_id"], name: "index_transactions_on_account_id_and_category_id"
    t.index ["account_id", "contact_id"], name: "index_transactions_on_account_id_and_contact_id"
    t.index ["account_id", "cost_center_id"], name: "index_transactions_on_account_id_and_cost_center_id"
    t.index ["account_id", "due_date"], name: "index_transactions_on_account_due_date"
    t.index ["account_id", "due_date"], name: "index_transactions_on_account_id_and_due_date", order: { due_date: :desc }
    t.index ["account_id", "id"], name: "index_transactions_on_account_id_and_id", order: { id: :desc }
    t.index ["account_id", "kind_cd"], name: "index_transactions_on_kind_cd"
    t.index ["account_id", "paid", "due_date"], name: "index_transactions_on_delayed_transactions_filter"
    t.index ["account_id", "paid"], name: "index_transactions_on_account_paid"
    t.index ["account_id", "paid"], name: "index_transactions_on_paid"
    t.index ["account_id", "transaction_type_cd"], name: "index_transactions_on_account_id_and_transaction_type_cd"
    t.index ["account_id"], name: "index_transactions_on_account_id"
    t.index ["appointment_id"], name: "index_transactions_on_appointment_id"
    t.index ["bank_account_id"], name: "index_transactions_on_bank_account_id"
    t.index ["category_id"], name: "index_transactions_on_category_id"
    t.index ["contact_id"], name: "index_transactions_on_contact_id"
    t.index ["cost_center_id"], name: "index_transactions_on_cost_center_id"
    t.index ["created_by_id"], name: "index_transactions_on_created_by_id"
    t.index ["import_id"], name: "index_transactions_on_import_id"
    t.index ["installment_source_id"], name: "index_transactions_on_installment_source_id"
    t.index ["installment_type_cd"], name: "index_transactions_on_installment_type_cd"
    t.index ["kind_cd", "account_id", "bank_account_id", "due_date"], name: "index_transactions_on_multisearch_columns", order: { due_date: :desc }
    t.index ["kind_cd", "transaction_type_cd", "account_id", "bank_account_id", "due_date"], name: "index_transactions_on_search_bank_account", order: { due_date: :desc }
    t.index ["kind_cd", "transaction_type_cd", "account_id", "due_date"], name: "index_transactions_on_search", order: { due_date: :desc }
    t.index ["kind_cd", "transaction_type_cd", "account_id", "transfer_to_id", "due_date"], name: "index_transactions_on_search_transfer_to", order: { due_date: :desc }
    t.index ["kind_cd", "transaction_type_cd", "account_id"], name: "index_transactions_on_search_without_due_date"
    t.index ["paid", "kind_cd", "transaction_type_cd", "account_id", "bank_account_id"], name: "index_transactions_on_bank_acccount_balance", order: { paid: :desc }
    t.index ["paid", "kind_cd", "transaction_type_cd", "account_id", "transfer_to_id"], name: "index_transactions_on_credit_balance", order: { paid: :desc }
    t.index ["parent_id"], name: "index_transactions_on_parent_id"
    t.index ["payment_method_cd"], name: "index_transactions_on_payment_method_cd"
    t.index ["payment_plan_id"], name: "index_transactions_on_payment_plan_id"
    t.index ["payment_type_cd"], name: "index_transactions_on_payment_type_cd"
    t.index ["service_id"], name: "index_transactions_on_service_id"
    t.index ["transfer_to_id"], name: "index_transactions_on_transfer_to_id"
    t.index ["tsv_body"], name: "index_transactions_on_tsv_body", using: :gin
    t.index ["updated_by_id"], name: "index_transactions_on_updated_by_id"
  end

  create_table "users", force: :cascade do |t|
    t.bigint "account_id"
    t.string "first_name"
    t.string "last_name"
    t.string "preferred_language"
    t.string "time_zone"
    t.boolean "admin", default: false, null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "accepted_terms_at"
    t.datetime "accepted_privacy_at"
    t.string "invitation_token"
    t.datetime "invitation_created_at"
    t.datetime "invitation_sent_at"
    t.datetime "invitation_accepted_at"
    t.integer "invitation_limit"
    t.bigint "invited_by_id"
    t.string "invited_by_type"
    t.bigint "lead_code"
    t.boolean "zp_user"
    t.string "contact_me_by"
    t.string "phone_number"
    t.string "postcode"
    t.datetime "last_announcement_read_at", default: "2025-12-04 16:58:50", null: false, comment: "Date of last read announcement"
    t.boolean "visible_amount", default: true, null: false, comment: "Whether the user can see the amount of the referral code"
    t.boolean "preference_receive_email", default: true
    t.boolean "preference_all_bank_accounts", default: false
    t.boolean "preference_change_date", default: false
    t.boolean "collapsed_menu", default: false
    t.boolean "preference_beta_tester", default: false, null: false
    t.boolean "show_initial_tour"
    t.boolean "preference_disable_view_recurrence", default: false, null: false
    t.datetime "onboarding_created_at"
    t.boolean "preference_static_totalizer", default: false
    t.string "api_token"
    t.string "provider"
    t.string "uid"
    t.string "whatsapp_number"
    t.index ["account_id"], name: "index_users_on_account_id"
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["invitation_token"], name: "index_users_on_invitation_token", unique: true
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "webhooks", force: :cascade do |t|
    t.string "url"
    t.datetime "last_used_at"
    t.integer "last_response"
    t.bigint "account_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_webhooks_on_account_id"
  end

  create_table "whatsapp_configs", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.string "evolution_api_url"
    t.string "evolution_api_key"
    t.string "evolution_instance_name", default: "default"
    t.boolean "enabled", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "allowed_hours_start", default: 8, null: false
    t.integer "allowed_hours_end", default: 20, null: false
    t.integer "cooldown_minutes", default: 30, null: false
    t.json "automations", default: {"appointment_confirmation"=>true, "appointment_reminder_24h"=>true, "appointment_reminder_1h"=>true, "payment_link"=>true, "payment_confirmed"=>true, "meal_plan_updated"=>false, "form_pending"=>false, "return_reminder"=>false}
    t.string "connected_phone"
    t.string "instance_status", default: "close"
    t.index ["account_id"], name: "index_whatsapp_configs_on_account_id", unique: true
  end

  create_table "whatsapp_messages", force: :cascade do |t|
    t.bigint "account_id", null: false
    t.bigint "contact_id", null: false
    t.string "event_type", null: false
    t.string "channel", default: "bot", null: false
    t.string "status", default: "pending", null: false
    t.string "idempotency_key", null: false
    t.text "body"
    t.datetime "scheduled_for"
    t.datetime "sent_at"
    t.string "reference_type"
    t.bigint "reference_id"
    t.string "external_id"
    t.string "error_message"
    t.json "metadata"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_id"], name: "index_whatsapp_messages_on_account_id"
    t.index ["contact_id", "scheduled_for"], name: "index_whatsapp_messages_on_contact_id_and_scheduled_for"
    t.index ["contact_id"], name: "index_whatsapp_messages_on_contact_id"
    t.index ["idempotency_key"], name: "index_whatsapp_messages_on_idempotency_key", unique: true
    t.index ["reference_type", "reference_id"], name: "index_whatsapp_messages_on_reference_type_and_reference_id"
    t.index ["status", "scheduled_for"], name: "index_whatsapp_messages_on_status_and_scheduled_for"
  end

  create_table "zero_paper_items", force: :cascade do |t|
    t.bigint "import_id", null: false
    t.string "transaction_type"
    t.date "due_date"
    t.date "competency_date"
    t.string "name"
    t.float "amount"
    t.string "category"
    t.string "contact"
    t.boolean "paid"
    t.text "description"
    t.string "bank_account"
    t.string "document_number"
    t.string "payment_method"
    t.string "cost_center"
    t.string "tags"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "imported", default: false, null: false
    t.index ["import_id"], name: "index_zero_paper_items_on_import_id"
    t.index ["imported"], name: "index_zero_paper_items_on_imported"
    t.index ["transaction_type", "due_date", "name", "amount", "paid"], name: "index_zero_paper_items_on_filters"
  end

  add_foreign_key "account_invitations", "accounts"
  add_foreign_key "account_invitations", "users", column: "invited_by_id"
  add_foreign_key "account_users", "accounts"
  add_foreign_key "account_users", "users"
  add_foreign_key "accounts", "accounts", column: "related_to_id"
  add_foreign_key "accounts", "people", column: "company_id"
  add_foreign_key "accounts", "referral_codes"
  add_foreign_key "accounts", "subscriptions"
  add_foreign_key "accounts", "users", column: "owner_id"
  add_foreign_key "active_storage_attachments", "accounts"
  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "ai_token_usages", "accounts", on_delete: :nullify
  add_foreign_key "ai_token_usages", "people", column: "contact_id", on_delete: :nullify
  add_foreign_key "anamnese_responses", "accounts"
  add_foreign_key "anamnese_responses", "anamnese_templates"
  add_foreign_key "anamnese_responses", "appointments"
  add_foreign_key "anamnese_responses", "people", column: "contact_id"
  add_foreign_key "anamnese_templates", "accounts"
  add_foreign_key "api_tokens", "accounts"
  add_foreign_key "api_tokens", "users"
  add_foreign_key "appointment_commissions", "account_users"
  add_foreign_key "appointment_commissions", "appointments"
  add_foreign_key "appointment_links", "account_users"
  add_foreign_key "appointment_links", "accounts"
  add_foreign_key "appointment_links", "offers", column: "service_id"
  add_foreign_key "appointment_notes", "accounts"
  add_foreign_key "appointment_notes", "appointments"
  add_foreign_key "appointments", "account_users"
  add_foreign_key "appointments", "accounts"
  add_foreign_key "appointments", "anamnese_templates"
  add_foreign_key "appointments", "appointment_links", on_delete: :nullify
  add_foreign_key "appointments", "appointments", column: "parent_appointment_id", on_delete: :nullify
  add_foreign_key "appointments", "offers", column: "service_id"
  add_foreign_key "appointments", "people", column: "contact_id"
  add_foreign_key "bank_accounts", "accounts"
  add_foreign_key "bank_accounts", "banks"
  add_foreign_key "bank_accounts", "users", column: "created_by_id"
  add_foreign_key "bank_accounts", "users", column: "updated_by_id"
  add_foreign_key "coaching_insights", "accounts"
  add_foreign_key "coaching_insights", "people", column: "contact_id"
  add_foreign_key "coaching_profiles", "accounts"
  add_foreign_key "coaching_profiles", "people", column: "contact_id"
  add_foreign_key "company_nfse_configs", "people", column: "company_id"
  add_foreign_key "contracts", "document_templates", column: "contract_template_id"
  add_foreign_key "contracts", "people", column: "contact_id"
  add_foreign_key "document_templates", "accounts"
  add_foreign_key "domains", "accounts"
  add_foreign_key "domains", "users", column: "created_by_id"
  add_foreign_key "domains", "users", column: "updated_by_id"
  add_foreign_key "enums", "enums", column: "parent_id"
  add_foreign_key "exports", "accounts"
  add_foreign_key "feedbacks", "users"
  add_foreign_key "imports", "accounts"
  add_foreign_key "integration_stores", "accounts"
  add_foreign_key "invoice_lines", "invoices"
  add_foreign_key "invoice_lines", "offers"
  add_foreign_key "invoices", "accounts"
  add_foreign_key "invoices", "bank_accounts"
  add_foreign_key "invoices", "people", column: "provider_id"
  add_foreign_key "invoices", "people", column: "recipient_id"
  add_foreign_key "offers", "accounts"
  add_foreign_key "patient_documents", "accounts"
  add_foreign_key "patient_documents", "people", column: "contact_id"
  add_foreign_key "patient_goals", "accounts"
  add_foreign_key "patient_goals", "people", column: "contact_id"
  add_foreign_key "patient_notes", "accounts"
  add_foreign_key "patient_notes", "people", column: "contact_id"
  add_foreign_key "payment_plans", "accounts"
  add_foreign_key "payouts", "account_users"
  add_foreign_key "payouts", "accounts"
  add_foreign_key "people", "accounts"
  add_foreign_key "people", "enums", column: "cnae_id"
  add_foreign_key "people", "segments", column: "sector_activity_id"
  add_foreign_key "people", "users", column: "created_by_id"
  add_foreign_key "people", "users", column: "updated_by_id"
  add_foreign_key "pg_search_documents", "accounts"
  add_foreign_key "pix_billings", "accounts"
  add_foreign_key "professional_commissions", "account_users"
  add_foreign_key "professional_commissions", "services"
  add_foreign_key "relationship_stores", "accounts"
  add_foreign_key "relationship_stores", "integration_stores"
  add_foreign_key "relationship_stores", "users", column: "synced_by_id"
  add_foreign_key "reviews", "accounts"
  add_foreign_key "secondary_cnaes", "enums", column: "cnae_id"
  add_foreign_key "secondary_cnaes", "people"
  add_foreign_key "segments", "segments", column: "parent_id"
  add_foreign_key "service_nfse_configs", "offers", column: "service_id"
  add_foreign_key "services", "accounts"
  add_foreign_key "statement_items", "bank_accounts", column: "bank_account_source_id"
  add_foreign_key "statement_items", "bank_accounts", column: "bank_account_target_id"
  add_foreign_key "statement_items", "domains", column: "category_id"
  add_foreign_key "statement_items", "people", column: "contact_id"
  add_foreign_key "statement_items", "statements"
  add_foreign_key "statement_items", "transactions", column: "related_transaction_id"
  add_foreign_key "statements", "accounts"
  add_foreign_key "statements", "bank_accounts"
  add_foreign_key "subscription_charges", "accounts"
  add_foreign_key "subscription_charges", "subscription_invoices"
  add_foreign_key "subscription_charges", "subscriptions"
  add_foreign_key "subscription_invoices", "accounts"
  add_foreign_key "subscription_invoices", "subscriptions"
  add_foreign_key "subscriptions", "accounts"
  add_foreign_key "taggings", "tags"
  add_foreign_key "timeline_events", "account_users"
  add_foreign_key "timeline_events", "accounts"
  add_foreign_key "timeline_events", "people", column: "contact_id"
  add_foreign_key "transactions", "accounts"
  add_foreign_key "transactions", "appointments"
  add_foreign_key "transactions", "bank_accounts"
  add_foreign_key "transactions", "bank_accounts", column: "transfer_to_id"
  add_foreign_key "transactions", "domains", column: "category_id"
  add_foreign_key "transactions", "domains", column: "cost_center_id"
  add_foreign_key "transactions", "imports"
  add_foreign_key "transactions", "offers", column: "service_id"
  add_foreign_key "transactions", "payment_plans"
  add_foreign_key "transactions", "people", column: "contact_id"
  add_foreign_key "transactions", "transactions", column: "installment_source_id"
  add_foreign_key "transactions", "transactions", column: "parent_id"
  add_foreign_key "transactions", "users", column: "created_by_id"
  add_foreign_key "transactions", "users", column: "updated_by_id"
  add_foreign_key "users", "accounts"
  add_foreign_key "webhooks", "accounts"
  add_foreign_key "whatsapp_configs", "accounts"
  add_foreign_key "whatsapp_messages", "accounts"
  add_foreign_key "whatsapp_messages", "people", column: "contact_id"
  add_foreign_key "zero_paper_items", "imports"
end
