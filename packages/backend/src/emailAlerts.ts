import type { Env } from "./types";

export type JobFailureSource = "error_limit" | "dlq";

/**
 * Sends a transactional email when a job reaches failed status.
 * No-ops unless SEND_EMAIL, JOB_FAILURE_ALERT_FROM, and JOB_FAILURE_ALERT_TO are all set.
 */
export async function notifyJobFailed(
  env: Env,
  detail: {
    jobId: string;
    customerId: string;
    jobName: string;
    reason: string;
    source: JobFailureSource;
  },
): Promise<void> {
  const binding = env.SEND_EMAIL;
  const from = env.JOB_FAILURE_ALERT_FROM?.trim();
  const to = env.JOB_FAILURE_ALERT_TO?.trim();
  if (!binding || !from || !to) {
    if (!from || !to) {
      console.info(
        "[email] job failure alert skipped: set JOB_FAILURE_ALERT_FROM and JOB_FAILURE_ALERT_TO (wrangler.jsonc vars, .dev.vars for local only, or dashboard).",
      );
    } else if (!binding) {
      console.info(
        "[email] job failure alert skipped: add a send_email binding named SEND_EMAIL in wrangler.",
      );
    }
    return;
  }

  const subject = `[fff-batch-queuer] Job failed: ${detail.jobName}`;
  const sourceLabel =
    detail.source === "error_limit"
      ? "error attempts exhausted"
      : "dead-letter queue";
  const text = [
    `Job name: ${detail.jobName}`,
    `Job ID: ${detail.jobId}`,
    `Customer ID: ${detail.customerId}`,
    `Failure source: ${sourceLabel}`,
    "",
    `Reason: ${detail.reason}`,
  ].join("\n");

  try {
    console.info(
      `[email] sending job failure alert jobId=${detail.jobId} from=${from} to=${to}`,
    );
    const result = await binding.send({ from, to, subject, text });
    const rid =
      result &&
      typeof result === "object" &&
      "messageId" in result &&
      typeof (result as { messageId: unknown }).messageId === "string"
        ? (result as { messageId: string }).messageId
        : undefined;
    console.info(
      `[email] job failure alert send finished jobId=${detail.jobId}${rid ? ` messageId=${rid}` : ""}`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(
      `[email] job failure alert failed jobId=${detail.jobId}: ${msg}${stack ? `\n${stack}` : ""}`,
    );
    if (/not verified|verified destination|destination address/i.test(msg)) {
      console.info(
        "[email] hint: Send Email requires TO to be a verified destination in Email Routing (your real mailbox), not a custom @yourzone address used only as a route alias. Use that verified address for JOB_FAILURE_ALERT_TO and matching destination_address.",
      );
    }
  }
}
