export abstract class WatchedList<T> {
  private _currentItems: T[];
  private _initial: T[];
  private _new: T[];
  private _removed: T[];

  constructor(initialItems?: T[]) {
    this._currentItems = initialItems || [];
    this._initial = initialItems || [];
    this._new = [];
    this._removed = [];
  }

  get currentItems(): T[] {
    return this._currentItems;
  }

  get newItems(): T[] {
    return this._new;
  }

  get removedItems(): T[] {
    return this._removed;
  }

  private isCurrentItem(item: T): boolean {
    return this._currentItems.some(v => this.compareItems(item, v));
  }

  private isNewItem(item: T): boolean {
    return this._new.some(v => this.compareItems(item, v));
  }

  private isRemovedItem(item: T): boolean {
    return this._removed.some(v => this.compareItems(item, v));
  }

  private removeFromNew(item: T): void {
    this._new = this._new.filter(v => !this.compareItems(v, item));
  }

  private removeFromCurrent(item: T): void {
    this._currentItems = this._currentItems.filter(v => !this.compareItems(item, v));
  }

  private removeFromRemoved(item: T): void {
    this._removed = this._removed.filter(v => !this.compareItems(item, v));
  }

  private wasAddedInitially(item: T): boolean {
    return this._initial.some(v => this.compareItems(item, v));
  }

  public exists(item: T): boolean {
    return this.isCurrentItem(item);
  }

  public add(item: T): void {
    if (this.isRemovedItem(item)) {
      this.removeFromRemoved(item);
    }

    if (!this.isNewItem(item) && !this.wasAddedInitially(item)) {
      this._new.push(item);
    }

    if (!this.isCurrentItem(item)) {
      this._currentItems.push(item);
    }
  }

  public remove(item: T): void {
    this.removeFromCurrent(item);

    if (this.isNewItem(item)) {
      this.removeFromNew(item);
      return;
    }

    if (!this.isRemovedItem(item)) {
      this._removed.push(item);
    }
  }

  abstract compareItems(a: T, b: T): boolean;
}