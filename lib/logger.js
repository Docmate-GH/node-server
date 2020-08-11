"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = void 0;
const Sentry = require('@sentry/node');
const isSentryEnabled = process.env.SENTRY_DSN;
exports.logError = (err, userId) => {
    if (isSentryEnabled) {
        Sentry.withScope(function (scope) {
            scope.setLevel('error');
            scope.setUser({
                id: userId || 'guest'
            });
            Sentry.captureException(err);
        });
    }
};
