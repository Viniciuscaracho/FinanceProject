import ApexCharts from 'apexcharts'
import {Controller} from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    data: {type: Array, default: []},
    percentage: {type: Number, default: 50},
    locale: {type: String, default: 'pt-BR'},
    currency: {type: String, default: 'BRL'},
    paidRevenuesLabel: {type: String, default: 'Recebido'},
    unpaidRevenuesLabel: {type: String, default: 'A receber'},
    paidExpensesLabel: {type: String, default: 'Pago'},
    unpaidExpensesLabel: {type: String, default: 'A pagar'},
    outcomeLabel: {type: String, default: 'Resultado'}
  }

  connect() {
    this.config = this.config.bind(this);
    const chart = new ApexCharts(this.element, this.config());
    chart.render();
  }

  config() {
    return {
      series: [this.percentageValue],
      chart: {
        height: 200,
        type: 'radialBar'
      },
      plotOptions: {
        radialBar: {
          dataLabels: {
            showOn: "always",
            name: {
              offsetY: -10,
              show: true,
              color: '#F43F5E',
              fontSize: "14px"
            },
            value: {
              color: "#111",
              fontSize: "20px",
              show: true
            }
          },
          hollow: {
            size: '70%',
          }
        },

      },
      fill: {
        colors: ['#F43F5E']
      },
      labels: [this.paidExpensesLabelValue],
    };
  }

}