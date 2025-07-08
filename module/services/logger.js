class LOGGER {
  static LOG_LEVELS = {
    DEBUG: "DEBUG",
    INFO: "INFO",
    WARN: "WARN",
    ERROR: "ERROR",
    NONE: "NONE",
  };

  static COLORS = {
    DEBUG: "\x1b[36m",
    INFO: "\x1b[32m",
    WARN: "\x1b[33m",
    ERROR: "\x1b[31m",
    RESET: "\x1b[0m",
  };

  constructor(config = { logLevel: LOGGER.LOG_LEVELS.INFO }) {
    this.config = {
      logLevel: LOGGER.LOG_LEVELS.INFO,
      ...config,
    };
  }

  setConfig(config) {
    if (
      config?.logLevel &&
      Object.values(LOGGER.LOG_LEVELS).includes(config.logLevel)
    ) {
      this.config.logLevel = config.logLevel;
    } else {
      console.warn("[WARN] Invalid logLevel passed to setConfig().");
    }
  }

  log(level, message) {
    const levels = Object.keys(LOGGER.LOG_LEVELS);
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    if (
      this.config.logLevel !== LOGGER.LOG_LEVELS.NONE &&
      messageLevelIndex >= currentLevelIndex
    ) {
      const color = LOGGER.COLORS[level] || "";
      const reset = LOGGER.COLORS.RESET;
      console.log(`${color}[${level}]${reset} ${message}`);
    }
  }
}

module.exports = LOGGER;
