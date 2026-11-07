const transactionBrand = Symbol('Tx')

export interface Tx {
  readonly [transactionBrand]: true
}

export interface TransactionRunner {
  run<Result>(work: (tx: Tx) => Promise<Result>): Promise<Result>
}

export function createTx(): Tx {
  return Object.freeze({ [transactionBrand]: true as const })
}
