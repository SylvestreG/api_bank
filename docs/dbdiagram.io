// Creating tables
Table users as U {
  id bigint [pk, increment] // auto-increment
  name varchar(255)
  surname varchar(255)
  mail varchar(255)
}

Table account as A {
  id bigint [pk, increment] // auto-increment
  IBAN varchar(34)
  BIC varchar(11)
  balance money
  user_id bigint [ ref: < U.id]
}

Enum transactionType {
  SEPA
  CB
}

Table transactions as T {
  id bigint [pk,increment]
  type transactionType
  account_id bigint
  transactions_spec_id bigint
}
