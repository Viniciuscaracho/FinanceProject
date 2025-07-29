import {Controller} from "@hotwired/stimulus"
import AirDatepicker from 'air-datepicker';
import localePtBR from 'air-datepicker/locale/pt-BR';
import localeEn from 'air-datepicker/locale/en';
import {createPopper} from '@popperjs/core';
import moment from 'moment';

export default class extends Controller {
  static targets = ['month', 'activator']
  static values = {
    locale: {type: String, default: 'pt-BR'},
    viewFormat: {type: String, default: 'MMM/yyyy'},
    dateFormat: {type: String, default: 'YYYY-MM-DD'},
    formattedDate: String,
    bankAccount: String,
    transactionType: String,
    groupedExpenses: Boolean,
    url: String
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

  disconnect() {
    this.datePicker.destroy()
  }

  connect() {
    const locale = this.locale()
    const dateFormat = this.dateFormatValue
    const viewFormat = this.viewFormatValue
    const formattedDate = this.formattedDateValue

    // const url = this.urlValue
    const date = moment(formattedDate, dateFormat.toUpperCase(), this.localeValue.toLowerCase()).toDate()

    this.datePicker = new AirDatepicker(this.activatorTarget, {
      locale: locale,
      dateFormat: viewFormat,
      showEvent: 'click',
      autoClose: false,
      selectedDates: [date],
      view: 'months',
      minView: 'months',
      container: window.document.body,
      onSelect: async ({date, formattedDate, datepicker}) => {
        this.monthTarget.value = moment(date).format(dateFormat)
        this.element.requestSubmit()
      },
      onShow: (isFinished) => {
        this.datePicker.setViewDate(date)
      },
      position({$datepicker, $target, $pointer, done}) {
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
    })
  }
}
