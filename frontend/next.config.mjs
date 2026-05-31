import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withSentryConfig(nextConfig, {
  // Only upload source maps when SENTRY_AUTH_TOKEN is set (i.e. in CI/prod)
  silent: !process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
  widenClientFileUpload: true,
  // Suppress source map upload unless auth token present — no-op in dev/docker
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
