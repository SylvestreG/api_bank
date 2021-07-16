import { dbInterface, users, dbList, account } from "./db.interface";
import { Client } from "pg";

export class dbInterfaceImpl implements dbInterface {
  private _client: Client;

  constructor() {
    this._client = new Client({
      user: "postgres",
      database: "bank",
      password: "syl",
    });
  }

  async connectToDb(): Promise<void> {
    try {
      await this._client.connect();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async sendInsertRequest(req: string): Promise<void> {
    try {
      const result = await this._client.query(req);

      console.log(`succeed ${result.rowCount} inserted`);
    } catch (e) {
      console.error(e.message);
    }
  }

  async closeDb() {
    await this._client.end();
  }
}

export class dbListImpl<Type> implements dbList<Type> {
  private _list: Array<Type>;
  private readonly _type: string;

  constructor(typename: string) {
    this._type = typename;
    this._list = [];
  }

  get list(): Array<Type> {
    return this._list;
  }

  set list(value: Array<Type>) {
    this._list = value;
  }

  buildInsertRequest(): string {
    if (this._list.length == 0) {
      console.error("empty request");
      throw Error("empty request");
    }

    let output: string = `INSERT INTO ${this._type} (`;
    output += Object.keys(this._list[0]).join(",");
    output += ") VALUES ";

    let rows: Array<string> = [];
    this._list.forEach((node: Type) => {
      rows.push(
        "(" +
          Object.values(node)
            .map((x) => `'${x}'`)
            .join(",") +
          ")"
      );
    });

    output += rows.join(",");
    output += ";";
    console.log(`trying ${output}`);
    return output;
  }

  static buildUserListFromData<Type>(
    type: string,
    jsonInput: string
  ): dbList<Type> {
    let ul = new dbListImpl<Type>(type);
    const jsonObj = JSON.parse(jsonInput);

    if (!Array.isArray(jsonObj)) {
      console.error("cannot parse json must start with an array");
      throw new Error("invalid json");
    }

    jsonObj.forEach((node: Type) => {
      switch (type) {
        case "users":
          if ("name" in node && "surname" in node && "email" in node)
            ul.list.push(node);
          else console.error(`bad object ${JSON.stringify(node)}`);
          return;

        case "account":
          if (
            "iban" in node &&
            "bic" in node &&
            "balance" in node &&
            "user_id" in node
          )
            ul.list.push(node);
          else console.error(`bad object ${JSON.stringify(node)}`);
          break;

        default:
          console.error("unknown table");
      }
    });

    return ul;
  }
}
