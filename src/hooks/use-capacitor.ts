import { useEffect, useState } from 'react';

/**
 * A hook that returns whether the app is running in a native platform (iOS/Android)
 * via Capacitor, or in a web browser.
 * 
 * @returns {boolean} True if running on a native platform, false if in browser
 */
export function useIsNativePlatform(): boolean {
  const [isNative, setIsNative] = useState<boolean>(false);
  
  useEffect(() => {
    const checkPlatform = async () => {
      try {
        // Dynamically import Capacitor to avoid issues in web environments
        const { Capacitor } = await import('@capacitor/core');
        setIsNative(Capacitor.isNativePlatform());
      } catch (error) {
        console.log('Running in browser environment');
        setIsNative(false);
      }
    };
    
    checkPlatform();
  }, []);
  
  return isNative;
}

/**
 * A hook that returns the current platform the app is running on
 * 
 * @returns {string} 'ios', 'android', or 'web'
 */
export function usePlatform(): 'ios' | 'android' | 'web' {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');
  
  useEffect(() => {
    const checkPlatform = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          setPlatform(Capacitor.getPlatform() as 'ios' | 'android');
        } else {
          setPlatform('web');
        }
      } catch (error) {
        console.log('Running in browser environment');
        setPlatform('web');
      }
    };
    
    checkPlatform();
  }, []);
  
  return platform;
}

/**
 * A hook that determines whether the app is running on iOS
 * 
 * @returns {boolean} True if running on iOS, false otherwise
 */
export function useIsIOS(): boolean {
  const platform = usePlatform();
  return platform === 'ios';
}

/**
 * A hook that determines whether the app is running on Android
 * 
 * @returns {boolean} True if running on Android, false otherwise
 */
export function useIsAndroid(): boolean {
  const platform = usePlatform();
  return platform === 'android';
}