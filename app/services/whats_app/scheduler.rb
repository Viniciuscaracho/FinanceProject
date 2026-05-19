# frozen_string_literal: true

module WhatsApp
  class Scheduler
    def self.next_slot(account, contact)
      config  = config_for(account)
      now     = Time.current

      earliest = apply_cooldown(contact, config.cooldown_minutes, now)
      push_to_allowed_window(earliest, config.allowed_hours_start, config.allowed_hours_end)
    end

    def self.config_for(account)
      account.whatsapp_config || account.build_whatsapp_config
    end

    def self.apply_cooldown(contact, cooldown_minutes, now)
      last_sent = WhatsappMessage.recently_sent_to(contact, cooldown_minutes).maximum(:sent_at)
      return now unless last_sent

      cooldown_end = last_sent + cooldown_minutes.minutes
      cooldown_end > now ? cooldown_end : now
    end

    def self.push_to_allowed_window(time, hour_start, hour_end)
      tz_time = time.in_time_zone("America/Sao_Paulo")
      hour    = tz_time.hour

      if hour < hour_start
        tz_time.change(hour: hour_start, min: 0, sec: 0).utc
      elsif hour >= hour_end
        (tz_time + 1.day).change(hour: hour_start, min: 0, sec: 0).utc
      else
        time
      end
    end
  end
end
