import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { theme } from '../lib/theme';
import { Card, CardContent } from '../components/ui/Card';

export default function AIChatScreen() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;
  
  const containerPadding = 40;
  const imageGap = 12;
  const numColumns = 2;
  const totalMargins = numColumns * imageGap;
  
  const imageSize = isSmallScreen 
    ? (width - containerPadding - totalMargins) / numColumns 
    : 160;

  const aiPartners = [
    { id: 1, image: require('../../assets/ai-partner-1.jpg') },
    { id: 2, image: require('../../assets/ai-partner-2.jpg') },
    { id: 3, image: require('../../assets/ai-partner-3.png') },
    { id: 4, image: require('../../assets/ai-partner-4.png') },
    { id: 5, image: require('../../assets/ai-partner-5.png') },
    { id: 6, image: require('../../assets/ai-partner-6.png') },
  ];

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
                  {aiPartners.slice(0, 2).map((partner) => (
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
                  ))}
                </View>

                <View style={styles.imageRow}>
                  {aiPartners.slice(2, 4).map((partner) => (
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
                  ))}
                </View>

                <View style={styles.imageRow}>
                  {aiPartners.slice(4, 6).map((partner) => (
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
                  ))}
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
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
    backgroundColor: '#E5E7EB',
  },
  partnerImage: {
    width: '100%',
    height: '100%',
  },
});
