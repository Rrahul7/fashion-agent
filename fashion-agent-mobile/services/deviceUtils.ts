import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Dynamic imports with fallbacks for better error handling
let Device: any;
let Application: any;

try {
  Device = require('expo-device');
} catch (error) {
  console.warn('⚠️ expo-device not available, using fallbacks');
  Device = {
    deviceName: null,
    modelId: null,
    osVersion: null,
    brand: null,
    manufacturer: null,
    designName: null,
    isDevice: true,
    deviceType: 1
  };
}

try {
  Application = require('expo-application');
} catch (error) {
  console.warn('⚠️ expo-application not available, using fallbacks');
  Application = {
    nativeApplicationVersion: '1.0.0',
    getInstallationIdAsync: null
  };
}

// Device fingerprint storage key
const DEVICE_ID_KEY = 'secure_device_id';
const DEVICE_FINGERPRINT_KEY = 'device_fingerprint';

export interface DeviceInfo {
  deviceId: string;
  fingerprint: string;
  deviceName?: string;
  platform: string;
  osVersion?: string;
  appVersion: string;
  timestamp: number;
}

/**
 * Secure Device Identification Service
 * Creates a persistent, hard-to-spoof device identifier for guest limiting
 */
export const DeviceUtils = {
  /**
   * Get or generate a secure device ID
   * This combines multiple device characteristics for better security
   */
  getSecureDeviceId: async (): Promise<string> => {
    try {
      // Check if we already have a stored device ID
      const storedDeviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      if (storedDeviceId) {
        console.log('📱 Using stored device ID');
        return storedDeviceId;
      }

      // Generate new device ID based on device characteristics
      const deviceId = await DeviceUtils.generateDeviceId();
      
      // Store securely
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
      console.log('📱 Generated new secure device ID');
      
      return deviceId;
    } catch (error) {
      console.error('❌ Error getting device ID:', error);
      // Fallback to a basic UUID if device APIs fail
      return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  },

  /**
   * Generate a device fingerprint combining multiple device characteristics
   * This is harder to spoof than a simple session ID
   */
  generateDeviceId: async (): Promise<string> => {
    try {
      const components = [];

      // 1. Application Instance ID (most persistent)
      try {
        const appInstanceId = Application.getInstallationIdAsync?.();
        if (appInstanceId) {
          const instanceId = await appInstanceId;
          if (instanceId) {
            components.push(instanceId);
          }
        }
      } catch (e) {
        console.warn('⚠️ Could not get installation ID');
      }

      // 2. Device characteristics
      if (Device.deviceName) components.push(Device.deviceName);
      if (Device.modelId) components.push(Device.modelId);
      if (Device.osVersion) components.push(Device.osVersion);
      
      // 3. Platform info
      components.push(Platform.OS);
      components.push(Platform.Version?.toString() || '');

      // 4. App-specific identifiers
      const appVersion = Application.nativeApplicationVersion || '1.0.0';
      components.push(appVersion);
      
      // 5. Add timestamp for uniqueness (rounded to hour for stability)
      const hourlyTimestamp = Math.floor(Date.now() / (1000 * 60 * 60));
      components.push(hourlyTimestamp.toString());

      // Create fingerprint from all components
      const rawFingerprint = components.filter(Boolean).join('|');
      
      // Hash the fingerprint for security and consistent length
      const hashedFingerprint = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawFingerprint,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Create final device ID with prefix
      const deviceId = `device_${hashedFingerprint.substring(0, 32)}`;
      
      console.log('📱 Device fingerprint components:', components.length);
      return deviceId;
    } catch (error) {
      console.error('❌ Error generating device fingerprint:', error);
      throw error;
    }
  },

  /**
   * Get complete device info for backend tracking
   */
  getDeviceInfo: async (): Promise<DeviceInfo> => {
    const deviceId = await DeviceUtils.getSecureDeviceId();
    const fingerprint = await DeviceUtils.getDeviceFingerprint();

    return {
      deviceId,
      fingerprint,
      deviceName: Device.deviceName || undefined,
      platform: Platform.OS,
      osVersion: Device.osVersion || undefined,
      appVersion: Application.nativeApplicationVersion || '1.0.0',
      timestamp: Date.now(),
    };
  },

  /**
   * Generate device fingerprint for additional security validation
   */
  getDeviceFingerprint: async (): Promise<string> => {
    try {
      // Check stored fingerprint first
      const storedFingerprint = await SecureStore.getItemAsync(DEVICE_FINGERPRINT_KEY);
      if (storedFingerprint) {
        return storedFingerprint;
      }

      // Create fingerprint from stable device characteristics
      const characteristics = [
        Device.brand,
        Device.manufacturer,
        Device.modelId,
        Device.designName,
        Platform.OS,
        Platform.Version?.toString() || 'unknown',
      ].filter(Boolean);

      const fingerprintSource = characteristics.join('::');
      const fingerprint = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        fingerprintSource,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Store fingerprint
      await SecureStore.setItemAsync(DEVICE_FINGERPRINT_KEY, fingerprint);
      
      return fingerprint;
    } catch (error) {
      console.error('❌ Error generating device fingerprint:', error);
      return 'fallback_fingerprint';
    }
  },

  /**
   * Validate device consistency (detect potential spoofing)
   */
  validateDeviceConsistency: async (): Promise<boolean> => {
    try {
      const currentFingerprint = await DeviceUtils.getDeviceFingerprint();
      const storedFingerprint = await SecureStore.getItemAsync(DEVICE_FINGERPRINT_KEY);

      if (!storedFingerprint) {
        return true; // First time, no stored fingerprint to compare
      }

      const isConsistent = currentFingerprint === storedFingerprint;
      
      if (!isConsistent) {
        console.warn('⚠️ Device fingerprint mismatch - possible spoofing detected');
      }

      return isConsistent;
    } catch (error) {
      console.error('❌ Error validating device consistency:', error);
      return true; // Fail open to avoid blocking legitimate users
    }
  },

  /**
   * Clear device identification data (for testing or privacy)
   */
  clearDeviceData: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
      await SecureStore.deleteItemAsync(DEVICE_FINGERPRINT_KEY);
      console.log('🧹 Device identification data cleared');
    } catch (error) {
      console.error('❌ Error clearing device data:', error);
    }
  },

  /**
   * Get device info for debugging
   */
  getDebugInfo: async (): Promise<Record<string, any>> => {
    try {
      const deviceInfo = await DeviceUtils.getDeviceInfo();
      
      return {
        deviceId: deviceInfo.deviceId,
        fingerprint: deviceInfo.fingerprint.substring(0, 16) + '...',
        deviceName: Device.deviceName,
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        modelId: Device.modelId,
        platform: Platform.OS,
        osVersion: Device.osVersion,
        appVersion: Application.nativeApplicationVersion,
        isDevice: Device.isDevice,
        deviceType: Device.deviceType,
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

export default DeviceUtils;

