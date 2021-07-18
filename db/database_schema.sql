DO
$$
    BEGIN
        CREATE TYPE transactionType AS ENUM ('SEPA', 'CB');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;

DO
$$
    BEGIN
        CREATE TYPE cashbackStatus AS ENUM ('ONHOLD', 'DONE', 'CANCELLED');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;

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
    balance money       NOT NULL,
    user_id bigint      NOT NULL,
    UNIQUE (IBAN, BIC, user_id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS card
(
    id         varchar(64) PRIMARY KEY,
    account_id bigint NOT NULL,

    FOREIGN KEY (account_id) REFERENCES account (id)
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

CREATE TABLE company
(
    id               bigserial PRIMARY KEY,
    name             VARCHAR(255) UNIQUE NOT NULL,
    description      text                NOT NULL,
    logo             bytea,
    cashback_percent decimal             NOT NULL
);

CREATE TABLE IF NOT EXISTS cbMerchantId
(
    cb_merchant_id VARCHAR(64) PRIMARY KEY,
    company_id     bigint NOT NULL,

    FOREIGN KEY (company_id) REFERENCES company (id)
);

CREATE TABLE IF NOT EXISTS cbTransaction
(
    id                     bigserial PRIMARY KEY,
    merchant_id            VARCHAR(64)  NOT NULL, -- note sur about the 64 ???
    merchant_category_code VARCHAR(64)  NOT NULL, -- not sure about the 64 ???
    merchant_name          VARCHAR(255) NOT NULL,
    country_code           VARCHAR(3)   NOT NULL,
    cashback_id            bigint UNIQUE,

    FOREIGN KEY (cashback_id) REFERENCES cashBack (id)
);

CREATE TABLE IF NOT EXISTS transaction
(
    id         varchar(64) PRIMARY KEY,
    type       transactionType NOT NULL,
    account_id bigint,
    amount     money NOT NULL,
    sepa_id    bigint UNIQUE,
    cb_id      bigint UNIQUE,

    FOREIGN KEY (account_id) REFERENCES account (id),
    FOREIGN KEY (sepa_id) REFERENCES sepaTransaction (id),
    FOREIGN KEY (cb_id) REFERENCES cbTransaction (id)
);
