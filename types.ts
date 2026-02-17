
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  SALES = 'SALES',
  CLIENTS = 'CLIENTS',
  RECEIVABLES = 'RECEIVABLES',
  REPORTS = 'REPORTS'
}

export type UserRole = 'admin' | 'vendedor' | 'gerente';
export type Language = 'en' | 'es';
export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Product {
  id: string;
  sku: string;
  marca: string;
  modelo: string;
  medida: string;
  precio_venta_base: number;
  stock_total: number; // View calculation
  stock_minimo: number;
  proveedor?: string;
  // UI helpers
  name?: string; // computed from marca + modelo + medida
}

export interface Sale {
  id: string;
  fecha: string;
  items: CartItem[];
  subtotal: number;
  itbis: number;
  total: number;
  cliente_id?: string;
  vendedor_id?: string;
  estado: 'activa' | 'anulada';
  ncf?: string;
  es_credito?: boolean;
  descuento_global?: number;
}

export interface CartItem extends Product {
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
}

export interface KPI {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  icon: string;
  color: string;
  subText?: string;
  progress?: number;
}

export interface Receivable {
  id: string;
  venta_id: string;
  cliente_id: string;
  cliente_nombre?: string; // joined
  monto_total: number;
  monto_pagado: number;
  balance_pendiente: number;
  fecha_vencimiento: string;
  estado: 'pendiente' | 'pagado' | 'vencido';
}

export interface Client {
  id: string;
  nombre: string;
  tipo: 'normal' | 'mayorista';
  descuento_fijo: number;
  limite_credito: number;
  dias_credito: number;
  rnc_cedula: string;
}
