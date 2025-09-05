import pino from 'pino';
import { config } from '@/config';

const baseOptions: pino.LoggerOptions = {
  level: config.log.level as pino.LevelWithSilent,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  serializers: {
    req: (req) => ({
      method: (req as any).method,
      url: (req as any).url,
      headers: {
        host: (req as any).headers?.host,
        'user-agent': (req as any).headers?.['user-agent'],
        'content-type': (req as any).headers?.['content-type'],
      },
    }),
    res: (res) => ({
      statusCode: (res as any).statusCode,
      headers: (res as any).getHeaders?.(),
    }),
    err: pino.stdSerializers.err,
  },
} as const;

const devTransport = config.NODE_ENV === 'development'
  ? {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      },
    }
  : {};

// Build options in a way compatible with exactOptionalPropertyTypes
const logger = pino({
  ...baseOptions,
  ...(devTransport as any),
});

export default logger as any;
