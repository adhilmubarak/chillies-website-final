
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isVegetarian?: boolean;
  isSpicy?: boolean; // Legacy flag
  spicyLevel?: 'mild' | 'medium' | 'hot' | 'none'; // New granular control
  isChefChoice?: boolean;
  isFlashSale?: boolean; // Added for Flash Sale feature
  flashSalePrice?: number; // Added for discounted price
  isHappyHour?: boolean; // Added for Happy Hour feature
  happyHourPrice?: number; // Added for Happy Hour price
  isExclusive?: boolean; // If true, only shows in Flash/Happy tabs, not in "All" or standard categories
  tags?: string[];
  isUnavailable?: boolean; // Mark as Sold Out/Unavailable
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type Category = string;

export interface CategoryConfig {
  id: string;
  name: string;
  startTime?: string; // Format "HH:MM" (24h)
  endTime?: string;   // Format "HH:MM" (24h)
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface Coupon {
  id?: string;
  code: string;
  value: number;
  type: 'flat' | 'percent';
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  subtotal?: number; // Added to track original price
  discount?: number; // Added to track discount amount
  deliveryCharge?: number; // Added to track delivery fee
  couponCode?: string | null; // Added to track applied coupon (nullable for Firestore)
  customerName: string;
  contactNumber: string;
  address?: string;
  type: 'delivery' | 'pickup';
  status: OrderStatus;
  timestamp: string;
  date: string;
  createdAt: number;
  trackingLink?: string; // Added to persist the tracking link
}