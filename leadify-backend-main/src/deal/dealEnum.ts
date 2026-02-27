export enum DealStageEnums {
  PROGRESS = 'PROGRESS',
  NEGOTIATION = 'NEGOTIATION',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
  CONVERTED = 'CONVERTED'
}
export enum ContractTypeEnums {
  Contract = 'Contract',
  PurchaseOrder = 'PurchaseOrder'
}

export enum DealSortByEnum {
  name = 'name',
  stage = 'stage',
  price = 'price',
  contractType = 'contractType',
  signatureDate = 'signatureDate',
  createdAt = 'createdAt'
}
