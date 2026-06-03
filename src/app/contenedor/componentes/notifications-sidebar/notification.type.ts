export type NotificationCategory = 'factura' | 'mensaje' | 'alerta';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  relatedInvoiceId?: string;
  relatedOfferId?: string;
  actionUrl: string;
}
