import { Notification } from "@workspace/db";
import { logger } from "./logger.js";

interface CreateNotificationOpts {
  recipientId: string;
  type: string;
  message: string;
  link?: string | null;
}

export async function createNotification(opts: CreateNotificationOpts): Promise<void> {
  try {
    await Notification.create({
      recipientId: opts.recipientId,
      type: opts.type,
      message: opts.message,
      link: opts.link ?? null,
      read: false,
    });
  } catch (err) {
    logger.warn({ err }, "Failed to create notification — non-fatal");
  }
}

export async function createNotifications(
  recipients: string[],
  opts: Omit<CreateNotificationOpts, "recipientId">,
): Promise<void> {
  if (recipients.length === 0) return;
  try {
    await Notification.insertMany(
      recipients.map((recipientId) => ({
        recipientId,
        type: opts.type,
        message: opts.message,
        link: opts.link ?? null,
        read: false,
      })),
    );
  } catch (err) {
    logger.warn({ err }, "Failed to create bulk notifications — non-fatal");
  }
}
