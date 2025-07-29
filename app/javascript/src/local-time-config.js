import LocalTime from 'local-time';

LocalTime.config.i18n['pt-BR'] = {
    date: {
        dayNames: ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
        abbrDayNames: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"],
        monthNames: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
        abbrMonthNames: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
        yesterday: "ontem",
        today: "hoje",
        tomorrow: "amanhã",
        on: "em {date}",
        formats: {"default": "%b %e, %Y", thisYear: "%b %e"}
    },
    time: {
        am: "",
        pm: "",
        singular: "um {time}",
        singularAn: "uma {time}",
        elapsed: "{time} atrás",
        second: "segundo",
        seconds: "segundos",
        minute: "minuto",
        minutes: "minutos",
        hour: "hora",
        hours: "horas",
        formats: {"default": "%H:%M"}
    },
    datetime: {at: "{date} às {time}", formats: {"default": "%B %e, %Y at %H:%M %Z"}}
};

LocalTime.start();
LocalTime.config.locale = document.documentElement.lang || 'en';