
function LOGGER({ logLevel = 'INFO' } = {}) {
  const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4 };
  const COLORS = {
    DEBUG: '\x1b[36m',
    INFO:  '\x1b[32m',
    WARN:  '\x1b[33m',
    ERROR: '\x1b[31m',
    RESET: '\x1b[0m',
  };

  let currentLevel = LEVELS[logLevel] ?? LEVELS.INFO;


  function log(levelName, message, { timestamp = true } = {}) {
    const levelNum = LEVELS[levelName];
    if (levelNum === undefined) {
      console.warn('[WARN] Level invalido passado para a funçao!');
      return;
    }
    if (currentLevel === LEVELS.NONE || levelNum < currentLevel) return;

    const color = COLORS[levelName] ?? '';
    const reset = COLORS.RESET;
    const prefix = timestamp ? `${new Date().toISOString()} ` : '';

    console.log(`${color}[${levelName}]${reset} ${prefix}${message}`);
  }

  return {
    LEVELS: Object.keys(LEVELS),
    setConfig({ logLevel } = {}) {
      if (logLevel in LEVELS) currentLevel = LEVELS[logLevel];
      else console.warn('[WARN] LOGLEVEL INVALIDO PASSADO COMO PARAMETRO.');
    },
    debug: (msg, opt) => log('DEBUG', msg, opt),
    info:  (msg, opt) => log('INFO',  msg, opt),
    warn:  (msg, opt) => log('WARN',  msg, opt),
    error: (msg, opt) => log('ERROR', msg, opt),
    log,                                      
  };
}

module.exports = LOGGER;
