
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

export enum FeedbackCategory {
    BUG = 'bug',
    FEATURE = 'feature',
    IMPROVEMENT = 'improvement',
    GENERAL = 'general'
}

export enum FeedbackStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    CLOSED = 'closed'
}

export enum FeedbackPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent'
}

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user'
}
