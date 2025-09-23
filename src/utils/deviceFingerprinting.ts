// src/utils/deviceFingerprinting.ts
import { safeStorageGet, safeStorageSet } from '@/utils/auth/safeStorage';

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  lastActive: string;
  isCurrentDevice: boolean;
  userAgent: string;
}

const DEVICE_ID_KEY = 'device_fingerprint_id';

/**
 * Generate unique device fingerprint
 */
export const generateDeviceFingerprint = async (): Promise<string> => {
  // Check if we already have a device ID
  const existingId = safeStorageGet(DEVICE_ID_KEY);
  if (existingId) {
    return existingId;
  }

  // Generate new fingerprint
  const fingerprint = await createFingerprint();
  safeStorageSet(DEVICE_ID_KEY, fingerprint);
  return fingerprint;
};

/**
 * Create device fingerprint from browser characteristics
 */
const createFingerprint = async (): Promise<string> => {
  const components = [];

  // User agent
  components.push(navigator.userAgent);

  // Screen resolution
  components.push(`${screen.width}x${screen.height}`);

  // Color depth
  components.push(screen.colorDepth.toString());

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // Hardware concurrency (CPU cores)
  if (navigator.hardwareConcurrency) {
    components.push(navigator.hardwareConcurrency.toString());
  }

  // Device memory
  if ('deviceMemory' in navigator) {
    components.push((navigator as any).deviceMemory.toString());
  }

  // Canvas fingerprint (subtle)
  const canvasFingerprint = await getCanvasFingerprint();
  components.push(canvasFingerprint);

  // WebGL fingerprint (subtle)
  const webglFingerprint = getWebGLFingerprint();
  components.push(webglFingerprint);

  // Create hash from components
  const fingerprintString = components.join('|');
  return await hashString(fingerprintString);
};

/**
 * Get canvas fingerprint
 */
const getCanvasFingerprint = (): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('no-canvas');
        return;
      }

      // Draw some text with specific font and color
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Hello, world!', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Hello, world!', 4, 17);

      resolve(canvas.toDataURL());
    } catch (error) {
      resolve('canvas-error');
    }
  });
};

/**
 * Get WebGL fingerprint
 */
const getWebGLFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';

    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

    return `${vendor}|${renderer}`;
  } catch (error) {
    return 'webgl-error';
  }
};

/**
 * Simple hash function for fingerprint
 */
const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
};

/**
 * Get device type from user agent
 */
export const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
  const ua = navigator.userAgent;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }

  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
};

/**
 * Get browser name from user agent
 */
export const getBrowserName = (): string => {
  const ua = navigator.userAgent;

  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';

  return 'Unknown';
};

/**
 * Get OS name from user agent
 */
export const getOSName = (): string => {
  const ua = navigator.userAgent;

  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS X') || ua.includes('Macintosh')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) return 'iOS';

  return 'Unknown';
};

/**
 * Get complete device information
 */
export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  const deviceId = await generateDeviceFingerprint();

  return {
    id: deviceId,
    name: `${getDeviceType()} - ${getBrowserName()}`,
    type: getDeviceType(),
    browser: getBrowserName(),
    os: getOSName(),
    lastActive: new Date().toISOString(),
    isCurrentDevice: true,
    userAgent: navigator.userAgent
  };
};

/**
 * Generate human-readable device name
 */
export const generateDeviceName = (deviceInfo: DeviceInfo): string => {
  const typeEmoji = {
    desktop: '🖥️',
    mobile: '📱',
    tablet: '📱'
  };

  return `${typeEmoji[deviceInfo.type]} ${deviceInfo.browser} di ${deviceInfo.os}`;
};
