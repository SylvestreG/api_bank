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
