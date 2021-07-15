export interface user {
    name: string,
    surname: string,
    email: string
}

export interface userList {
    userList: Array<user>,
    buildUserListFromData(jsonInput: string) : userList;
    buildInsertRequest(): string;
}

export interface dbInterface {
    connectToDb() : boolean;
    sendInsertRequest(req: string) : boolean;
}