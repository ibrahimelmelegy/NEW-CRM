import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  ...(isProduction
    ? {
        // JSON output for production (parseable by log aggregators)
        formatters: {
          level: (label: string) => ({ level: label })
        },
        timestamp: pino.stdTimeFunctions.isoTime
      }
    : {
        // Pretty output for development
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname'
          }
        }
      })
});

export default logger;
