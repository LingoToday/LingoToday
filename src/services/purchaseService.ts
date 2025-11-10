import Purchases, { PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get RevenueCat keys from app config with fallbacks for different build types
// - Expo Go / Dev Client: Constants.expoConfig.extra
// - Standalone/EAS builds: Constants.manifest.extra or Constants.manifest2.extra
const getRevenueCatKey = (platform: 'ios' | 'android'): string => {
  const keyName = platform === 'ios' ? 'revenuecatIosKey' : 'revenuecatAndroidKey';
  
  // Try expoConfig first (Expo Go, dev client)
  const expoConfigKey = Constants.expoConfig?.extra?.[keyName];
  if (expoConfigKey) {
    console.log(`✅ Found ${keyName} in expoConfig.extra`);
    return expoConfigKey;
  }
  
  // Fall back to manifest for standalone builds
  const manifestKey = Constants.manifest?.extra?.[keyName];
  if (manifestKey) {
    console.log(`✅ Found ${keyName} in manifest.extra`);
    return manifestKey;
  }
  
  // Fall back to manifest2 for newer Expo builds
  const manifest2Key = (Constants.manifest2 as any)?.extra?.expoClient?.extra?.[keyName];
  if (manifest2Key) {
    console.log(`✅ Found ${keyName} in manifest2.extra`);
    return manifest2Key;
  }
  
  console.error(`❌ RevenueCat key "${keyName}" not found in any config location`);
  return '';
};

class PurchaseService {
  private initialized = false;
  private currentUserId: string | null = null;

  async initialize(userId?: string): Promise<void> {
    try {
      // If not initialized yet, configure the SDK
      if (!this.initialized) {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        const apiKey = getRevenueCatKey(platform);
        
        if (!apiKey) {
          console.error('RevenueCat API key not found for platform:', Platform.OS);
          const keyName = Platform.OS === 'ios' ? 'revenuecatIosKey' : 'revenuecatAndroidKey';
          throw new Error(`RevenueCat API key not configured for ${Platform.OS}. Please add "${keyName}" to app.json extra section.`);
        }

        await Purchases.configure({ apiKey });
        this.initialized = true;
        console.log('✅ RevenueCat SDK configured for', Platform.OS);
      }

      // Log in user if userId is provided and different from current
      if (userId && userId !== this.currentUserId) {
        await Purchases.logIn(userId);
        this.currentUserId = userId;
        console.log('✅ User logged in to RevenueCat:', userId);
      }
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
      await Purchases.purchasePackage(packageToPurchase);
      
      console.log('✅ Purchase completed, invalidating cache and refetching customer info...');
      
      await Purchases.invalidateCustomerInfoCache();
      
      const freshCustomerInfo = await Purchases.getCustomerInfo();
      
      const hasProAccess = typeof freshCustomerInfo.entitlements.active['pro'] !== 'undefined';
      
      console.log(`Entitlement check after cache invalidation: ${hasProAccess ? '✅ Active' : '❌ Not active'}`);
      
      if (!hasProAccess) {
        console.warn('⚠️ Entitlement not immediately active, waiting 2 seconds and retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await Purchases.invalidateCustomerInfoCache();
        const retryCustomerInfo = await Purchases.getCustomerInfo();
        const retryHasProAccess = typeof retryCustomerInfo.entitlements.active['pro'] !== 'undefined';
        
        console.log(`Retry entitlement check: ${retryHasProAccess ? '✅ Active' : '❌ Not active'}`);
        
        return {
          success: retryHasProAccess,
          customerInfo: retryCustomerInfo,
        };
      }
      
      return {
        success: hasProAccess,
        customerInfo: freshCustomerInfo,
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
      await Purchases.restorePurchases();
      
      console.log('✅ Restore completed, invalidating cache and refetching customer info...');
      
      await Purchases.invalidateCustomerInfoCache();
      
      const freshCustomerInfo = await Purchases.getCustomerInfo();
      
      const hasProAccess = typeof freshCustomerInfo.entitlements.active['pro'] !== 'undefined';
      
      console.log(`Entitlement check after restore: ${hasProAccess ? '✅ Active' : '❌ Not active'}`);
      
      if (!hasProAccess) {
        console.warn('⚠️ Entitlement not immediately active after restore, waiting 2 seconds and retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await Purchases.invalidateCustomerInfoCache();
        const retryCustomerInfo = await Purchases.getCustomerInfo();
        const retryHasProAccess = typeof retryCustomerInfo.entitlements.active['pro'] !== 'undefined';
        
        console.log(`Retry entitlement check after restore: ${retryHasProAccess ? '✅ Active' : '❌ Not active'}`);
        
        return {
          success: retryHasProAccess,
          customerInfo: retryCustomerInfo,
        };
      }
      
      return {
        success: hasProAccess,
        customerInfo: freshCustomerInfo,
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
      this.currentUserId = null;
      console.log('✅ User logged out from RevenueCat');
    } catch (error) {
      console.error('❌ Error logging out from RevenueCat:', error);
      throw error;
    }
  }
}

export const purchaseService = new PurchaseService();
