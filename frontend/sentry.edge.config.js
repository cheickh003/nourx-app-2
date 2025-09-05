import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 1,

  debug: false,

  // Filter out sensitive data
  beforeSend(event) {
    // Remove sensitive data from the event
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.confirmPassword;
      delete event.request.data.token;
    }

    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    return event;
  },

  // Performance monitoring
  enabled: process.env.NODE_ENV === 'production',
});
