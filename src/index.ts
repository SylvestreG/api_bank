const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = 8080;

app.post("/webhooks/transactions", (req: any, res: any) => {
  console.log(req.body);
  const card_id = req.body.meta_info.card_id;
  const marchant_id = req.body.meta_info.merchant.id;
  const transaction_id = req.id;
  const amount = req.amount;
  const country_code = req.body.meta_info.country_code.id;
  const category_code = req.body.meta_info.category_code.id;

  //lookup for account id throught card id ?

  //lookup if it is a known marchant ?

  //insert cb transaction and keep id

  //INSERT INTO cbtransaction (id, marchant_id, merchant_category_code, marchant_name, country_code) VALUES ('', '', '', '', '', '')

  //lookup if marchant exist for

  console.log(card_id);
  res.send(`${card_id}`);
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
