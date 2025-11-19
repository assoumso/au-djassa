
export enum UserRole {
  GUEST = 'GUEST',
  CLIENT = 'CLIENT',
  SUPPLIER = 'SUPPLIER',
  ADMIN = 'ADMIN'
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  supplierId: string;
  supplierName: string;
  imageUrl: string;
  tags: string[];
  createdAt: number;
  isPromoted?: boolean; // Nouveau champ pour la publicité
}

export interface Supplier {
  id: string;
  name: string;
  rating: number;
  verified: boolean;
  isAvailable: boolean;
  category?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  password?: string; // Mot de passe pour la connexion
}

export enum ViewState {
  LANDING = 'LANDING',
  MARKETPLACE = 'MARKETPLACE',
  SUPPLIER_DASHBOARD = 'SUPPLIER_DASHBOARD',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  SUPPLIER_REGISTRATION = 'SUPPLIER_REGISTRATION',
  SUPPLIER_LOGIN = 'SUPPLIER_LOGIN'
}

export type AiGenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface PaymentDetails {
  method: 'MOBILE_MONEY' | 'CASH_ON_DELIVERY';
  provider?: 'ORANGE' | 'MTN' | 'WAVE'; // Optionnel si CASH_ON_DELIVERY
  phoneNumber?: string; // Optionnel si CASH_ON_DELIVERY
  transactionId?: string; // Optionnel si CASH_ON_DELIVERY
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  shippingFees?: number; // Frais de livraison
  supplierId: string; // ID du fournisseur concerné
  customerName: string;
  customerContact: string; // Nouveau champ pour le téléphone du client
  status: OrderStatus;
  date: number;
  shippingAddress: string;
  paymentDetails?: PaymentDetails;
}

export interface Message {
  id: string;
  senderName: string;
  content: string;
  date: number;
  isFromMe: boolean;
  read: boolean;
}
