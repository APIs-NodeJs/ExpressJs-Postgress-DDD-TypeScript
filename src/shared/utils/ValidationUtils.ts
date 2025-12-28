export class ValidationUtils {
  static isUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  static isPositiveInteger(value: number): boolean {
    return Number.isInteger(value) && value > 0;
  }

  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
