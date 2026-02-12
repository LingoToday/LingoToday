import { StyleSheet, TextStyle } from 'react-native';
import { theme } from '../lib/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // Clean white background
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    maxWidth: 512,
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    width: '100%',
  },

  // Progress bar
  progressSection: {
    marginBottom: theme.spacing.xxl,
  },
  progressBackground: {
    width: '100%',
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.full,
    height: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.sm,
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
    transform: [{ translateX: theme.spacing.lg }],
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },

  // Continue button
  continueSection: {
    marginTop: theme.spacing.xxl,
    alignItems: 'center',
    minHeight: 80,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    minWidth: 140,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.muted,
    borderWidth: 2,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
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
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.base,
    fontWeight: "600" as TextStyle["fontWeight"],
  },
  continueButtonTextDisabled: {
    color: theme.colors.mutedForeground,
  },
  continueButtonIcon: {
    marginLeft: theme.spacing.sm,
  },
  continueHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.md,
    textAlign: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius['2xl'],
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },

  // Screen Content
  screenContent: {
    alignItems: 'center',
    flex: 1,
  },
  screenTitle: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: "700" as TextStyle["fontWeight"],
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  screenSubtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
    lineHeight: theme.lineHeight.lg,
  },

  // Language Selection
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.lg,
    maxWidth: 384,
    width: '100%',
  },
  languageCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    width: '47%',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  languageCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  languageFlag: {
    fontSize: theme.fontSize['4xl'],
    marginBottom: theme.spacing.sm,
  },
  languageTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: "600" as TextStyle["fontWeight"],
    color: theme.colors.foreground,
  },
  languageTitleSelected: {
    color: theme.colors.foreground,
  },

  // Level Selection
  levelsList: {
    gap: theme.spacing.lg,
    maxWidth: 512,
    width: '100%',
  },
  levelCard: {
    width: '100%',
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  levelCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  levelTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: "700" as TextStyle["fontWeight"],
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  levelTitleSelected: {
    color: theme.colors.foreground,
  },
  levelDescription: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  levelDescriptionSelected: {
    color: theme.colors.mutedForeground,
  },

  // Style Selection
  styleCard: {
    width: '100%',
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
  },
  styleCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  styleIcon: {
    fontSize: theme.fontSize['2.5xl'],
    marginRight: theme.spacing.lg,
  },
  styleContent: {
    flex: 1,
  },
  styleTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: "700" as TextStyle["fontWeight"],
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  styleTitleSelected: {
    color: theme.colors.foreground,
  },
  styleDescription: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  styleDescriptionSelected: {
    color: theme.colors.mutedForeground,
  },

  // Age Selection
  ageCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%',
    borderWidth: 2,
    borderColor: theme.colors.border,
    minHeight: 80,
  },
  ageCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  ageLabel: {
    fontSize: theme.fontSize.xl,
    fontWeight: "700" as TextStyle["fontWeight"],
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  ageLabelSelected: {
    color: theme.colors.foreground,
  },

  // Gender Selection
  genderCard: {
    width: '100%',
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  genderEmoji: {
    fontSize: theme.fontSize['2.5xl'],
    marginRight: theme.spacing.lg,
  },
  genderLabel: {
    fontSize: theme.fontSize.xl,
    fontWeight: "600" as TextStyle["fontWeight"],
    color: theme.colors.foreground,
  },
  genderLabelSelected: {
    color: theme.colors.foreground,
  },

  // Current Language Level (single column list)
  currentLevelGrid: {
    gap: theme.spacing.md,
    maxWidth: 512,
    width: '100%',
  },
  currentLevelCard: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  currentLevelCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  currentLevelLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600" as TextStyle["fontWeight"],
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  currentLevelLabelSelected: {
    color: theme.colors.foreground,
  },
  currentLevelContinueSection: {
    marginTop: theme.spacing.xxl,
    alignItems: 'center',
    width: '100%',
  },

  // Registration Screen
  errorAlert: {
    borderColor: theme.colors.errorContainer,
    backgroundColor: theme.colors.errorContainer,
    marginBottom: theme.spacing.xl,
  },
  errorAlertText: {
    color: theme.colors.onErrorContainer,
  },
  formSpace: {
    gap: theme.spacing.md,
    maxWidth: 384,
    width: '100%',
  },
  formField: {
    marginBottom: theme.spacing.sm,
  },
  formLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500" as TextStyle["fontWeight"],
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  formInput: {
    marginBottom: 0,
  },
  formInputError: {
    borderColor: theme.colors.error,
  },
  fieldErrorText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xxs,
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.base,
    fontWeight: "500" as TextStyle["fontWeight"],
    textAlign: 'center',
  },
  registerButtonTextDisabled: {
    color: theme.colors.mutedForeground,
  },

  // Terms section
  termsSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  termsText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: theme.lineHeight.sm,
  },
  restoreText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: theme.lineHeight.sm,
    marginTop: theme.spacing.sm,
  },
  termsLink: {
    color: theme.colors.foreground,
    textDecorationLine: 'underline',
    fontSize: theme.fontSize.xs,
  },
  featuresCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: "700" as TextStyle["fontWeight"],
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  featuresSpace: {
    gap: theme.spacing.sm,
  },
  featureItem: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: theme.lineHeight.md,
  },

  // Notification Screen
  notificationIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary50,
  },
  notificationEnabled: {
    backgroundColor: theme.colors.success50,
  },
  notificationDisabled: {
    backgroundColor: theme.colors.warning50,
  },
  notificationButtonContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xxl,
    width: '100%',
    maxWidth: 384,
  },
  notificationButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    width: '100%',
  },
  notificationButtonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.lg,
    fontWeight: "500" as TextStyle["fontWeight"],
    textAlign: 'center',
  },
  notificationButtonDisabled: {
    opacity: 0.5,
  },
  notificationButtonTextDisabled: {
    color: theme.colors.mutedForeground,
  },
  notificationSkipButton: {
    backgroundColor: theme.colors.transparent,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    width: '100%',
  },
  notificationSkipButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.lg,
    fontWeight: "500" as TextStyle["fontWeight"],
    textAlign: 'center',
  },

  // Learning Plan Screen
  timelineCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    width: '100%',
    maxWidth: 512,
  },
  timelineSpace: {
    gap: theme.spacing.xl,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.lg,
  },
  timelineIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timelineEmoji: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.primaryForeground,
    fontWeight: "700" as TextStyle["fontWeight"],
  },
  timelineContent: {
    flex: 1,
    paddingTop: theme.spacing.xs,
  },
  timelineText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.foreground,
    fontWeight: "600" as TextStyle["fontWeight"],
    lineHeight: theme.lineHeight.lg,
  },

  // Start Free Trial Section
  trialSection: {
    marginTop: theme.spacing.xxl,
    gap: theme.spacing.lg,
    width: '100%',
    maxWidth: 384,
  },
  noPaymentContainer: {
    alignItems: 'center',
  },
  noPaymentText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    fontWeight: "500" as TextStyle["fontWeight"],
  },
  startTrialButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    width: '100%',
  },
  startTrialButtonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.base,
    fontWeight: "500" as TextStyle["fontWeight"],
    textAlign: 'center',
  },
  trialPriceContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  trialPriceText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },

  // Payment Screen - Stripe Integration Styles
  loadingContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.md,
  },
  errorButtonsContainer: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
    width: '100%',
    maxWidth: 384,
  },
  errorButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    width: '100%',
  },
  errorButtonSecondary: {
    backgroundColor: theme.colors.transparent,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  errorButtonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.base,
    fontWeight: "500" as TextStyle["fontWeight"],
    textAlign: 'center',
  },
  errorButtonSecondaryText: {
    color: theme.colors.primary,
  },
  paymentPlanCard: {
    backgroundColor: theme.colors.primary50,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    width: '100%',
  },
  paymentPlanHeader: {
    marginBottom: theme.spacing.md,
  },
  paymentPlanTitle: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.primary,
    fontWeight: "700" as TextStyle["fontWeight"],
    marginBottom: theme.spacing.xs,
  },
  paymentPlanTrial: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  paymentPlanPrice: {
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.foreground,
    fontWeight: "700" as TextStyle["fontWeight"],
    marginBottom: theme.spacing.xs,
  },
  paymentPlanCancel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.md,
  },
  paymentPlanFeatures: {
    gap: theme.spacing.xs,
  },
  paymentPlanFeature: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    lineHeight: theme.lineHeight.sm,
  },
  stripeFormContainer: {
    gap: theme.spacing.xl,
    width: '100%',
  },
  cardFieldContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardFieldLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: "600" as TextStyle["fontWeight"],
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  cardFieldWrapper: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  stripeButtonContainer: {
    marginTop: theme.spacing.sm,
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  cardFieldStyle: {
    backgroundColor: theme.colors.card,
    fontSize: theme.fontSize.base,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
  },
  stripeSubmitButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
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
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.lg,
    fontWeight: "600" as TextStyle["fontWeight"],
    textAlign: 'center',
  },
  stripeSubmitButtonTextDisabled: {
    color: theme.colors.mutedForeground,
  },
  stripeTermsText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  
  // FIXED: New styles for payment screen keyboard avoiding view and scroll
  paymentKeyboardContainer: {
    flex: 1,
    width: '100%',
  },
  paymentScrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  paymentScreenContent: {
    flex: 1,
    maxWidth: 384,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },

  // Testimonials
  testimonialCarousel: {
    width: '100%',
    maxWidth: 512,
    alignSelf: 'center',
    marginBottom: theme.spacing.xl,
  },
  testimonialSlide: {
    paddingHorizontal: theme.spacing.lg,
  },
  testimonialCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  testimonialStarsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  testimonialText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.md,
    marginBottom: theme.spacing.lg,
  },
  testimonialUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialAvatarText: {
    fontWeight: "600" as TextStyle["fontWeight"],
    fontSize: theme.fontSize.xs,
  },
  testimonialUserName: {
    color: theme.colors.foreground,
    fontWeight: "600" as TextStyle["fontWeight"],
  },
  testimonialUserTitle: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
  },
  testimonialNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  testimonialDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  testimonialDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.border,
  },
  testimonialDotActive: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  testimonialArrowButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  testimonialContinueButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 384,
  },
  testimonialContinueButtonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.base,
    fontWeight: "500" as TextStyle["fontWeight"],
    textAlign: 'center',
  },
  
  // IAP Specific Styles
  errorContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "600" as TextStyle["fontWeight"],
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: theme.lineHeight.sm,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.base,
    fontWeight: "600" as TextStyle["fontWeight"],
  },
  iapPackageCard: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  iapPackagePrice: {
    fontSize: theme.fontSize['4xl'],
    fontWeight: "700" as TextStyle["fontWeight"],
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  iapPackageDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  restorePurchasesButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  restorePurchasesText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: "500" as TextStyle["fontWeight"],
    textDecorationLine: 'underline',
  },
  packageOption: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  packageOptionSelected: {
    borderColor: theme.colors.success500,
    borderWidth: 3,
    backgroundColor: theme.colors.card,
  },
  packageOptionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  packageRadio: {
    width: 20,
    height: 20,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.md,
    marginTop: theme.spacing.xxs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
  },
  packageDetails: {
    flex: 1,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  packageTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: "600" as TextStyle["fontWeight"],
    color: theme.colors.foreground,
    marginRight: theme.spacing.sm,
  },
  trialBadge: {
    backgroundColor: theme.colors.success500,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.xl,
  },
  trialBadgeText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.xxs,
    fontWeight: "600" as TextStyle["fontWeight"],
    textTransform: 'uppercase',
  },
  packagePrice: {
    fontSize: theme.fontSize.xl,
    fontWeight: "700" as TextStyle["fontWeight"],
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  packageDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: theme.lineHeight.xs,
  },
});

export default styles;