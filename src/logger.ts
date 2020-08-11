const Sentry = require('@sentry/node');

const isSentryEnabled = process.env.SENTRY_DSN

export const logError = (err, userId: string) => {
  if (isSentryEnabled) {
    Sentry.withScope(function(scope) {
      scope.setLevel('error')
      scope.setUser({
        id: userId || 'guest'
      })
      Sentry.captureException(err)
    })
  }
}