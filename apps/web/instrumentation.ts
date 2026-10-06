import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Fail fast on boot if required env vars are missing/invalid.
  const { getServerEnv, isConfigured } = await import("@crm/config");
  const env = getServerEnv();

  if (isConfigured(env, "otel")) {
    const { registerOTel } = await import("@vercel/otel");
    registerOTel({ serviceName: env.observability.otelServiceName ?? "crm-web" });
  }

  if (isConfigured(env, "sentry")) {
    // GlitchTip-compatible: just point SENTRY_DSN at a GlitchTip project.
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: env.observability.sentryDsn,
      tracesSampleRate: 0,
      // v11: renamed from skipOpenTelemetrySetup — keeps @vercel/otel as the
      // sole tracer provider. (sendDefaultPii was removed in v11: PII is
      // opt-in now.)
      enableOpenTelemetrySetup: false,
    });
    const { setErrorReporter } = await import("@crm/observability");
    setErrorReporter({
      captureException(error, context) {
        Sentry.captureException(error, context ? { extra: context } : undefined);
      },
    });
  }

  // pg-boss runs in-process — no worker tier. A failed start logs and leaves
  // enqueues as logged no-ops rather than taking the web process down.
  try {
    const { startJobs } = await import("@crm/automation");
    await startJobs();
  } catch (error) {
    const { captureException } = await import("@crm/observability");
    captureException(error, { component: "jobs", phase: "start" });
  }
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const { captureException } = await import("@crm/observability");
  captureException(error, {
    path: request.path,
    method: request.method,
    routeType: context.routeType,
    renderSource: context.renderSource,
  });
};
