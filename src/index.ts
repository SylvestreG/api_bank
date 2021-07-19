import { TransactionHook } from "./transaction_hook";
import { dbInterfaceImpl } from "./db";
import { transactionJoinElems } from "./transaction.interface";

const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = 8080;

interface cashByMerchant {
  marchantName: string;
  totalCash: number;
}

app.get("/api/stats/merchant/cashback", async (req: any, res: any) => {
  let db = new dbInterfaceImpl();
  await db.connectToDb();

  let ret: Array<any> = await db.sendQuery(`
        SELECT name, SUM(amount * cashback_percent / 100) AS cb_value
        FROM company
                 JOIN cbmerchantid c ON company.id = c.company_id
                 JOIN cbtransaction t ON t.merchant_id = c.cb_merchant_id
                 JOIN transaction ON transaction.cb_id = t.id
        GROUP BY name;`);

  if (ret.length == 0) {
    res.send("no cashback for any merchant");
  }
  res.send(JSON.stringify(ret));
});

app.get(
  "/api/stats/marchant/two_client/:from/:to",
  async (req: any, res: any) => {
    let db = new dbInterfaceImpl();
    await db.connectToDb();

    let from: string = req.params.from;
    let to: string = req.params.to;
    console.log(from);
    console.log(to);

    let ret: Array<any> = await db.sendQuery(`SELECT corp.name FROM users u
                                                                      JOIN account a ON u.id = a.user_id
                                                                      JOIN transaction t on t.account_id = a.id
                                                                      JOIN cbtransaction c on t.cb_id = c.id
                                                                      JOIN cbmerchantid cm on cm.cb_merchant_id = c.merchant_id
                                                                      JOIN company corp on cm.company_id = corp.id
                                              WHERE t.date BETWEEN '${from}' AND '${to}'
                                              GROUP BY corp.name
                                              HAVING COUNT(DISTINCT u.name) > 1;
    `);

    if (ret.length == 0) {
      res.send("no merchant found for this timeline");
      return;
    }
    res.send(JSON.stringify(ret));
  }
);

app.get("/api/stats/merchant/topunknown", async (req: any, res: any) => {
  let db = new dbInterfaceImpl();
  await db.connectToDb();

  let ret: Array<any> =
    await db.sendQuery(` select merchant_name from transaction t
    join cbtransaction cb on cb.id = t.cb_id
    join cbmerchantid mid on cb.merchant_id = mid.cb_merchant_id
    WHERE mid.company_id IS NULL
    GROUP BY (merchant_name)
    ORDER BY count(cb.id) DESC
    LIMIT 10;`);

  if (ret.length == 0) {
    res.send("no merchant with unknow company");
    return;
  }
  res.send(JSON.stringify(ret));
});

app.get("/api/user/:id/transactions", async (req: any, res: any) => {
  try {
    let db = new dbInterfaceImpl();
    await db.connectToDb();

    let user_id: number = parseInt(req.params.id);

    console.log(user_id);
    if (isNaN(user_id)) {
      res.send("invalid user id");
      return;
    }

    let ret: Array<transactionJoinElems> = await db.sendQuery(`select amount,
                                                                          iban,
                                                                          bic,
                                                                          balance,
                                                                          t.id,
                                                                          t.sepa_id,
                                                                          t.cb_id,
                                                                          t.account_id,
                                                                          type
                                                                   FROM users
                                                                            JOIN account a on users.id = a.user_id
                                                                            JOIN transaction t on a.id = t.account_id
                                                                   WHERE users.id = ${user_id}
        ;`);

    if (ret.length == 0) {
      res.send(`no transactions for user: ${user_id}`);
      return;
    } else {
      let newRet: Array<any> = [];
      for (const t of ret) {
        let transaction = new TransactionHook(t, db);
        let cash_back = await transaction.getCashBackAmountForTransaction();
        if (cash_back)
          newRet.push({ transaction: t, cashback: cash_back.cashBack });
        else newRet.push({ transaction: t, cashback: null });
      }

      res.send(JSON.stringify(newRet));
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
    await transaction.cancelCashback();
  } else if (transaction.status == "DONE") {
    await transaction.validateTransaction();
  }
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
