const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, json, prettyPrint } = format;

module.exports = (prefix) => {
  const formatConf = combine(
    label({ label: prefix }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    json(),
    prettyPrint()
  );

  const isProduction = process.env.NODE_ENV === "production";

  const createTransport = (level, filename) => {
    if (isProduction) {
      return new transports.Console({ level });  // ✅ file nahi, console only
    }

    // Local — directory pehle banao
    const fs = require("fs");
    const logDir = "src/logs";
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });  // ✅ auto create
    }

    return new transports.File({
      level,
      filename: `${logDir}/${filename}`,
    });
  };

  const infoLogger = createLogger({
    transports: [createTransport("info", "info.log")],
    format: formatConf,
  });
  const errLogger = createLogger({
    transports: [createTransport("error", "error.log")],
    format: formatConf,
  });
  const warnLogger = createLogger({
    transports: [createTransport("warn", "warn.log")],
    format: formatConf,
  });
  const queueLogger = createLogger({
    transports: [createTransport("info", "queue.log")],
    format: formatConf,
  });

  return {
    info: (msg) => infoLogger.info(msg),
    error: (msg) => {
      console.log({ error: msg });
      errLogger.error(msg);
    },
    warn: (msg) => warnLogger.warn(msg),
    queue: (msg) => queueLogger.info(msg),
    printRequest(req, res, next) {
      const { method, originalUrl, body } = req;
      let msg = `${method} ${originalUrl}`;
      if (body && Object.keys(body).length) {
        const cleanBody = { ...body };
        if (cleanBody.image) cleanBody.image = 1;
        if (cleanBody.images) cleanBody.images = cleanBody.images.length;
        msg += ` | body: ${JSON.stringify(cleanBody)}`;
      }
      infoLogger.info(msg);
      next();
    },
  };
};