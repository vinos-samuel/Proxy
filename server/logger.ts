const isDev = process.env.NODE_ENV !== "production";

interface LogMeta {
  [key: string]: any;
}

function formatLog(level: string, message: string, meta: LogMeta = {}): string {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  });
}

export const logger = {
  info(message: string, meta?: LogMeta): void {
    console.log(formatLog("info", message, meta));
  },

  warn(message: string, meta?: LogMeta): void {
    console.warn(formatLog("warn", message, meta));
  },

  error(message: string, meta?: LogMeta): void {
    console.error(formatLog("error", message, meta));
  },

  debug(message: string, meta?: LogMeta): void {
    if (isDev) {
      console.debug(formatLog("debug", message, meta));
    }
  },
};
