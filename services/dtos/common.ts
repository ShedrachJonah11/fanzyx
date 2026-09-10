export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface Ok {
  ok: true;
}
