// src/utils/deviceFingerprint.ts
// Enhanced device fingerprinting utilities for accurate device identification

import { logger } from './logger';

export interface DeviceFingerprint {
  id: string;
  stability: 'high' | 'medium' | 'low';
  components: {
    userAgent: string;
    screen: string;
    language: string;
    timezone: number;
    platform: string;
    canvas: string;
    webgl: string;
    audio: string;
    storage: boolean;
    cookies: boolean;
  };
  confidence: number;
}

/**
 * Generate comprehensive device fingerprint for accurate identification
 */
export const generateDeviceFingerprint = (): DeviceFingerprint => {
  const components = {
    userAgent: navigator.userAgent || '',
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    language: navigator.language || navigator.languages?.[0] || 'en',
    timezone: new Date().getTimezoneOffset(),
    platform: navigator.platform || '',
    canvas: '',
    webgl: '',
    audio: '',
    storage: false,
    cookies: false
  };

  // Enhanced canvas fingerprinting
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      
      // Text rendering test
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.font = '11pt Arial';
      ctx.fillText('BISMILLAH Device ID 🔐', 2, 15);
      
      // Geometric shapes test
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.font = '18pt Arial';
      ctx.fillText('🖥️📱', 4, 30);
      
      components.canvas = canvas.toDataURL().substring(0, 100); // Truncate for storage
    }
  } catch (e) {
    logger.warn('Canvas fingerprinting failed:', e);
  }

  // WebGL fingerprinting
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    if (gl && 'getExtension' in gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
        components.webgl = `${vendor}|${renderer}`.substring(0, 100);
      }
    }
  } catch (e) {
    logger.warn('WebGL fingerprinting failed:', e);
  }

  // Audio fingerprinting
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    oscillator.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(0);
    
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);
    
    components.audio = Array.from(frequencyData.slice(0, 10)).join(',');
    
    oscillator.stop();
    audioContext.close();
  } catch (e) {
    logger.warn('Audio fingerprinting failed:', e);
  }

  // Storage availability test
  try {
    localStorage.setItem('__test__', 'test');
    localStorage.removeItem('__test__');
    components.storage = true;
  } catch (e) {
    components.storage = false;
  }

  // Cookie availability test
  components.cookies = navigator.cookieEnabled;

  // Generate stable hash from components
  const fingerprint = Object.values(components).join('|');
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Calculate stability and confidence
  let stability: 'high' | 'medium' | 'low' = 'low';
  let confidence = 0;

  if (components.canvas && components.webgl) {
    stability = 'high';
    confidence = 95;
  } else if (components.canvas || components.webgl) {
    stability = 'medium';
    confidence = 75;
  } else {
    confidence = 50;
  }

  // Adjust confidence based on available features
  if (components.storage) confidence += 5;
  if (components.cookies) confidence += 5;
  if (components.audio) confidence += 10;

  const id = `fp_${Math.abs(hash).toString(16)}_${Date.now()}`;

  return {
    id,
    stability,
    components,
    confidence: Math.min(confidence, 100)
  };
};

/**
 * Validate device fingerprint consistency
 */
export const validateFingerprint = (stored: string, current: DeviceFingerprint): boolean => {
  try {
    const storedData = JSON.parse(stored);
    
    // Check key components for consistency
    const keyMatches = 
      storedData.components.userAgent === current.components.userAgent &&
      storedData.components.screen === current.components.screen &&
      storedData.components.timezone === current.components.timezone;
    
    // Allow some variation in canvas/webgl due to browser updates
    const canvasMatch = !storedData.components.canvas || 
      storedData.components.canvas === current.components.canvas;
    
    return keyMatches && canvasMatch;
  } catch (e) {
    logger.warn('Fingerprint validation failed:', e);
    return false;
  }
};

/**
 * Get device type from fingerprint
 */
export const getDeviceTypeFromFingerprint = (fingerprint: DeviceFingerprint): string => {
  const { userAgent, screen } = fingerprint.components;
  const screenWidth = parseInt(screen.split('x')[0]);
  
  if (/mobile|android|iphone|ipod/i.test(userAgent)) {
    return 'mobile';
  } else if (/ipad/i.test(userAgent) || (screenWidth >= 768 && screenWidth <= 1024)) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

/**
 * Enhanced device information extraction
 */
export const extractDeviceInfo = (fingerprint: DeviceFingerprint) => {
  const { userAgent } = fingerprint.components;
  
  // OS Detection with versions
  let os = 'Unknown';
  if (/windows nt 10/i.test(userAgent)) os = 'Windows 10+';
  else if (/windows nt 6\.3/i.test(userAgent)) os = 'Windows 8.1';
  else if (/windows nt 6\.2/i.test(userAgent)) os = 'Windows 8';
  else if (/windows nt 6\.1/i.test(userAgent)) os = 'Windows 7';
  else if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/intel mac os x 10_([0-9]+)/i.test(userAgent)) {
    const version = userAgent.match(/intel mac os x 10_([0-9]+)/i)?.[1];
    os = version ? `macOS 10.${version}` : 'macOS';
  } else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
  else if (/android ([0-9\.]+)/i.test(userAgent)) {
    const version = userAgent.match(/android ([0-9\.]+)/i)?.[1];
    os = `Android ${version || ''}`;
  } else if (/iphone os ([0-9_]+)/i.test(userAgent)) {
    const version = userAgent.match(/iphone os ([0-9_]+)/i)?.[1]?.replace(/_/g, '.');
    os = `iOS ${version || ''}`;
  } else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';
  else if (/cros/i.test(userAgent)) os = 'ChromeOS';

  // Browser Detection with versions
  let browser = 'Unknown';
  if (/edg\/([0-9\.]+)/i.test(userAgent)) {
    const version = userAgent.match(/edg\/([0-9\.]+)/i)?.[1];
    browser = `Edge ${version?.split('.')[0] || ''}`;
  } else if (/chrome\/([0-9\.]+)/i.test(userAgent)) {
    const version = userAgent.match(/chrome\/([0-9\.]+)/i)?.[1];
    browser = `Chrome ${version?.split('.')[0] || ''}`;
  } else if (/firefox\/([0-9\.]+)/i.test(userAgent)) {
    const version = userAgent.match(/firefox\/([0-9\.]+)/i)?.[1];
    browser = `Firefox ${version?.split('.')[0] || ''}`;
  } else if (/version\/([0-9\.]+).*safari/i.test(userAgent)) {
    const version = userAgent.match(/version\/([0-9\.]+)/i)?.[1];
    browser = `Safari ${version?.split('.')[0] || ''}`;
  } else if (/opera|opr\/([0-9\.]+)/i.test(userAgent)) {
    const version = userAgent.match(/(?:opera|opr)\/([0-9\.]+)/i)?.[1];
    browser = `Opera ${version?.split('.')[0] || ''}`;
  }

  const deviceType = getDeviceTypeFromFingerprint(fingerprint);
  const deviceName = `${os} ${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} - ${browser}`;

  return {
    deviceType,
    os,
    browser,
    deviceName,
    confidence: fingerprint.confidence
  };
};