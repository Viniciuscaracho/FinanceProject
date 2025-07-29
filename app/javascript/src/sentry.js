import { init, configureScope } from '@sentry/browser'
import { BrowserTracing } from '@sentry/tracing'
import { getMetaValue } from '../helpers'

const environment   = getMetaValue("current-env")
const dsn           = getMetaValue("sentry-dsn")
const currentUserId = getMetaValue("current-user-id")
const userLoggedIn  = !!currentUserId

init({
  dsn: dsn,
  integrations: [
    new BrowserTracing()
  ],
  environment: environment,
  enabled: (environment === 'production'),
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: (environment === 'development') ? 0 : 0.1,
})

if (userLoggedIn) {
  const currentUserEmail = getMetaValue("current-user-email")
  const currentUserName  = getMetaValue("current-user-name")
  const currentUserOwner = getMetaValue("current-user-owner")
  const currentUserAdmin = getMetaValue("current-user-admin")

  const currentAccountId         = getMetaValue("current-account-id")
  const currentAccountType       = getMetaValue("current-account-type")
  const currentAccountName       = getMetaValue("current-account-name")
  const currentAccountOwnerName  = getMetaValue("current-account-owner-name")
  const currentAccountOwnerEmail = getMetaValue("current-account-owner-email")
  const turboCacheControl        = getMetaValue("turbo-cache-control")

  const currentUser = {
    id: currentUserId,
    email: currentUserEmail,
    username: currentUserName
  }

  const currentTags = {
    user_owner: currentUserOwner,
    user_admin: currentUserAdmin,
    account_id: currentAccountId,
    account_type: currentAccountType,
    account_name: currentAccountName,
    account_owner_name: currentAccountOwnerName,
    account_owner_email: currentAccountOwnerEmail,
    turbo_cache_control: turboCacheControl
  }

  configureScope((scope) => {
    scope.setTags(currentTags)
    scope.setUser(currentUser)
  })
}
