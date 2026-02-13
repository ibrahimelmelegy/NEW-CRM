export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  PENDING = 'PENDING'
}

export enum MessageProvider {
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS'
}
