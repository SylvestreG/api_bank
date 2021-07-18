import { parse } from "ts-command-line-args";
import * as fs from "fs";
import { dbListImpl, dbInterfaceImpl } from "./db";
import { account, card, cbmerchantid, company, users } from "./db.interface";

interface PopulateDbArgs {
  tableName: string;
  jsonFile: string;
  help?: boolean;
}

export const args = parse<PopulateDbArgs>(
  {
    tableName: String,
    jsonFile: String,
    help: {
      type: Boolean,
      optional: true,
      alias: "h",
      description: "Prints this usage guide",
    },
  },

  {
    helpArg: "help",
    headerContentSections: [
      { header: "PopulateDB", content: "A toolkit to send json data to db" },
    ],
    footerContentSections: [
      { header: "PopulateDB", content: "Copyright: syl(tm)" },
    ],
  }
);

async function buildRequest(tableName: string, json: string): Promise<void> {
  let sqlquery: string;

  switch (tableName) {
    case "users":
      sqlquery = dbListImpl
        .buildUserListFromData<users>(tableName, json)
        .buildInsertRequest();
      break;
    case "account":
      sqlquery = dbListImpl
        .buildUserListFromData<account>(tableName, json)
        .buildInsertRequest();
      break;
    case "card":
      sqlquery = dbListImpl
        .buildUserListFromData<card>(tableName, json)
        .buildInsertRequest();
      break;
    case "company":
      sqlquery = dbListImpl
        .buildUserListFromData<company>(tableName, json)
        .buildInsertRequest();
      break;
    case "cbmerchantid":
      sqlquery = dbListImpl
        .buildUserListFromData<cbmerchantid>(tableName, json)
        .buildInsertRequest();
      break;
    default:
      console.error("unknown tableName");
      return;
  }

  try {
    let db = new dbInterfaceImpl();
    await db.connectToDb();
    await db.sendInsertRequest(sqlquery);
    await db.closeDb();
  } catch (err) {
    console.error(`populate db failed ${err}`);
  }
}

let data = fs.readFileSync(args.jsonFile).toString();
let ret = buildRequest(args.tableName, data);
