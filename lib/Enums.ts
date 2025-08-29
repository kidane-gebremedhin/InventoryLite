
export enum RecordStatus {
    ACTIVE = 'active',
    ARCHIVED = 'archived',
}

export enum OrderStatus {
    PENDING = 'pending',
    RECEIVED = 'received',
    FULFILLED = 'fulfilled',
    CANCELLED = 'cancelled',
}

export enum PurchaseOrderStatus {
    PENDING = OrderStatus.PENDING,
    RECEIVED = OrderStatus.RECEIVED,
    CANCELLED = OrderStatus.CANCELLED
}

export enum SalesOrderStatus {
    PENDING = OrderStatus.PENDING,
    FULFILLED = OrderStatus.FULFILLED,
    CANCELLED = OrderStatus.CANCELLED
}

export enum TransactionDirection {
    IN = 'in',
    OUT = 'out'
}

