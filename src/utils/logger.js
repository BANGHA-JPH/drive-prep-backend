const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (process.env.NODE_ENV === 'production') return;
    
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] ${level}: ${message} ${metaString}`;
  }

  writeToFile(level, message, meta = {}) {
    if (process.env.NODE_ENV === 'production') return;

    const logFile = path.join(this.logDir, `${level.toLowerCase()}.log`);
    const formattedMessage = this.formatMessage(level, message, meta);
    
    fs.appendFile(logFile, formattedMessage + '\n', (err) => {
      if (err) {
        console.error('Error writing to log file:', err);
      }
    });
  }

  error(message, meta = {}) {
    const formattedMessage = this.formatMessage('ERROR', message, meta);
    // console.error(`❌ ${formattedMessage}`);
    this.writeToFile('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    const formattedMessage = this.formatMessage('WARN', message, meta);
    // console.warn(`⚠️ ${formattedMessage}`);
    this.writeToFile('WARN', message, meta);
  }

  info(message, meta = {}) {
    const formattedMessage = this.formatMessage('INFO', message, meta);
    // console.log(`ℹ️ ${formattedMessage}`);
    this.writeToFile('INFO', message, meta);
  }

  debug(message, meta = {}) {
    const formattedMessage = this.formatMessage('DEBUG', message, meta);
    // console.log(`🔍 ${formattedMessage}`);
    this.writeToFile('DEBUG', message, meta);
  }

  // Log database operations
  logDatabase(operation, table, data = {}) {
    this.info(`Database ${operation}`, { table, ...data });
  }

  // Log API requests
  logRequest(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      if (res.statusCode >= 400) {
        this.error('HTTP Request Failed', logData);
      } else {
        this.info('HTTP Request', logData);
      }
    });

    next();
  }

  // Log authentication events
  logAuth(event, userId, email, meta = {}) {
    this.info(`Auth: ${event}`, { userId, email, ...meta });
  }
}

module.exports = new Logger();
