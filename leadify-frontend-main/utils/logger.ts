const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  log: (...args: unknown[]) => isDev && console.log(...args),
  error: (...args: unknown[]) => console.error(...args), // always log errors
  warn: (...args: unknown[]) => isDev && console.warn(...args),
  info: (...args: unknown[]) => isDev && console.info(...args),
  debug: (...args: unknown[]) => isDev && console.debug(...args),
};

export default logger;
