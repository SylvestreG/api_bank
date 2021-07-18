export interface Amount {
  value: number;
  unit: string;
  currency: string;
}

export interface Merchant {
  id: string;
  category_code: string;
  country_code: string;
  name: string;
}

export interface MetaInfo {
  card_id: string;
  merchant: Merchant;
}

export interface TransactionInterface {
  id: string;
  amount: Amount;
  type: string;
  status: string;
  meta_info: MetaInfo;
}

export interface accountIdQuery {
  account_id: string;
}

export interface companyIdQuery {
  company_id: string;
}

export interface cashbackIdQuery {
  id: string;
  status: string;
}

export interface cbtransaction {
  id: string;
}

export interface transactionJoinElems {
  amount: number;
  iban: string;
  bic: string;
  balance: number;
  id: string;
  sepa_id: number;
  cb_id: number;
  account_id: number;
  type: string;
  cash_back: number;
}
