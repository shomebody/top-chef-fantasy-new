// src/utils/debugUtilsReact.tsx
import React, { useEffect, useRef } from 'react';
import { isDebug } from './debugUtils';

/**
 * React component rendering counter HOC
 * Usage: const CountedComponent = withRenderCount(YourComponent);
 */
export function withRenderCount<P extends object>(
  Component: React.ComponentType<P>,
  componentName = Component.displayName || Component.name
): React.FC<P> {
  if (!isDebug) return Component as React.FC<P>;
  
  const WrappedComponent: React.FC<P> = (props) => {
    const renderCountRef = useRef(0);
    renderCountRef.current += 1;
    
    const count = renderCountRef.current;
    console.log(`🔄 ${componentName} rendered (${count} times)`);
    
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `WithRenderCount(${componentName})`;
  return WrappedComponent;
}

/**
 * Debug component prop changes
 * Usage: usePropChanges(props, 'ComponentName');
 */
export function usePropChanges<T extends object>(props: T, componentName: string): void {
  const prevPropsRef = useRef<T | null>(null);
  
  useEffect(() => {
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
  withRenderCount,
  usePropChanges
};