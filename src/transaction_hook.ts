import {
  accountIdQuery,
  companyIdQuery,
  TransactionInterface,
} from "./transaction.interface";
import { dbInterfaceImpl } from "./db";

export class TransactionHook {
  private _cardId: string;
  private _merchantId: string;
  private _merchantName: string;
  private _transactionId: string;
  private _amountCents: number;
  private _countryCode: string;
  private _categoryCode: string;
  private _accountId?: bigint;
  private _companyId?: bigint;
  private _cashbackId?: bigint;
  private _db: dbInterfaceImpl;

  constructor(body: TransactionInterface) {
    this._cardId = body.meta_info.card_id;
    this._merchantId = body.meta_info.merchant.id;
    this._merchantName = body.meta_info.merchant.name;
    this._transactionId = body.id;
    this._amountCents = body.amount.value;
    this._countryCode = body.meta_info.merchant.country_code;
    this._categoryCode = body.meta_info.merchant.category_code;
    this._db = new dbInterfaceImpl();
    this._db.connectToDb();
  }

  async findAccountId(): Promise<boolean> {
    try {
      const ret: Array<accountIdQuery> = await this._db.sendQuery(
        `SELECT account_id
                 FROM card
                 WHERE id = '${this._cardId}';`
      );
      this._accountId = BigInt(ret[0].account_id);
      return true;
    } catch (error) {
      console.error(error);
    }
    return false;
  }

  async insertTransactionCb(): Promise<void> {
    if (this._cashbackId) {
      await this._db.sendInsertRequest(
        `INSERT INTO cbTransaction (merchant_id, merchant_category_code, merchant_name, country_code,
                                            cashback_id)
                 VALUES ('${this._merchantId}', '${this._categoryCode}', '${this._merchantName}', '${this._countryCode}', '${this._cashbackId}');`
      );
    } else {
      await this._db.sendInsertRequest(
        `INSERT INTO cbTransaction (merchant_id, merchant_category_code, merchant_name, country_code)
        VALUES ('${this._merchantId}', '${this._categoryCode}', '${this._merchantName}', '${this._countryCode}');`
      );
    }
  }

  async checkIfMerchantRegistered(): Promise<boolean> {
    try {
      const ret: Array<companyIdQuery> = await this._db.sendQuery(
        `SELECT company_id
        FROM cbmerchantid
        WHERE cb_merchant_id = '${this._merchantId}';`
      );

      if (ret.length != 1) return false;

      this._companyId = BigInt(ret[0].company_id);
      return true;
    } catch (error) {
      console.error(error);
    }

    return false;
  }
}
