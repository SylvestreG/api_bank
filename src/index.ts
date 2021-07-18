import { TransactionHook } from "./transaction_hook";
import { dbInterfaceImpl } from "./db";
import {
  accountIdQuery,
  cashbackIdQuery,
  transactionJoinElems,
} from "./transaction.interface";

const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = 8080;

app.get("/api/user/:id/transactions", async (req: any, res: any) => {
  try {
    let db = new dbInterfaceImpl();
    await db.connectToDb();
    let user_id: number = req.params.id;

    let ret: Array<transactionJoinElems> = await db.sendQuery(`select amount,
                                                                            iban,
                                                                            bic,
                                                                            balance,
                                                                            t.id,
                                                                            t.sepa_id,
                                                                            t.cb_id,
                                                                            type
                                                                     FROM users
                                                                              JOIN account a on users.id = a.user_id
                                                                              JOIN transaction t on a.id = t.account_id
                                                                     WHERE users.id = ${user_id}
        ;`);

    if (ret.length == 0) res.send(`no transactions for user: ${user_id}`);
    else {
      for (const t of ret) {
        let transaction = new TransactionHook(t, db);
        let cash_back = await transaction.getCashBackAmountForTransaction();
        t.cash_back = cash_back.cash_back;
      }

      res.send(JSON.stringify(ret));
    }
  } catch (error) {
    res.send(error.message);
  }
});

app.post("/webhooks/transactions", async (req: any, res: any) => {
  console.log(req.body);
  let db = new dbInterfaceImpl();
  await db.connectToDb();

  let transaction = new TransactionHook(req.body, db);
  if (transaction.status == "OPEN") {
    try {
      if (await transaction.findAccountId()) {
        if (await transaction.checkIfMerchantRegistered()) {
          console.log("marchant registred");
          await transaction.insertCashback("ONHOLD");
        } else {
          console.log("unknow marchant store only transaction");
        }
        await transaction.insertTransactionCb();
        await transaction.insertTransaction();

        res.send("ok");
        return;
      }

      res.send("error");
    } catch (err) {
      console.log(err);
    }
  } else if (transaction.status == "CANCELLED") {
    //todo delete cashback
  } else if (transaction.status == "DONE") {
    await transaction.validateTransaction();
  }
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
