import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';

export class CacheService {
  private static instance: CacheService;
  private redis: Redis;
  private isConnected: boolean = false;

  private constructor() {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public getClient(): Redis {
    return this.redis;
  }

  public isReady(): boolean {
    return this.isConnected && this.redis.status === 'ready';
  }

  public async set(
    key: string,
    value: any,
    ttlSeconds?: number
  ): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const ttl = ttlSeconds || config.redis.ttlDefault;

      if (ttl > 0) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      logger.error({ msg: 'Cache set error', err: error, key });
      throw error;
    }
  }

  public async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error({ msg: 'Cache get error', err: error, key });
      return null;
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error({ msg: 'Cache delete error', err: error, key });
      throw error;
    }
  }

  public async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await this.redis.del(...keys);
    } catch (error) {
      logger.error({ msg: 'Cache delete pattern error', err: error, pattern });
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error({ msg: 'Cache exists error', err: error, key });
      return false;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error({ msg: 'Cache TTL error', err: error, key });
      return -1;
    }
  }

  public async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, by);
    } catch (error) {
      logger.error({ msg: 'Cache increment error', err: error, key });
      throw error;
    }
  }

  public async setWithLock(
    lockKey: string,
    dataKey: string,
    value: any,
    ttlSeconds?: number,
    lockTimeoutMs: number = 5000
  ): Promise<boolean> {
    const lockId = Date.now().toString();
    
    try {
      const acquired = await this.redis.set(
        `lock:${lockKey}`,
        lockId,
        'PX',
        lockTimeoutMs,
        'NX'
      );

      if (!acquired) {
        return false;
      }

      await this.set(dataKey, value, ttlSeconds);
      await this.redis.del(`lock:${lockKey}`);
      return true;
    } catch (error) {
      await this.redis.del(`lock:${lockKey}`);
      logger.error({ msg: 'Cache set with lock error', err: error, lockKey, dataKey });
      throw error;
    }
  }

  public async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) {
        return [];
      }

      const values = await this.redis.mget(...keys);
      return values.map(value => {
        if (value === null) {
          return null;
        }
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      logger.error({ msg: 'Cache mget error', err: error, keys });
      return keys.map(() => null);
    }
  }

  public async mset(keyValuePairs: Record<string, any>, ttlSeconds?: number): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      const ttl = ttlSeconds || config.redis.ttlDefault;

      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serializedValue = JSON.stringify(value);
        if (ttl > 0) {
          pipeline.setex(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      }

      await pipeline.exec();
    } catch (error) {
      logger.error({ msg: 'Cache mset error', err: error });
      throw error;
    }
  }

  public async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
      logger.info('Cache flushed successfully');
    } catch (error) {
      logger.error({ msg: 'Cache flush error', err: error });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      this.isConnected = false;
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error({ msg: 'Redis disconnect error', err: error });
    }
  }

  public async healthCheck(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy'
      };
    }
  }
}

export const cacheService = CacheService.getInstance();