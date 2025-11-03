export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      // API Base URL - can be overridden via environment variables for EAS builds
      apiBaseUrl: process.env.API_BASE_URL || config.extra?.apiBaseUrl || 'https://www.lingotoday.co',
      // RevenueCat API keys - injected from environment variables
      // For local dev: Set in app.json extra section
      // For EAS builds: Set via EAS Secrets (eas secret:create)
      revenuecatIosKey: process.env.REVENUECAT_IOS_KEY || config.extra?.revenuecatIosKey || '',
      revenuecatAndroidKey: process.env.REVENUECAT_ANDROID_KEY || config.extra?.revenuecatAndroidKey || '',
    },
  };
};
