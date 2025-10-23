import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF4FF', // bg-gradient-to-br from-blue-50 to-indigo-100
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    maxWidth: 512, // max-w-2xl
    alignSelf: 'center',
    paddingHorizontal: 16, // px-4
    paddingVertical: 24, // py-6
    width: '100%',
  },

  // Progress bar - matching web exactly
  progressSection: {
    marginBottom: 32, // mb-8
  },
  progressBackground: {
    width: '100%',
    backgroundColor: '#E5E7EB', // bg-gray-200
    borderRadius: 9999, // rounded-full
    height: 8, // h-2
  },
  progressBar: {
    height: 8, // h-2
    backgroundColor: '#6366f1', // bg-primary
    borderRadius: 9999, // rounded-full
  },
  progressText: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-600
    marginTop: 8, // mt-2
    textAlign: 'center',
  },

  // Screen container with slide animation - matching web
  screenContainer: {
    flex: 1,
    opacity: 1,
    transform: [{ translateX: 0 }],
  },
  screenTransitioning: {
    opacity: 0,
    transform: [{ translateX: 16 }], // transform translate-x-4
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Continue button - matching web exactly
  continueSection: {
    marginTop: 32,
    alignItems: 'center',
    minHeight: 80, // Ensure consistent height regardless of hint text
  },
  continueButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 14, // Slightly larger padding
    borderRadius: 9999,
    minWidth: 140, // Slightly wider
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: '#F3F4F6', // bg-gray-100 - lighter disabled state
    borderWidth: 2, // Thicker border
    borderColor: '#E5E7EB', // border-gray-200
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  continueButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600', // font-semibold - slightly bolder
  },
  continueButtonTextDisabled: {
    color: '#6B7280', // text-gray-500 - better contrast than gray-400
  },
  continueButtonIcon: {
    marginLeft: 8,
  },
  continueHint: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12, // mt-3 - more space from button
    textAlign: 'center',
    backgroundColor: '#F9FAFB', // bg-gray-50
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20, // rounded-full
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
    overflow: 'hidden',
  },

  // Screen Content - matching web
  screenContent: {
    alignItems: 'center', // text-center
    flex: 1,
  },
  screenTitle: {
    fontSize: 30, // text-3xl
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
    textAlign: 'center',
    marginBottom: 8, // mb-2
  },
  screenSubtitle: {
    fontSize: 18, // text-lg
    color: '#6B7280', // text-gray-600
    textAlign: 'center',
    marginBottom: 32, // mb-8
    lineHeight: 28,
  },

  // Language Selection - matching web grid grid-cols-2 gap-4 max-w-md mx-auto
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16, // gap-4
    maxWidth: 384, // max-w-md
    width: '100%',
  },
  languageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // rounded-xl
    padding: 24, // p-6
    alignItems: 'center', // text-center
    width: '47%', // 2 columns
    borderWidth: 2,
    borderColor: '#E5E7EB', // border-gray-200
  },
  languageCardSelected: {
    borderColor: '#6366f1', // border-primary
    backgroundColor: 'rgba(99, 102, 241, 0.1)', // bg-primary/10
  },
  languageFlag: {
    fontSize: 48, // text-4xl
    marginBottom: 8, // mb-2
  },
  languageTitle: {
    fontSize: 16, // font-semibold
    fontWeight: '600',
    color: '#111827', // text-gray-900
  },
  languageTitleSelected: {
    color: '#111827',
  },

  // Level Selection - matching web space-y-4 max-w-lg mx-auto
  levelsList: {
    gap: 16, // space-y-4
    maxWidth: 512, // max-w-lg
    width: '100%',
  },
  levelCard: {
    width: '100%',
    padding: 24, // p-6
    borderRadius: 12, // rounded-xl
    borderWidth: 2,
    borderColor: '#E5E7EB', // border-gray-200
    backgroundColor: '#FFFFFF',
  },
  levelCardSelected: {
    borderColor: '#6366f1', // border-primary
    backgroundColor: 'rgba(99, 102, 241, 0.1)', // bg-primary/10
  },
  levelTitle: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
    marginBottom: 8, // mb-2
  },
  levelTitleSelected: {
    color: '#111827',
  },
  levelDescription: {
    fontSize: 16, // text-base
    color: '#6B7280', // text-gray-600
  },
  levelDescriptionSelected: {
    color: '#6B7280',
  },

  // Style Selection - matching web design
  styleCard: {
    width: '100%',
    padding: 24, // p-6
    borderRadius: 12, // rounded-xl
    borderWidth: 2,
    borderColor: '#E5E7EB', // border-gray-200
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center', // flex items-center space-x-4
  },
  styleCardSelected: {
    borderColor: '#6366f1', // border-primary
    backgroundColor: 'rgba(99, 102, 241, 0.1)', // bg-primary/10
  },
  styleIcon: {
    fontSize: 28, // text-3xl
    marginRight: 16, // space-x-4
  },
  styleContent: {
    flex: 1,
  },
  styleTitle: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
    marginBottom: 4, // mb-1
  },
  styleTitleSelected: {
    color: '#111827',
  },
  styleDescription: {
    fontSize: 16, // text-base
    color: '#6B7280', // text-gray-600
  },
  styleDescriptionSelected: {
    color: '#6B7280',
  },

  // Registration Screen - matching web exactly
  errorAlert: {
    borderColor: '#FECACA', // border-red-200
    backgroundColor: '#FEF2F2', // bg-red-50
    marginBottom: 24, // mb-6
  },
  errorAlertText: {
    color: '#B91C1C', // text-red-700
  },
  formSpace: {
    gap: 12, // Reduced from 16 to 12
    maxWidth: 384, // max-w-md
    width: '100%',
  },
  formField: {
    marginBottom: 8, // Reduced from 16 to 8
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4, // Reduced from 6 to 4
  },
  formInput: {
    // Input component handles its own styling
    marginBottom: 0, // Ensure no extra bottom margin
  },
  formInputError: {
    borderColor: '#EF4444', // border-red-500
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#EF4444', // text-red-500
    marginTop: 2, // Reduced from 4 to 2
  },
  registerButton: {
    backgroundColor: '#6366f1', // bg-primary hover:bg-primary/90
    paddingHorizontal: 32, // px-8
    paddingVertical: 12, // py-3
    borderRadius: 9999, // rounded-full
    marginTop: 16, // Reduced from 24 to 16
    width: '100%',
  },
  registerButtonDisabled: {
    opacity: 0.5, // disabled:opacity-50
  },
  registerButtonText: {
    color: '#FFFFFF', // text-white
    fontSize: 16, // font-medium
    fontWeight: '500',
    textAlign: 'center',
  },
  registerButtonTextDisabled: {
    color: '#9CA3AF',
  },

  // Terms section - reduced spacing
  termsSection: {
    marginTop: 16, // Reduced from 24 to 16
    paddingTop: 12, // Reduced from 16 to 12
  },
  termsText: {
    fontSize: 12, // text-xs
    color: '#6B7280', // text-gray-600
    textAlign: 'center',
    lineHeight: 20,
  },
  restoreText: {
    fontSize: 12, // text-xs
    color: '#6B7280', // text-gray-600
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  termsLink: {
    color: '#374151', // text-gray-700
    textDecorationLine: 'underline',
    fontSize: 12, // Ensure same size as termsText
  },
  featuresCard: {
    backgroundColor: '#FFFFFF', // bg-white
    borderRadius: 12, // rounded-xl
    padding: 20, // Reduced from 24 to 20
    marginTop: 16, // Reduced from 24 to 16
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2, // shadow-sm
  },
  featuresTitle: {
    fontSize: 16, // Reduced from 18 to 16
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
    marginBottom: 12, // Reduced from 16 to 12
  },
  featuresSpace: {
    gap: 8, // Reduced from 12 to 8
  },
  featureItem: {
    fontSize: 16, // Reduced from 18 to 16
    color: '#111827', // text-gray-900
    fontWeight: '600', // font-semibold
    lineHeight: 24, // Reduced from 28 to 24
  },

  // Notification Screen
  notificationIconContainer: {
    width: 64, // w-16
    height: 64, // h-16
    borderRadius: 32, // rounded-full
    marginBottom: 16, // mb-4
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)', // bg-primary/10
  },
  notificationEnabled: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // bg-green-100
  },
  notificationDisabled: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)', // bg-yellow-100
  },
  notificationButtonContainer: {
    gap: 12,
    marginBottom: 32,
    width: '100%',
    maxWidth: 384,
  },
  notificationButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 9999,
    width: '100%',
  },
  notificationButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  notificationButtonDisabled: {
    opacity: 0.5,
  },
  notificationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  notificationSkipButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 9999,
    width: '100%',
  },
  notificationSkipButtonText: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Learning Plan Screen
  timelineCard: {
    backgroundColor: '#FFFFFF', // bg-white
    borderRadius: 12, // rounded-xl
    padding: 24, // p-6
    marginBottom: 24, // mb-6
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2, // shadow-sm
    width: '100%',
    maxWidth: 512,
  },
  timelineSpace: {
    gap: 24, // space-y-6
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start', // flex items-start space-x-4
    gap: 16,
  },
  timelineIcon: {
    width: 48, // w-12
    height: 48, // h-12
    borderRadius: 12, // rounded-xl
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4, // shadow-lg
  },
  timelineEmoji: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4, // pt-1
  },
  timelineText: {
    fontSize: 18, // text-lg
    color: '#111827', // text-gray-900
    fontWeight: '600', // font-semibold
    lineHeight: 28, // leading-relaxed
  },

  // Start Free Trial Section
  trialSection: {
    marginTop: 32, // mt-8
    gap: 16, // space-y-4
    width: '100%',
    maxWidth: 384,
  },
  noPaymentContainer: {
    alignItems: 'center',
  },
  noPaymentText: {
    fontSize: 16,
    color: '#374151', // text-gray-700
    fontWeight: '500', // font-medium
  },
  startTrialButton: {
    backgroundColor: '#6366f1', // bg-primary hover:bg-primary/90
    paddingHorizontal: 32, // px-8
    paddingVertical: 12, // py-3
    borderRadius: 9999, // rounded-full
    width: '100%',
  },
  startTrialButtonText: {
    color: '#FFFFFF', // text-white
    fontSize: 16, // font-medium
    fontWeight: '500',
    textAlign: 'center',
  },
  trialPriceContainer: {
    alignItems: 'center',
    marginTop: 12, // mt-3
  },
  trialPriceText: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-500
  },

  // Payment Screen - Stripe Integration Styles
  loadingContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  errorButtonsContainer: {
    gap: 12,
    marginTop: 24,
    width: '100%',
    maxWidth: 384,
  },
  errorButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 9999,
    width: '100%',
  },
  errorButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorButtonSecondaryText: {
    color: '#6366f1',
  },
  paymentPlanCard: {
    backgroundColor: '#EFF6FF', // bg-blue-50
    borderRadius: 12, // rounded-xl
    padding: 16, // p-4
    marginBottom: 24, // mb-6
    width: '100%',
  },
  paymentPlanHeader: {
    marginBottom: 12,
  },
  paymentPlanTitle: {
    fontSize: 20,
    color: '#6366f1',
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentPlanTrial: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  paymentPlanPrice: {
    fontSize: 24,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentPlanCancel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  paymentPlanFeatures: {
    gap: 4,
  },
  paymentPlanFeature: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  stripeFormContainer: {
    gap: 24,
    width: '100%',
  },
  cardFieldContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  cardFieldWrapper: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stripeButtonContainer: {
    marginTop: 8,
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  cardFieldStyle: {
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  stripeSubmitButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 9999,
    width: '100%',
  },
  stripeSubmitButtonDisabled: {
    opacity: 0.5,
  },
  stripeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripeSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  stripeSubmitButtonTextDisabled: {
    color: '#9CA3AF',
  },
  stripeTermsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // FIXED: New styles for payment screen keyboard avoiding view and scroll
  paymentKeyboardContainer: {
    flex: 1,
    width: '100%',
  },
  paymentScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingTop: 24,
  },
  paymentScreenContent: {
    flex: 1,
    maxWidth: 384,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },

  // Testimonials - mirrors web layout
  testimonialCarousel: {
    width: '100%',
    maxWidth: 512,
    alignSelf: 'center',
    marginBottom: 24,
  },
  testimonialSlide: {
    paddingHorizontal: 16,
  },
  testimonialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  testimonialStarsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  testimonialText: {
    color: '#374151',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  testimonialUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialAvatarText: {
    fontWeight: '600',
    fontSize: 12,
  },
  testimonialUserName: {
    color: '#111827',
    fontWeight: '600',
  },
  testimonialUserTitle: {
    color: '#6B7280',
    fontSize: 12,
  },
  testimonialNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  testimonialDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testimonialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  testimonialDotActive: {
    width: 24,
    backgroundColor: '#6366f1',
  },
  testimonialArrowButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  testimonialContinueButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 9999,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 384,
  },
  testimonialContinueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default styles;