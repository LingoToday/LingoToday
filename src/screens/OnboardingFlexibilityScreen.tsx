import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from '../styles/OnboardingStyles';

const flexibilityImage = require('../../attached_assets/Flexibility_Messaging__1770935348200.png');

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
