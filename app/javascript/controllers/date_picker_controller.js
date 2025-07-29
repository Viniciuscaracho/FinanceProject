import {Controller} from "@hotwired/stimulus"
import AirDatepicker from 'air-datepicker'
import localePtBR from 'air-datepicker/locale/pt-BR'
import localeEn from 'air-datepicker/locale/en'
import {createPopper} from '@popperjs/core'
import moment from 'moment'

export default class extends Controller {
  static values = {
    locale: {type: String, default: 'pt-BR'},
    format: {type: String, default: 'dd/MM/yyyy'},
    range: {type: Boolean, default: false},
    minDate: String,
    maxDate: String,
    selectedMonth: String,
    renderOnBody: {type: Boolean, default: true},
    monthStyling: Boolean
  }

  locale() {
    switch (this.localeValue) {
      case 'pt-BR':
        return localePtBR
      case 'en':
        return localeEn
      default:
        return localePtBR
    }
  }

  connect() {
    const locale = this.locale()
    const selectedMonth = this.data.get('selectedMonth')
    this.setupDatePicker(locale, selectedMonth)
  }

  setupDatePicker(locale, selectedMonth) {
    if (this.rangeValue) {

      const startDate = moment(this.minDateValue).toDate();
      const endDate = moment(this.maxDateValue).toDate();

      this.setupRangeDatePicker(locale, [startDate, endDate], selectedMonth);

    } else {

      const selectedDate = this.getSelectedDate();
      this.setupSingleDatePicker(locale, selectedDate);

    }
  }

  getSelectedDate() {
    if (!this.element.value) return null;

    return moment(this.element.value, this.formatValue.toUpperCase(), this.localeValue.toLowerCase()).toDate();
  }


  setupSingleDatePicker(locale, selectedDate) {
    this.handleSingleDatePickerSelect = this.handleSingleDatePickerSelect.bind(this)
    this.popperPosition = this.popperPosition.bind(this)

    const config = {
      locale: locale,
      dateFormat: this.formatValue,
      selectedDates: selectedDate ? [selectedDate] : [],
      autoClose: true,
      view: 'days',
      container: this.renderOnBodyValue ? document.body : this.element.parentNode,
      toggleSelected: false,
      onSelect: this.handleSingleDatePickerSelect,
      position: this.popperPosition
    };

    this.datePicker = new AirDatepicker(this.element, config);
  }

  handleSingleDatePickerSelect({formattedDate}) {
    this.element.value = formattedDate;
    this.element.dispatchEvent(new Event('change'));
  }


  setupRangeDatePicker(locale) {
    this.handleRangeDatePickerSelect = this.handleRangeDatePickerSelect.bind(this)
    this.popperPosition = this.popperPosition.bind(this)

    const config = {
      locale: locale,
      dateFormat: this.formatValue,
      selectedDates: [],
      autoClose: false,
      view: 'days',
      container: this.renderOnBodyValue ? document.body : this.element.parentNode,
      toggleSelected: true,
      range: true,
      onSelect: this.handleRangeDatePickerSelect,
      position: this.popperPosition
    };

    if (this.minDateValue) {
      config.minDate = moment(this.minDateValue).toDate();
    }

    if (this.maxDateValue) {
      config.maxDate = moment(this.maxDateValue).toDate();
    }

    this.datePicker = new AirDatepicker(this.element, config);
  }

  handleRangeDatePickerSelect({date, formattedDate}) {
    if (date.length === 1) {
      this.handleSingleDateSelect(formattedDate);
    } else if (date.length === 2) {
      this.handleRangeDateSelect(date, formattedDate);
    }
  }

  handleSingleDateSelect(formattedDate) {
    if (this.monthStylingValue) {
      this.element.value = formattedDate.map(date => date.slice(0, 5)).join(' - ');
    } else {
      this.element.value = formattedDate[0];
    }
  }

  handleRangeDateSelect(date, formattedDate) {
    if (this.monthStylingValue) {
      this.element.value = formattedDate.map(date => date.slice(0, 5)).join(' - ');

      const startDateField = document.getElementById('start_date_field');
      const endDateField = document.getElementById('end_date_field');

      // format to this format: 2021-08-01
      startDateField.value = formattedDate[0].split('/').reverse().join('-');
      endDateField.value = formattedDate[1].split('/').reverse().join('-');
    } else {
      this.element.value = formattedDate.join(' - ');
    }

    this.element.dispatchEvent(new Event('change'));

  }


  popperPosition({$datepicker, $target, $pointer, done}) {
    let popper = createPopper($target, $datepicker, {
      placement: 'top',
      modifiers: [
        {
          name: 'flip',
          options: {
            padding: {
              top: 64
            }
          }
        },
        {
          name: 'offset',
          options: {
            offset: [0, 20]
          }
        },
        {
          name: 'arrow',
          options: {
            element: $pointer
          }
        }
      ]
    })

    return function completeHide() {
      popper.destroy();
      done();
    }
  }

  disconnect() {
    this.datePicker.destroy()
  }

  update(event) {
    event.preventDefault();

    const inputValue = this.element.value;
    const expectedFormatLength = this.formatValue.length;

    if (inputValue.length === expectedFormatLength) {
      const formattedDate = moment(inputValue, this.formatValue.toUpperCase(), this.localeValue.toLowerCase()).toDate();
      this.datePicker.selectDate(formattedDate, {silent: true});
    }
  }

}