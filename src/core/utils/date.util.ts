export class DateUtil {
  static now(): Date {
    return new Date();
  }

  static nowISO(): string {
    return new Date().toISOString();
  }

  static addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  static addHours(date: Date, hours: number): Date {
    return new Date(date.getTime() + hours * 3600000);
  }

  static addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 86400000);
  }

  static subtractDays(date: Date, days: number): Date {
    return new Date(date.getTime() - days * 86400000);
  }

  static isExpired(expiryDate: Date): boolean {
    return expiryDate < new Date();
  }

  static differenceInMinutes(date1: Date, date2: Date): number {
    return Math.floor((date1.getTime() - date2.getTime()) / 60000);
  }

  static differenceInHours(date1: Date, date2: Date): number {
    return Math.floor((date1.getTime() - date2.getTime()) / 3600000);
  }

  static differenceInDays(date1: Date, date2: Date): number {
    return Math.floor((date1.getTime() - date2.getTime()) / 86400000);
  }

  static startOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  static endOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }

  static formatDateToString(date: Date, format: 'ISO' | 'YYYY-MM-DD' = 'ISO'): string {
    if (format === 'ISO') {
      return date.toISOString();
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static parseISO(isoString: string): Date {
    return new Date(isoString);
  }

  static isValidDate(date: unknown): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }
}