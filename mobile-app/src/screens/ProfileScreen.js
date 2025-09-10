import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

export default function ProfileScreen({ route, navigation }) {
  const { user } = route.params;
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = 'http://localhost:5000';

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            // Navigate back to login screen
            // This will be handled by parent component
            Alert.alert('Success', 'Signed out successfully!');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your progress will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: showPasswordConfirmation
        }
      ]
    );
  };

  const showPasswordConfirmation = () => {
    Alert.prompt(
      'Confirm Password',
      'Please enter your password to confirm account deletion:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: (password) => deleteAccountWithPassword(password)
        }
      ],
      'secure-text'
    );
  };

  const deleteAccountWithPassword = async (password) => {
    if (!password) {
      Alert.alert('Error', 'Password is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
        // Navigate back to login
      } else {
        Alert.alert('Error', data.message || 'Failed to delete account');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server. Please try again.');
      console.error('Account deletion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationSettings = () => {
    Alert.alert('Coming Soon', 'Notification settings will be implemented next!');
  };

  const handleLanguageSettings = () => {
    Alert.alert('Coming Soon', 'Language settings will be implemented next!');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.firstName?.charAt(0)?.toUpperCase() || '👤'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Learning Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📚 Learning Statistics</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Current Language:</Text>
          <Text style={styles.statValue}>{user?.selectedLanguage || 'Italian'}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Level:</Text>
          <Text style={styles.statValue}>{user?.selectedLevel || 'Beginner'}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Joined:</Text>
          <Text style={styles.statValue}>
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
          </Text>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚙️ Settings</Text>
        
        <TouchableOpacity style={styles.settingButton} onPress={handleNotificationSettings}>
          <Text style={styles.settingText}>🔔 Notification Preferences</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingButton} onPress={handleLanguageSettings}>
          <Text style={styles.settingText}>🌍 Language & Level</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingText}>📈 Progress Export</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👤 Account</Text>
        
        <TouchableOpacity style={styles.settingButton} onPress={handleLogout}>
          <Text style={[styles.settingText, styles.logoutText]}>🚪 Sign Out</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingButton} 
          onPress={handleDeleteAccount}
          disabled={isLoading}
        >
          <Text style={[styles.settingText, styles.deleteText]}>
            {isLoading ? '⏳ Deleting...' : '🗑️ Delete Account'}
          </Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ℹ️ About</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>App Version:</Text>
          <Text style={styles.statValue}>1.0.0</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Platform:</Text>
          <Text style={styles.statValue}>LingoToday Mobile</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
  },
  settingArrow: {
    fontSize: 18,
    color: '#9ca3af',
  },
  logoutText: {
    color: '#f59e0b',
  },
  deleteText: {
    color: '#ef4444',
  },
});