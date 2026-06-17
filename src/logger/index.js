const { createLogger, format, transports } = require("winston");

require("dotenv").config();

module.exports = (prefix) => {
  const formatConf = format.combine(
    format.label({ label: prefix }),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.json(),
    format.prettyPrint()
  );

  const isProduction = process.env.NODE_ENV === "production";

  const getTransport = (level, fileName) => {
    if (isProduction) {
      return new transports.Console({
        level,
      });
    }

    return new transports.File({
      level,
      filename: `src/logs/${fileName}`,
    });
  };

  const infoLogger = createLogger({
    transports: [
      getTransport("info", process.env.INFO_LOG_FILE),
    ],
    format: formatConf,
  });

  const errLogger = createLogger({
    transports: [
      getTransport("error", process.env.ERROR_LOG_FILE),
    ],
    format: formatConf,
  });

  const warnLogger = createLogger({
    transports: [
      getTransport("warn", process.env.WARN_LOG_FILE),
    ],
    format: formatConf,
  });

  const queueLogger = createLogger({
    transports: [
      getTransport("info", process.env.QUEUE_LOG_FILE),
    ],
    format: formatConf,
  });

  return {
    info: (msg) => infoLogger.info(msg),
    error: (msg) => errLogger.error(msg),
    warn: (msg) => warnLogger.warn(msg),
    queue: (msg) => queueLogger.info(msg),

    printRequest(req, res, next) {
      const { method, originalUrl, body } = req;

      let msg = `${method} ${originalUrl}`;

      if (Object.keys(body || {}).length) {
        const bodyToPrint = { ...body };

        if (bodyToPrint.image) bodyToPrint.image = 1;
        if (bodyToPrint.images)
          bodyToPrint.images = bodyToPrint.images.length;

        msg += ` | body: ${JSON.stringify(bodyToPrint)}`;
      }

      infoLogger.info(msg);
      next();
    },
  };
};