const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, json, prettyPrint } = format;
const fs = require("fs");
const path = require("path");

module.exports = (prefix) => {
  const formatConf = combine(
    label({ label: prefix }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    json(),
    prettyPrint()
  );

  // /var/task = Lambda/deployment — file system read only hai
  // Sirf local machine par file transport use karo
  const canWriteFiles = (() => {
    try {
      const logDir = path.join(process.cwd(), "src/logs");
      fs.mkdirSync(logDir, { recursive: true });
      return logDir;
    } catch (e) {
      return null;  // write nahi ho sakta — console use karo
    }
  })();

  const createTransport = (level, filename) => {
    if (!canWriteFiles) {
      return new transports.Console({ level });
    }
    return new transports.File({
      level,
      filename: path.join(canWriteFiles, filename),
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