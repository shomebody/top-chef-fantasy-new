// src/utils/debugUtils.ts
const isDebug = import.meta.env.MODE !== 'production' || import.meta.env.VITE_DEBUG === 'true';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogOptions {
  prefix?: string;
  data?: any;
  trace?: boolean;
}

/**
 * Enhanced logging utility that only logs in development mode
 */
export const logger = {
  debug: (message: string, options: LogOptions = {}) => {
    logWithLevel('debug', message, options);
  },
  
  info: (message: string, options: LogOptions = {}) => {
    logWithLevel('info', message, options);
  },
  
  warn: (message: string, options: LogOptions = {}) => {
    logWithLevel('warn', message, options);
  },
  
  error: (message: string, options: LogOptions = {}) => {
    logWithLevel('error', message, options);
  },
  
  group: (name: string, fn: () => void) => {
    if (!isDebug) return;
    console.group(name);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  },
  
  time: <T>(label: string, fn: () => T): T => {
    if (!isDebug) return fn();
    console.time(label);
    try {
      return fn();
    } finally {
      console.timeEnd(label);
    }
  }
};

function logWithLevel(level: LogLevel, message: string, options: LogOptions = {}) {
  if (!isDebug) return;
  
  const { prefix, data, trace } = options;
  const formattedMessage = prefix ? `[${prefix}] ${message}` : message;
  
  switch (level) {
    case 'debug':
      console.debug(formattedMessage);
      break;
    case 'info':
      console.info(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    case 'error':
      console.error(formattedMessage);
      break;
  }
  
  if (data) {
    console.log('Data:', data);
  }
  
  if (trace) {
    console.trace();
  }
}

/**
 * Performance measurement utility
 */
export class PerformanceMonitor {
  private timers: Map<string, number> = new Map();
  
  start(label: string): void {
    if (!isDebug) return;
    this.timers.set(label, performance.now());
  }
  
  end(label: string): number | null {
    if (!isDebug) return null;
    const startTime = this.timers.get(label);
    if (startTime === undefined) {
      console.warn(`Timer '${label}' does not exist`);
      return null;
    }
    
    const duration = performance.now() - startTime;
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    this.timers.delete(label);
    return duration;
  }
  
  clear(): void {
    this.timers.clear();
  }
}

// Create a singleton instance
export const perfMonitor = new PerformanceMonitor();

export default {
  logger,
  perfMonitor,
  isDebug
};