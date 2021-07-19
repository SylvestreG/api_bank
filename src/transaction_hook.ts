import {
  accountIdQuery,
  cashbackIdQuery,
  cbtransaction,
  companyIdQuery,
  TransactionInterface,
  transactionJoinElems,
} from "./transaction.interface";
import { dbInterfaceImpl } from "./db";
import { stat } from "fs";

function isTransactionInterface(
  elem: TransactionInterface | transactionJoinElems
): elem is TransactionInterface {
  return (<TransactionInterface>elem).meta_info !== undefined;
}

function isTransactionJoinElems(
  elem: TransactionInterface | transactionJoinElems
): elem is transactionJoinElems {
  return (<transactionJoinElems>elem).bic !== undefined;
}

export class TransactionHook {
  private _cardId?: string;
  private _merchantId?: string;
  private _merchantName?: string;
  private _transactionId: string;
  private _amountCents?: number;
  private _countryCode?: string;
  private _categoryCode?: string;
  private _accountId?: bigint;
  private _companyId?: bigint;
  private _cashbackId?: bigint;
  private _cbTransactionId?: bigint;
  private _status?: string;

  private _db: dbInterfaceImpl;

  constructor(
    body: TransactionInterface | transactionJoinElems,
    db: dbInterfaceImpl
  ) {
    if (isTransactionInterface(body)) {
      this._status = body.status;
      this._cardId = body.meta_info.card_id;
      this._merchantId = body.meta_info.merchant.id;
      this._merchantName = body.meta_info.merchant.name;
      this._transactionId = body.id;
      this._amountCents = body.amount.value;
      this._countryCode = body.meta_info.merchant.country_code;
      this._categoryCode = body.meta_info.merchant.category_code;
    } else {
      this._transactionId = body.id;
      this._accountId = BigInt(body.account_id);
      this._cbTransactionId = BigInt(body.cb_id);
    }

    this._db = db;
  }

  get status(): string {
    if (this._status) return this._status;
    return "unknown";
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

  async insertTransactionCb(): Promise<boolean> {
    try {
      let ret: Array<cbtransaction>;
      if (this._cashbackId) {
        ret = await this._db.sendInsertRequest(
          `INSERT INTO cbTransaction (merchant_id, merchant_category_code, merchant_name, country_code,
                                                cashback_id)
                     VALUES ('${this._merchantId}', '${this._categoryCode}', '${this._merchantName}', '${this._countryCode}', '${this._cashbackId}')
                     RETURNING id;`
        );
      } else {
        ret = await this._db.sendInsertRequest(
          `INSERT INTO cbTransaction (merchant_id, merchant_category_code, merchant_name, country_code)
                     VALUES ('${this._merchantId}', '${this._categoryCode}', '${this._merchantName}', '${this._countryCode}')
                     RETURNING id;`
        );
      }

      if (ret.length != 1) return false;

      this._cbTransactionId = BigInt(ret[0].id);
      return true;
    } catch (error) {
      console.error(error);
    }

    return false;
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

  async insertCashback(status: string): Promise<boolean> {
    try {
      const ret: Array<cashbackIdQuery> = await this._db.sendInsertRequest(
        `INSERT INTO cashback (status)
                 VALUES ('${status}')
                 returning id;`
      );

      if (ret.length != 1) return false;

      this._cashbackId = BigInt(ret[0].id);
      console.log("cashback id " + this._cashbackId);
      return true;
    } catch (error) {
      console.error(error);
    }

    return false;
  }

  async insertTransaction(): Promise<void> {
    try {
      if (this._accountId)
        await this._db.sendInsertRequest(
          `INSERT INTO transaction (id, type, account_id, amount, date, cb_id)
                     VALUES ('${this._transactionId}', 'CB', '${
            this._accountId
          }', '${this._amountCents}', to_timestamp(${Date.now()} / 1000.0), '${
            this._cbTransactionId
          }');`
        );
      else
        await this._db.sendInsertRequest(
          `INSERT INTO transaction (id, type, amount, date, cb_id)
                     VALUES ('${this._transactionId}', 'CB', '${
            this._amountCents
          }', to_timestamp(${Date.now()} / 1000.0), '${
            this._cbTransactionId
          }');`
        );
    } catch (error) {
      console.error(error);
    }
  }

  async getCashBackAmountForTransaction(): Promise<any> {
    let balance: Array<any> = await this._db.sendQuery(
      `SELECT balance, amount, cashback_percent
             FROM account,
                  transaction,
                  cbtransaction,
                  cbmerchantid,
                  company
             WHERE account.id = transaction.account_id
               AND cbtransaction.id = transaction.cb_id
               AND cbmerchantid.cb_merchant_id = cbtransaction.merchant_id
               AND company.id = cbmerchantid.company_id
               AND transaction.id = '${this._transactionId}';`
    );

    if (balance.length != 1) return null;

    let cashBack =
      (parseInt(balance[0].amount) *
        (100 - parseInt(balance[0].cashback_percent))) /
      100;
    let newBalance = parseInt(balance[0].balance) - cashBack;
    return { newBalance: newBalance, cashBack: cashBack };
  }

  async cancelCashback(): Promise<void> {
    try {
      await this._db.sendInsertRequest(
        `UPDATE cashback
                 SET status = 'CANCELLED'
                 WHERE id = (SELECT cashback_id
                             FROM transaction,
                                  cbtransaction
                             WHERE transaction.cb_id = cbtransaction.id
                               AND transaction.id = '${this._transactionId}');`
      );
      console.log("transaction cancelled");
    } catch (error) {
      console.error(error);
    }
  }

  async validateTransaction(): Promise<string> {
    try {
      let status: Array<any> = await this._db.sendQuery(`SELECT status
                                                               FROM cashback,
                                                                    transaction,
                                                                    cbtransaction
                                                               WHERE cashback.id = cbtransaction.cashback_id
                                                                 AND transaction.cb_id = cbtransaction.id
                                                                 AND transaction.id = '${this._transactionId}';`);

      if (status.length != 1) return "unkown transaction...";

      if (status[0].status != "ONHOLD")
        return "you can only validate ONHOLD transactions";

      await this._db.sendInsertRequest(
        `UPDATE cashback
                 SET status = 'DONE'
                 WHERE id = (SELECT cashback_id
                             FROM transaction,
                                  cbtransaction
                             WHERE transaction.cb_id = cbtransaction.id
                               AND transaction.id = '${this._transactionId}');`
      );
      console.log("transaction validated");

      let newBalance: any = await this.getCashBackAmountForTransaction();
      if (newBalance == null) {
        return "transaction done without cashback";
      }
      console.log(
        `get cashback here is the new balance ${newBalance.cashBack}`
      );

      await this._db.sendInsertRequest(
        `UPDATE account
                 SET balance = ${newBalance.newBalance}
                 WHERE id = ${this._accountId};`
      );
    } catch (error) {
      return error.message;
    }

    return "transaction done";
  }
}
