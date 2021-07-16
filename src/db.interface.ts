export interface users {
  name: string;
  surname: string;
  email: string;
}

export interface account {
  iban: string;
  bic: string;
  balance: string;
  user_id: number;
}

export interface dbList<T> {
  list: Array<T>;

  buildInsertRequest(): string;
}

export interface dbInterface {
  connectToDb(): void;

  sendInsertRequest(req: string): void;
}
