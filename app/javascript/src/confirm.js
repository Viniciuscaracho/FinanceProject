// Custom TailwindCSS modals for confirm dialogs
function insertConfirmModal(message, element) {
    const translations = {
        'pt-BR': {
            cancel: 'Cancelar',
            confirm: 'Confirmar'
        },
        'en': {
            cancel: 'Cancel',
            confirm: 'Confirm'
        }
    };

    const lang = document.documentElement.lang || "pt-BR";

    const {cancel, confirm} = translations[lang];

    let content = `
    <div id="confirm-modal" class="z-50 animate__animated animate__fadeIn animate__faster fixed top-0 left-0 w-full h-full table" style = "background-color: rgba(0, 0, 0, 0.8);">
      <div class="table-cell align-middle">
        <div class="bg-white mx-3 sm:mx-auto rounded shadow p-3 sm:p-6 max-w-sm animate__animated animate__fadeIn animate__zoomIn animate__faster">
          <div class="text-left pb-3 text-base">${message}</div>
          <div class="pt-3 flex justify-between items-center flex-wrap space-x-0 sm:space-x-2 space-y-2 sm:space-y-0">
            <button data-behavior="cancel" class="btn">${cancel}</button>
            <button data-behavior="commit" class="btn btn--danger">${confirm}</button>
          </div>
        </div>
      </div>
    </div>
  `
    document.body.insertAdjacentHTML('beforeend', content)
    return document.getElementById("confirm-modal")
}

Turbo.setConfirmMethod((message, element) => {
    let dialog = insertConfirmModal(message, element)

    return new Promise((resolve, reject) => {
        dialog.querySelector("[data-behavior='cancel']").addEventListener("click", (event) => {
            dialog.remove()
            resolve(false)
        }, {once: true})
        dialog.querySelector("[data-behavior='commit']").addEventListener("click", (event) => {
            dialog.remove()
            resolve(true)
        }, {once: true})
    })
})
