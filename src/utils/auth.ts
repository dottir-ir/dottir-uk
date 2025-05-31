function browserRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return array;
}

/**
 * Generates a specified number of backup codes for MFA
 * @param count Number of backup codes to generate
 * @returns Array of backup codes
 */
export function generateBackupCodes(count: number): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8 random bytes and convert to hex
    const code = Array.from(browserRandomBytes(8)).map(b => b.toString(16).padStart(2, '0')).join('');
    // Format as 4 groups of 4 characters
    codes.push(code.match(/.{1,4}/g)?.join('-') || code);
  }
  return codes;
}

/**
 * Validates a backup code format
 * @param code Backup code to validate
 * @returns boolean indicating if the code is valid
 */
export function isValidBackupCode(code: string): boolean {
  // Check if code matches format: XXXX-XXXX-XXXX-XXXX
  return /^[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}$/i.test(code);
}

/**
 * Gets device information for session tracking
 * @returns Object containing device information
 */
export function getDeviceInfo(): any {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
} 