import { describe, it, expect } from 'vitest';

// Import validateBackendUrl from extension/sidepanel.js
// @ts-expect-error JS module without type declaration
import sidepanelModule from '../../../../extension/sidepanel.js';

const { validateBackendUrl } = sidepanelModule;

describe('Chrome Side Panel Companion — Backend URL & Security Validation', () => {
  it('allows valid HTTPS production URLs and strips trailing slashes', () => {
    const validProd = 'https://jiosi-inbox-api.onrender.com/';
    const result = validateBackendUrl(validProd);
    expect(result).toBe('https://jiosi-inbox-api.onrender.com');
  });

  it('allows HTTP specifically for localhost and 127.0.0.1 during development', () => {
    expect(validateBackendUrl('http://localhost:8080/')).toBe('http://localhost:8080');
    expect(validateBackendUrl('http://127.0.0.1:8080')).toBe('http://127.0.0.1:8080');
  });

  it('rejects HTTP for remote production domains', () => {
    expect(() => validateBackendUrl('http://inbox-api.jiosi.online')).toThrow(
      /HTTPS is required for production backend URLs/
    );
    expect(() => validateBackendUrl('http://api.example.com')).toThrow(
      /HTTPS is required for production backend URLs/
    );
  });

  it('rejects URLs with embedded username or password credentials', () => {
    expect(() => validateBackendUrl('https://admin:secret123@jiosi-inbox-api.onrender.com')).toThrow(
      /must not contain embedded username or password credentials/
    );
    expect(() => validateBackendUrl('https://user@jiosi-inbox-api.onrender.com')).toThrow(
      /must not contain embedded username or password credentials/
    );
  });

  it('rejects unsafe schemes like javascript:, data:, file:, ftp:', () => {
    expect(() => validateBackendUrl('javascript:alert(1)')).toThrow(/Unsafe protocol/);
    expect(() => validateBackendUrl('data:text/html,<b>xss</b>')).toThrow(/Unsafe protocol/);
    expect(() => validateBackendUrl('file:///etc/passwd')).toThrow(/Unsafe protocol/);
    expect(() => validateBackendUrl('ftp://files.example.com')).toThrow(/Unsafe protocol/);
  });

  it('rejects empty, null, or malformed URL strings', () => {
    expect(() => validateBackendUrl('')).toThrow(/cannot be empty/);
    expect(() => validateBackendUrl(null as unknown as string)).toThrow(/cannot be empty/);
    expect(() => validateBackendUrl('not-a-valid-url')).toThrow(/Invalid URL format/);
  });
});
