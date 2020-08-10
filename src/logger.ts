const Sentry = require('@sentry/node');

const isSentryEnabled = process.env.SENTRY_DSN

export const logError = (err, userId: string) => {
  if (isSentryEnabled) {
    Sentry.withScope(scope => {
      scope.setLevel('error')
      scope.setUser({
        id: userId
      })
      scope.captureException(err)
    })
  }
}