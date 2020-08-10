"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = void 0;
const Sentry = require('@sentry/node');
const isSentryEnabled = process.env.SENTRY_DSN;
exports.logError = (err, userId) => {
    if (isSentryEnabled) {
        Sentry.withScope(scope => {
            scope.setLevel('error');
            scope.setUser({
                id: userId
            });
            scope.captureException(err);
        });
    }
};
