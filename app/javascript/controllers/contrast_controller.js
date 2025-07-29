import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["button", "indicator"]
  static values = { 
    level: { type: String, default: "normal" },
    available: { type: Array, default: ["normal", "high", "ultra"] }
  }

  connect() {
    this.loadSavedLevel()
    this.applyContrastLevel()
  }

  // Carrega o nível de contraste salvo
  loadSavedLevel() {
    const savedLevel = localStorage.getItem('contrast-level')
    if (savedLevel && this.availableValue.includes(savedLevel)) {
      this.levelValue = savedLevel
    }
  }

  // Salva o nível de contraste
  saveLevel() {
    localStorage.setItem('contrast-level', this.levelValue)
  }

  // Aplica o nível de contraste
  applyContrastLevel() {
    document.documentElement.setAttribute('data-contrast', this.levelValue)
    this.updateButtonText()
    this.saveLevel()
  }

  // Atualiza o texto do botão
  updateButtonText() {
    if (this.hasButtonTarget) {
      const levelNames = {
        normal: "Contraste Normal",
        high: "Alto Contraste", 
        ultra: "Contraste Máximo"
      }
      this.buttonTarget.textContent = levelNames[this.levelValue] || "Contraste"
    }
  }

  // Alterna para o próximo nível de contraste
  toggle() {
    const currentIndex = this.availableValue.indexOf(this.levelValue)
    const nextIndex = (currentIndex + 1) % this.availableValue.length
    this.levelValue = this.availableValue[nextIndex]
    this.applyContrastLevel()
  }

  // Define um nível específico
  setLevel(event) {
    const level = event.currentTarget.dataset.level
    if (this.availableValue.includes(level)) {
      this.levelValue = level
      this.applyContrastLevel()
    }
  }

  // Métodos para definir níveis específicos
  setNormal() {
    this.levelValue = "normal"
    this.applyContrastLevel()
  }

  setHigh() {
    this.levelValue = "high"
    this.applyContrastLevel()
  }

  setUltra() {
    this.levelValue = "ultra"
    this.applyContrastLevel()
  }

  // Mostra indicador de contraste ativo
  showIndicator() {
    if (this.hasIndicatorTarget) {
      this.indicatorTarget.classList.remove('hidden')
    }
  }

  // Esconde indicador de contraste
  hideIndicator() {
    if (this.hasIndicatorTarget) {
      this.indicatorTarget.classList.add('hidden')
    }
  }
} 