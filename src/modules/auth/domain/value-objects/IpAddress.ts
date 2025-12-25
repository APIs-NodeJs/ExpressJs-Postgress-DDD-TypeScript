export class IpAddress {
  private readonly _value: string;

  private constructor(ip: string) {
    this._value = ip;
  }

  static create(ip: string): IpAddress {
    if (!this.isValid(ip)) {
      throw new Error("Invalid IP address");
    }

    return new IpAddress(ip);
  }

  private static isValid(ip: string): boolean {
    // IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      const parts = ip.split(".");
      return parts.every((part) => parseInt(part, 10) <= 255);
    }

    // IPv6 validation (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv6Regex.test(ip);
  }

  get value(): string {
    return this._value;
  }

  equals(other: IpAddress): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
