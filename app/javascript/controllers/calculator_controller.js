import {Controller} from "@hotwired/stimulus"
import {get} from "@rails/request.js";
import tippy from "tippy.js";

export default class extends Controller {
  static targets = ["result", "input", "hidden", "button", "transaction"]
  // hidden é a classe que esconde o resultado

  static values = {
    transaction: String,
    url: String,
    messages: Object
  }

  async connect() {
    this.buttonTarget.addEventListener("click", () => {
      this.show()
    })
  }

  disconnect() {
    super.disconnect();
  }

  async show(event) {
    let response = await get(this.urlValue, {
      responseKind: 'html'
    })

    let _html = await response.html

    this.tippyInstance = await tippy(this.buttonTarget, {
      trigger: 'manual',
      content: _html,
      theme: 'light',
      placement: 'right',
      animation: 'scale-extreme',
      interactive: true,
      arrow: true,
      allowHTML: true,
      popperOptions: {
        strategy: 'fixed',
        modifiers: [
          {
            name: 'flip',
            options: {
              fallbackPlacements: ['bottom', 'right'],
            },
          },
          {
            name: 'preventOverflow',
            options: {
              altAxis: true,
              tether: false,
            },
          },
        ],
      }
    });

    this.tippyInstance.show()

    this.connect_format_input()
    this.focus()

  }

  // formata o valor do input
  connect_format_input() {

    let initialValue = parseFloat(this.transactionTarget.value.replace(/\./g, '').replace(/,/g, '.'));

    if (isNaN(initialValue) || initialValue == 0) {
      this.inputTarget.value = null;
      return;
    }


    this.inputTarget.value = initialValue.toFixed(2).replace(/\./g, ',');

  }

  // substitui o valor do input pelo valor do resultado
  result_to_input(event) {
    this.focus()
    this.inputTarget.value = this.resultTarget.innerHTML.replace(/\,00/g, '').replace(/\./g, '');
    this.hiddenTarget.classList.add("hidden");

  }

  // insere o valor do botão clicado no input
  insert_on_input(event) {
    this.focus()
    this.inputTarget.value += event.target.dataset.value;
    this.calculate()
  }

  // previne que letras sejam inseridas no input
  oninput(event) {
    event.target.value = event.target.value.replace(/[a-zA-Z]/, '')
    this.calculate()
  }

  // previne que o formulário seja enviado ao apertar enter
  // e calcula o valor do input e substitui pelo resultado
  prevent_submit(event) {
    // se o enter for pressionado
    if (event.key === 'Enter') {

      event.preventDefault();
      this.calculate()
      this.result_to_input()
    }
  }

  // remove o último caractere do input
  remove() {
    this.focus()
    this.inputTarget.value = this.inputTarget.value.slice(0, -1);
    this.calculate()
  }

  closeCalculator() {
    if (this.tippyInstance) {
      this.tippyInstance.destroy();
    }
  }

  closeKeyPress(event) {
    if (event.code === "Escape") {
      this.closeCalculator();
    }
  }

  // remove todos os caracteres do input e coloca o valor 0,00
  remove_all() {
    this.focus()
    this.inputTarget.value = null;
    this.calculate()
  }

  // focaliza o input
  focus() {
    this.inputTarget.focus()
  }

  // calcula o input e coloca no resultado
  calculate() {

    if (this.inputTarget.value.length === 0) {
      this.resultTarget.innerHTML = "0,00";
      return;
    }

    try {
      this.hiddenTarget.classList.remove("hidden");
      let input = this.inputTarget.value;

      // troca a virgula por ponto
      input = input.replace(/,/g, '.');

      // remove os zeros a esquerda
      input = input.replace(/^(0+)(\d)/g, "$2");

      this.resultTarget.innerHTML = this.format(window.eval(input));

    } catch (e) {
      console.warn(e)
    }
  }

  // envia o valor do resultado para o form da transação
  replace_transaction_amount(event) {
    this.focus()
    try {

      let value = window.eval(this.inputTarget.value.replace(/,/g, '.'));

      // se o valor for maior que 999999999.99, o valor não será enviado
      if (value === undefined || parseFloat(value) > 999999999.99) {
        this.transfer_error_message(event)
        return;
      }

      value = this.turnPositive(value);

      this.transactionTarget.value = this.format(value);

      // dispara o evento change no input
      this.transactionTarget.dispatchEvent(new Event('change', {bubbles: true}));

      this.transfer_success_message(event)

    } catch (e) {
      this.transfer_error_message(event)
    }
  }

  turnPositive(value) {
    parseInt(value)
    return value < 0 ? value * -1 : value;
  }

  transfer_error_message(event) {
    let button_value = event.target.innerHTML;

    event.target.innerHTML = this.messagesValue["error"];
    setTimeout(() => {
      event.target.innerHTML = button_value;
    }, 1500);
  }

  transfer_success_message(event) {
    let button_value = event.target.innerHTML;

    event.target.innerHTML = this.messagesValue["success"];
    setTimeout(() => {
      event.target.innerHTML = button_value;
    }, 1500);
  }

  format(number) {

    let numberString = number.toFixed(2).toString();

    let parts = numberString.split('.');

    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return parts.join(',');
  }
}
