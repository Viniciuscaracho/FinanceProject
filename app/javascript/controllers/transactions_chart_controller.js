// Example usage:
// <div data-controller="tooltip" data-tippy-content="Hello world"></div>

import {Controller} from "@hotwired/stimulus"
import Chart from 'chart.js/auto';

export default class extends Controller {
  static values = {
    lineData: {type: Array, default: []},
    columnData: {type: Object, default: {}},
    locale: {type: String, default: 'pt-BR'},
    currency: {type: String, default: 'BRL'},
    paidRevenuesLabel: {type: String, default: 'Recebido'},
    unpaidRevenuesLabel: {type: String, default: 'A receber'},
    paidExpensesLabel: {type: String, default: 'Pago'},
    unpaidExpensesLabel: {type: String, default: 'A pagar'},
    outcomeLabel: {type: String, default: 'Resultado'}
  }

  async connect() {
    Chart.defaults.font.size = 11;
    this.config = this.config.bind(this)
    this.chart = new Chart(this.element.getContext('2d'), this.config())
  }

  config() {
    this.formatCurrency = this.formatCurrency.bind(this)

    return {
      type: 'bar',
      options: {
        locale: this.localeValue,
        responsive: true,
        maintainAspectRatio: false,
        elements: {
          point: {
            radius: 5,
            hoverRadius: 8
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              display: true
            }
          },
          y: {
            stacked: true,
            ticks: {
              //count: 5,
              stepSize: 50000.00,
              maxTicksLimit: 7,
              // Include a dollar sign in the ticks
              callback: (value, _index, _ticks) => this.formatCurrency(value),
              format: {
                style: 'currency',
                currency: this.currencyValue
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      },
      data: {
        labels: this.lineDataValue.map(item => item.month),
        datasets: [
          {
            label: this.outcomeLabelValue,
            data: this.lineDataValue.length > 0 ? this.lineDataValue.map(item => item.value / 100) : [0, 0, 0],
            borderColor: this.lineDataValue.map(_ => '#374151'),
            backgroundColor: this.lineDataValue.map(_ => '#374151'),
            type: 'line',
            order: 0,
          }, {
            label: this.paidRevenuesLabelValue,
            data: this.columnDataValue.paid_revenues.length > 0 ? this.columnDataValue.paid_revenues.map(item => item.value / 100) : [0, 0, 0],
            backgroundColor: this.lineDataValue.map(_ => '#10b981'),
            type: 'bar',
            order: 1,
          }, {
            label: this.unpaidRevenuesLabelValue,
            data: this.columnDataValue.unpaid_revenues.length > 0 ? this.columnDataValue.unpaid_revenues.map(item => item.value / 100) : [0, 0, 0],
            backgroundColor: this.lineDataValue.map(_ => '#a7f3d0'),
            type: 'bar',
            order: 2,
          }, {
            label: this.paidExpensesLabelValue,
            data: this.columnDataValue.paid_expenses.length > 0 ? this.columnDataValue.paid_expenses.map(item => item.value / 100) : [0, 0, 0],
            backgroundColor: this.lineDataValue.map(_ => '#f43f5e'),
            type: 'bar',
            order: 3,
          }, {
            label: this.unpaidExpensesLabelValue,
            data: this.columnDataValue.unpaid_expenses.length > 0 ? this.columnDataValue.unpaid_expenses.map(item => item.value / 100) : [0, 0, 0],
            backgroundColor: this.lineDataValue.map(_ => '#fecdd3'),
            type: 'bar',
            order: 4,
          }
        ]
      }
    }
  }

  disconnect() {
    this.chart.destroy()
  }

  formatCurrency(value) {
    return Intl.NumberFormat(this.localeValue, {style: 'currency', currency: this.currencyValue}).format(value)
  }
}