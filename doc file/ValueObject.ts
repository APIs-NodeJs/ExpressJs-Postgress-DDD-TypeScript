/**
 * Value Object base class implementing DDD principles
 * 
 * Key Characteristics:
 * - No unique identifier
 * - Immutable (cannot be changed after creation)
 * - Compared by value, not by reference
 * - Can be shared between entities
 * - Should contain validation logic
 * 
 * Examples: Email, Money, Address, DateRange, etc.
 * 
 * @template T - Type of the value object's properties
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * Compare two value objects
   * Value objects are equal if all their properties are equal
   * 
   * @param vo - Value object to compare with
   * @returns true if value objects are equal
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    
    if (vo.props === undefined) {
      return false;
    }

    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }

  /**
   * Get string representation of the value object
   */
  public toString(): string {
    return JSON.stringify(this.props);
  }
}

/**
 * Example implementations:
 * 
 * ```typescript
 * // Email Value Object
 * export class Email extends ValueObject<{ value: string }> {
 *   private constructor(props: { value: string }) {
 *     super(props);
 *   }
 * 
 *   public static create(email: string): Result<Email> {
 *     if (!email || email.trim().length === 0) {
 *       return Result.fail('Email cannot be empty');
 *     }
 * 
 *     const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 *     if (!regex.test(email)) {
 *       return Result.fail('Invalid email format');
 *     }
 * 
 *     return Result.ok(new Email({ value: email.toLowerCase().trim() }));
 *   }
 * 
 *   get value(): string {
 *     return this.props.value;
 *   }
 * 
 *   get domain(): string {
 *     return this.props.value.split('@')[1];
 *   }
 * }
 * 
 * // Money Value Object
 * export class Money extends ValueObject<{ amount: number; currency: string }> {
 *   private constructor(props: { amount: number; currency: string }) {
 *     super(props);
 *   }
 * 
 *   public static create(amount: number, currency: string): Result<Money> {
 *     if (amount < 0) {
 *       return Result.fail('Amount cannot be negative');
 *     }
 * 
 *     if (!['USD', 'EUR', 'GBP'].includes(currency)) {
 *       return Result.fail('Invalid currency');
 *     }
 * 
 *     return Result.ok(new Money({ amount, currency }));
 *   }
 * 
 *   public add(money: Money): Result<Money> {
 *     if (this.props.currency !== money.props.currency) {
 *       return Result.fail('Cannot add different currencies');
 *     }
 * 
 *     return Money.create(
 *       this.props.amount + money.props.amount,
 *       this.props.currency
 *     );
 *   }
 * 
 *   public multiply(factor: number): Result<Money> {
 *     return Money.create(
 *       this.props.amount * factor,
 *       this.props.currency
 *     );
 *   }
 * 
 *   get amount(): number {
 *     return this.props.amount;
 *   }
 * 
 *   get currency(): string {
 *     return this.props.currency;
 *   }
 * 
 *   public format(): string {
 *     return `${this.props.amount.toFixed(2)} ${this.props.currency}`;
 *   }
 * }
 * 
 * // Address Value Object
 * export class Address extends ValueObject<{
 *   street: string;
 *   city: string;
 *   state: string;
 *   zipCode: string;
 *   country: string;
 * }> {
 *   private constructor(props: {
 *     street: string;
 *     city: string;
 *     state: string;
 *     zipCode: string;
 *     country: string;
 *   }) {
 *     super(props);
 *   }
 * 
 *   public static create(props: {
 *     street: string;
 *     city: string;
 *     state: string;
 *     zipCode: string;
 *     country: string;
 *   }): Result<Address> {
 *     // Validation
 *     if (!props.street || props.street.trim().length === 0) {
 *       return Result.fail('Street is required');
 *     }
 * 
 *     if (!props.city || props.city.trim().length === 0) {
 *       return Result.fail('City is required');
 *     }
 * 
 *     // More validation...
 * 
 *     return Result.ok(new Address(props));
 *   }
 * 
 *   get street(): string {
 *     return this.props.street;
 *   }
 * 
 *   get city(): string {
 *     return this.props.city;
 *   }
 * 
 *   public format(): string {
 *     return `${this.props.street}, ${this.props.city}, ${this.props.state} ${this.props.zipCode}, ${this.props.country}`;
 *   }
 * }
 * 
 * // DateRange Value Object
 * export class DateRange extends ValueObject<{ start: Date; end: Date }> {
 *   private constructor(props: { start: Date; end: Date }) {
 *     super(props);
 *   }
 * 
 *   public static create(start: Date, end: Date): Result<DateRange> {
 *     if (start > end) {
 *       return Result.fail('Start date must be before end date');
 *     }
 * 
 *     return Result.ok(new DateRange({ start, end }));
 *   }
 * 
 *   public contains(date: Date): boolean {
 *     return date >= this.props.start && date <= this.props.end;
 *   }
 * 
 *   public overlaps(range: DateRange): boolean {
 *     return (
 *       this.contains(range.props.start) ||
 *       this.contains(range.props.end) ||
 *       range.contains(this.props.start)
 *     );
 *   }
 * 
 *   public durationInDays(): number {
 *     const diff = this.props.end.getTime() - this.props.start.getTime();
 *     return Math.floor(diff / (1000 * 60 * 60 * 24));
 *   }
 * 
 *   get start(): Date {
 *     return this.props.start;
 *   }
 * 
 *   get end(): Date {
 *     return this.props.end;
 *   }
 * }
 * ```
 */

/**
 * Benefits of using Value Objects:
 * 
 * 1. **Type Safety**: Prevents primitive obsession
 *    - Instead of: `function sendEmail(email: string)`
 *    - Use: `function sendEmail(email: Email)`
 * 
 * 2. **Validation in One Place**: All validation logic is in the value object
 *    - Email validation logic exists only in Email class
 *    - No duplicate validation across codebase
 * 
 * 3. **Immutability**: Cannot be changed after creation
 *    - Prevents accidental modifications
 *    - Easier to reason about
 *    - Thread-safe
 * 
 * 4. **Business Logic**: Can contain domain-specific methods
 *    - Money.add(), Money.multiply()
 *    - DateRange.contains(), DateRange.overlaps()
 *    - Address.format()
 * 
 * 5. **Shareability**: Can be safely shared between entities
 *    - Multiple users can have the same Address
 *    - No identity, so no confusion
 * 
 * 6. **Testing**: Easy to unit test in isolation
 *    - Test Email validation
 *    - Test Money calculations
 *    - Test DateRange logic
 */

/**
 * When to use Value Objects:
 * 
 * ✅ DO use Value Objects for:
 * - Measurements (Money, Distance, Weight)
 * - Ranges (DateRange, NumberRange)
 * - Identifiers (Email, PhoneNumber, ISBN)
 * - Addresses and locations
 * - Complex values that need validation
 * 
 * ❌ DON'T use Value Objects for:
 * - Entities (things with identity)
 * - Simple primitives without validation
 * - Mutable data structures
 * - Data that changes independently
 */
