import { Turbo } from "@hotwired/turbo-rails";

document.addEventListener('turbo:frame-render', async e => {
  if (['main', '_top'].includes(e.target?.id)) {
    history.pushState(history.state, '', await e.detail.fetchResponse.location)
  }
})

window.addEventListener('popstate', () => Turbo.visit(window.location.href))