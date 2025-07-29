// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails

import { Turbo } from '@hotwired/turbo-rails'
import TurboPower from 'turbo_power' // https://github.com/marcoroth/turbo_power-rails
TurboPower.initialize(Turbo.StreamActions)

import '@rails/actiontext'
import 'vanilla-nested'
import 'chartkick/chart.js'
import 'chartkick/highcharts'
import './src/**/*'
import './controllers'
import './../components'

import * as ActiveStorage from '@rails/activestorage'
ActiveStorage.start()

import Rails from '@rails/ujs'
Rails.start()

// Make accessible for Electron and Mobile adapters
window.Turbo = Turbo
window.Rails = Rails

