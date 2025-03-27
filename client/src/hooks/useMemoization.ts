// src/hooks/useMemoization.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { perfMonitor } from '../utils/debugUtils';

/**
 * Hook to memoize expensive calculations with debugging
 * @param calculationFn - Function to memoize
 * @param dependencies - Dependencies array
 * @param debugLabel - Label for performance monitoring
 */
export function useMemoizedCalculation<T>(
  calculationFn: () => T,
  dependencies: React.DependencyList,
  debugLabel?: string
): T {
  return useMemo(() => {
    if (debugLabel) {
      perfMonitor.start(debugLabel);
      const result = calculationFn();
      perfMonitor.end(debugLabel);
      return result;
    }
    return calculationFn();
  }, dependencies);
}

/**
 * Custom useMemo hook with deep comparison
 * @param value - Value to memoize
 * @param equalityFn - Function to compare values
 */
export function useDeepMemo<T>(value: T, equalityFn?: (prev: T, next: T) => boolean): T {
  const ref = useRef<T>(value);
  
  // Default equality function does a basic deep comparison
  const areEqual = equalityFn || ((a: T, b: T) => {
    if (a === b) return true;
    
    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, i) => val === b[i]);
    }
    
    // Handle objects
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      return keysA.every(key => {
        const valA = a[key as keyof T];
        const valB = b[key as keyof T];
        return valA === valB;
      });
    }
    
    return false;
  });
  
  if (!areEqual(ref.current, value)) {
    ref.current = value;
  }
  
  return ref.current;
}

/**
 * Hook to debounce state changes
 * @param value - Value to debounce
 * @param delay - Debounce delay in ms
 */
export function useDebouncedState<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Hook to debounce a callback function
 * @param callback - Function to debounce
 * @param delay - Debounce delay in ms
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  
  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback((...args: Parameters<T>) => {
    const timeoutId = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [delay]);
}

/**
 * Hook to throttle a callback function
 * @param callback - Function to throttle
 * @param delay - Throttle delay in ms
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const lastCallTimeRef = useRef(0);
  
  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeElapsed = now - lastCallTimeRef.current;
    
    if (timeElapsed >= delay) {
      lastCallTimeRef.current = now;
      callbackRef.current(...args);
    }
  }, [delay]);
}

export default {
  useMemoizedCalculation,
  useDeepMemo,
  useDebouncedState,
  useDebouncedCallback,
  useThrottledCallback
};