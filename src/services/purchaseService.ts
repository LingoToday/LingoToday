import Purchases, { PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const REVENUECAT_IOS_KEY = process.env.REVENUECAT_IOS_KEY || '';
const REVENUECAT_ANDROID_KEY = process.env.REVENUECAT_ANDROID_KEY || '';

class PurchaseService {
  private initialized = false;

  async initialize(userId?: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
      
      if (!apiKey) {
        console.error('RevenueCat API key not found for platform:', Platform.OS);
        throw new Error(`RevenueCat API key not configured for ${Platform.OS}`);
      }

      await Purchases.configure({ apiKey });

      if (userId) {
        await Purchases.logIn(userId);
      }

      this.initialized = true;
      console.log('✅ RevenueCat initialized successfully for', Platform.OS);
    } catch (error) {
      console.error('❌ Error initializing RevenueCat:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesPackage[]> {
    try {
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
        return offerings.current.availablePackages;
      }
      
      console.warn('No offerings available');
      return [];
    } catch (error) {
      console.error('Error fetching offerings:', error);
      throw error;
    }
  }

  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      const hasProAccess = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
      
      return {
        success: hasProAccess,
        customerInfo,
      };
    } catch (error: any) {
      if (error.userCancelled) {
        return {
          success: false,
          error: 'Purchase cancelled',
        };
      }
      
      console.error('Purchase error:', error);
      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  async restorePurchases(): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      
      const hasProAccess = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
      
      return {
        success: hasProAccess,
        customerInfo,
      };
    } catch (error: any) {
      console.error('Restore error:', error);
      return {
        success: false,
        error: error.message || 'Restore failed',
      };
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Error getting customer info:', error);
      return null;
    }
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return typeof customerInfo.entitlements.active['pro'] !== 'undefined';
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  async logIn(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      console.log('✅ User logged in to RevenueCat:', userId);
    } catch (error) {
      console.error('❌ Error logging in to RevenueCat:', error);
      throw error;
    }
  }

  async logOut(): Promise<void> {
    try {
      await Purchases.logOut();
      console.log('✅ User logged out from RevenueCat');
    } catch (error) {
      console.error('❌ Error logging out from RevenueCat:', error);
      throw error;
    }
  }
}

export const purchaseService = new PurchaseService();
