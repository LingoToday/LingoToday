import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  useWindowDimensions,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { theme } from '../lib/theme';
import { Card, CardContent } from '../components/ui/Card';

const SECRET_TAP_COUNT = 5;
const SECRET_TAP_TIMEOUT = 3000;
const HEYGEN_API_KEY_STORAGE_KEY = 'heygen_api_key';

type NavigationProp = NativeStackNavigationProp<any>;

export default function AIChatScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;
  
  const containerPadding = 40;
  const imageGap = 12;
  const numColumns = 2;
  const totalMargins = numColumns * imageGap;
  
  const imageSize = isSmallScreen 
    ? (width - containerPadding - totalMargins) / numColumns 
    : 160;

  const [tapCount, setTapCount] = useState(0);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isAvatarEnabled, setIsAvatarEnabled] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const aiPartners = [
    { id: 1, image: require('../../assets/ai-partner-1.jpg') },
    { id: 2, image: require('../../assets/ai-partner-2.jpg') },
    { id: 3, image: require('../../assets/ai-partner-3.png') },
    { id: 4, image: require('../../assets/ai-partner-4.png') },
    { id: 5, image: require('../../assets/ai-partner-5.png') },
    { id: 6, image: require('../../assets/ai-partner-6.png') },
  ];

  const handleSecretTap = async () => {
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);

    if (newTapCount >= SECRET_TAP_COUNT) {
      setTapCount(0);
      
      const storedKey = await SecureStore.getItemAsync(HEYGEN_API_KEY_STORAGE_KEY);
      if (storedKey) {
        setIsAvatarEnabled(true);
        Alert.alert(
          'AI Avatar Mode',
          'Secret mode activated! You can now test the AI Avatar feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Start Session', 
              onPress: () => navigation.navigate('AIAvatar', {
                language: 'Italian',
                level: 'beginner',
                courseTitle: 'Essential Greetings',
                lessonTitle: 'Hello and Goodbye',
                reviewPhrases: ['Ciao', 'Buongiorno', 'Arrivederci'],
              })
            },
            {
              text: 'Reset API Key',
              onPress: () => setShowApiKeyModal(true),
            }
          ]
        );
      } else {
        setShowApiKeyModal(true);
      }
    } else {
      tapTimeoutRef.current = setTimeout(() => {
        setTapCount(0);
      }, SECRET_TAP_TIMEOUT);
    }
  };

  const saveApiKey = async () => {
    const keyToSave = apiKeyInput.trim();
    
    if (!keyToSave) {
      Alert.alert('Error', 'Please enter a valid HeyGen API key.');
      return;
    }
    
    try {
      await SecureStore.setItemAsync(HEYGEN_API_KEY_STORAGE_KEY, keyToSave);
      setShowApiKeyModal(false);
      setApiKeyInput('');
      setIsAvatarEnabled(true);
      
      Alert.alert(
        'Success',
        'API key saved! You can now use the AI Avatar feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Start Session', 
            onPress: () => navigation.navigate('AIAvatar', {
              language: 'Italian',
              level: 'beginner',
              courseTitle: 'Essential Greetings',
              lessonTitle: 'Hello and Goodbye',
              reviewPhrases: ['Ciao', 'Buongiorno', 'Arrivederci'],
            })
          }
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to save API key. Please try again.');
    }
  };

  const renderPartnerImage = (partner: { id: number; image: any }, isFirstImage: boolean) => {
    const imageContent = (
      <View 
        key={partner.id} 
        style={[
          styles.imageWrapper,
          { 
            width: imageSize, 
            height: imageSize,
            marginHorizontal: imageGap / 2,
          }
        ]}
      >
        <Image
          source={partner.image}
          style={styles.partnerImage}
          resizeMode="cover"
        />
      </View>
    );

    if (isFirstImage) {
      return (
        <TouchableOpacity 
          key={partner.id} 
          onPress={handleSecretTap}
          activeOpacity={0.9}
        >
          {imageContent}
        </TouchableOpacity>
      );
    }

    return imageContent;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Card>
            <CardContent>
              <Text style={styles.title}>
                Coming Soon - Choose Your AI Language Partner
              </Text>
              
              <Text style={styles.subtitle}>
                Pick your perfect learning partner for your daily lessons - and talk to them in real conversations!
              </Text>

              <View style={styles.imageGrid}>
                <View style={styles.imageRow}>
                  {aiPartners.slice(0, 2).map((partner, index) => 
                    renderPartnerImage(partner, index === 1)
                  )}
                </View>

                <View style={styles.imageRow}>
                  {aiPartners.slice(2, 4).map((partner) => 
                    renderPartnerImage(partner, false)
                  )}
                </View>

                <View style={styles.imageRow}>
                  {aiPartners.slice(4, 6).map((partner) => 
                    renderPartnerImage(partner, false)
                  )}
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      <Modal
        visible={showApiKeyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowApiKeyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>AI Avatar Setup</Text>
            <Text style={styles.modalSubtitle}>
              Enter your HeyGen API key to enable the AI Avatar feature.
              You can find your API key at app.heygen.com/settings.
            </Text>
            
            <TextInput
              style={styles.apiKeyInput}
              placeholder="HeyGen API Key (required)"
              placeholderTextColor={theme.colors.mutedForeground}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowApiKeyModal(false);
                  setApiKeyInput('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveApiKey}
              >
                <Text style={styles.saveButtonText}>Save & Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  imageGrid: {
    width: '100%',
    alignItems: 'center',
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  imageWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceVariant,
  },
  partnerImage: {
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.card || '#1a2235',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
    marginBottom: 20,
    lineHeight: 20,
  },
  apiKeyInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: theme.colors.foreground,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.mutedForeground,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
