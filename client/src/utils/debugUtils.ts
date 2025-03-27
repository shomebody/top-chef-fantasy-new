// src/utils/debugUtils.ts
const isDebug = import.meta.env.MODE !== 'production' || import.meta.env.VITE_DEBUG === 'true';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
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

/**
 * React component rendering counter HOC
 * Usage: const CountedComponent = withRenderCount(YourComponent);
 */
export const withRenderCount = <P extends object>(
  Component: React.ComponentType<P>,
  componentName = Component.displayName || Component.name
): React.FC<P> => {
  if (!isDebug) return Component as React.FC<P>;
  
  const WrappedComponent: React.FC<P> = (props) => {
    const renderCountRef = React.useRef(0);
    renderCountRef.current += 1;
    
    const count = renderCountRef.current;
    console.log(`🔄 ${componentName} rendered (${count} times)`);
    
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `WithRenderCount(${componentName})`;
  return WrappedComponent;
};

/**
 * Debug component prop changes
 * Usage: usePropChanges(props, 'ComponentName');
 */
export function usePropChanges<T extends object>(props: T, componentName: string): void {
  const prevPropsRef = React.useRef<T | null>(null);
  
  React.useEffect(() => {
    if (!isDebug) return;
    
    if (prevPropsRef.current) {
      const prevProps = prevPropsRef.current;
      const changedProps: Record<string, { old: any; new: any }> = {};
      
      Object.keys(props).forEach((key) => {
        if (props[key as keyof T] !== prevProps[key as keyof T]) {
          changedProps[key] = {
            old: prevProps[key as keyof T],
            new: props[key as keyof T]
          };
        }
      });
      
      if (Object.keys(changedProps).length > 0) {
        console.log(`🔄 ${componentName} props changed:`, changedProps);
      }
    }
    
    prevPropsRef.current = { ...props };
  });
}

export default {
  logger,
  perfMonitor,
  withRenderCount,
  usePropChanges
};