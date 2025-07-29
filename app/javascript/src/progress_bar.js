import { Turbo } from "@hotwired/turbo-rails";
Turbo.setProgressBarDelay(700)

const adapter = Turbo.navigator.delegate.adapter
const progressBar = adapter.progressBar

document.addEventListener("turbo:before-fetch-request", (e) => adapter.showProgressBar())
document.addEventListener("turbo:before-fetch-response", (e) => progressBar.hide())
document.addEventListener("turbo:frame-load", (e) => progressBar.hide())
