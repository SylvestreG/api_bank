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

export interface card {
  id: string;
  user_id: number;
}

export interface company {
  name: string;
  description: string;
  cashback_percent: number;
}

export interface cbmerchantid {
  cb_merchant_id: string;
  company_id: number;
}

export interface cbtransaction {
  merchant_id: string;
  merchant_category_code: string;
  merchant_name: string;
  country_code: string;
}

export interface transaction {
  type: string;
  account_id: number;
  amount: number;
  date: string;
  cb_id: number;
}

export interface dbList<T> {
  list: Array<T>;

  buildInsertRequest(): string;
}

export interface dbInterface {
  connectToDb(): void;

  sendInsertRequest(req: string): Promise<Array<string>>;
  sendQuery(req: string): Promise<Array<string>>;
}
