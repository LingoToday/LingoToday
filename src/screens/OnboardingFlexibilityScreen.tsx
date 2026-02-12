import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from '../styles/OnboardingStyles';

const flexibilityImage = require('../../attached_assets/Gemini_Generated_Image_9i25319i25319i25_1770927201736.png');

const OnboardingFlexibilityScreen = () => (
  <View style={styles.screenContent}>
    <Image
      source={flexibilityImage}
      style={styles.flexibilityImage}
      resizeMode="cover"
    />
    <Text style={styles.flexibilityText}>
      Life can be hectic, right? That's why LingoToday fits perfectly into your routine. You choose when to learn, and we help you make the most of every minute.
    </Text>
  </View>
);

export default OnboardingFlexibilityScreen;
