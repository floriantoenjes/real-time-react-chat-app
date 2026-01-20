import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Ensure to call this before requiring any other modules!
Sentry.init({
    // dsn: 'https://907df49a6a224292b965b736285e8efb@glitchtip.floriantoenjes.com/2',
    dsn: 'http://907df49a6a224292b965b736285e8efb@glitchtip-web/2',
    integrations: [
        // Add our Profiling integration
        nodeProfilingIntegration(),
    ],

    // Add Tracing by setting tracesSampleRate
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    // Set sampling rate for profiling
    // This is relative to tracesSampleRate
    profilesSampleRate: 0,
    debug: false,
});
