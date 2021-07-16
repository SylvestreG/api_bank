import { TransactionHook } from "./transaction_hook";

const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = 8080;

async function handleRequest(req: TransactionHook): Promise<void> {
  try {
  } catch (error) {
    console.error(error.message);
  }
}

app.post("/webhooks/transactions", async (req: any, res: any) => {
  console.log(req.body);

  let transaction = new TransactionHook(req.body);
  try {
    if (await transaction.findAccountId()) {
      if (await transaction.checkIfMerchantRegistered()) {
        //        transaction.insertCashback();
      }
      await transaction.insertTransactionCb();
      //    await transaction.insertTransaction();

      res.send("ok");
      return;
    }

    res.send("error");
  } catch (err) {
    console.log(err);
  }
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
