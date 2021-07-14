DO $$ BEGIN
    CREATE TYPE transactionType AS ENUM ('SEPA', 'CB');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cashbackStatus AS ENUM ('ONHOLD', 'DONE', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users
(
    id      bigserial PRIMARY KEY,
    name    VARCHAR(255)        NOT NULL,
    surname VARCHAR(255)        NOT NULL,
    email   VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS account
(
    id      bigserial PRIMARY KEY,
    IBAN    varchar(34) NOT NULL,
    BIC     varchar(11) NOT NULL,
    BALANCE money       NOT NULL,
    user_id bigserial   NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);


CREATE TABLE IF NOT EXISTS sepaTransaction
(
    id             bigserial PRIMARY KEY,
    expeditor_name varchar(255) NOT NULL
);


CREATE TABLE IF NOT EXISTS cashBack
(
    id     bigserial PRIMARY KEY,
    status cashbackStatus NOT NULL
);

CREATE TABLE merchant
(
    id              bigserial PRIMARY KEY,
    name            VARCHAR(255) UNIQUE NOT NULL,
    description     text                NOT NULL,
    logo            bytea,
    cashBackPercent decimal(5, 4)       NOT NULL
);

CREATE TABLE IF NOT EXISTS cbMerchantId
(
    cb_merchant_id VARCHAR(64) PRIMARY KEY,
    merchant_id bigserial NOT NULL,

    FOREIGN KEY (merchant_id) REFERENCES merchant (id)
);

CREATE TABLE IF NOT EXISTS cbTransaction
(
    id                   bigserial PRIMARY KEY,
    merchant_id          VARCHAR(64)  NOT NULL, -- note sur about the 64 ???
    merchantCategoryCode VARCHAR(64)  NOT NULL, -- not sure about the 64 ???
    merchantName         VARCHAR(255) NOT NULL,
    coutntryCode         VARCHAR(32)  NOT NULL, -- not sure about the 32 ???
    cashback_id          bigserial UNIQUE,

    FOREIGN KEY (cashback_id) REFERENCES cashBack (id)
);

CREATE TABLE IF NOT EXISTS transaction
(
    id         bigserial PRIMARY KEY,
    type       transactionType NOT NULL,
    account_id bigserial NOT NULL,
    sepa_id    bigserial UNIQUE,
    cb_id      bigserial UNIQUE,

    FOREIGN KEY (account_id) REFERENCES account (id),
    FOREIGN KEY (sepa_id) REFERENCES sepaTransaction (id),
    FOREIGN KEY (cb_id) REFERENCES cbTransaction (id)
);
