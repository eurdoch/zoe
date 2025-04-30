import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Card, Layout, Button } from '@ui-kitten/components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { AuthenticationError } from '../errors/NetworkError';
import { showToastError } from '../utils';
import * as RNIap from 'react-native-iap';

interface User {
  user_id?: string;
  name: string;
  email: string;
  premium?: boolean;
  created_at?: string;
  last_login?: string;
}

const SUBSCRIPTION_ID = 'kallos_premium';

const ProfileScreen = ({ navigation }: { navigation: any }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Authentication error handler
  const handleAuthError = useCallback(async (error: AuthenticationError) => {
    console.log('Authentication error detected:', error);
    showToastError('Authentication failed. Please log in again.');
    
    // Remove token and user from AsyncStorage
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      console.log('Token and user removed from AsyncStorage');
      
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (storageError) {
      console.error('Error removing data from storage:', storageError);
      showToastError('Error logging out. Please restart the app.');
    }
  }, [navigation]);

  // Initialize IAP connection
  useEffect(() => {
    // Connect to IAP service
    const initializeIAP = async () => {
      try {
        await RNIap.initConnection();
        console.log('IAP connection established');
      } catch (error) {
        console.error('Failed to establish IAP connection:', error);
      }
    };
    
    initializeIAP();
    
    // Clean up IAP connection on unmount
    return () => {
      RNIap.endConnection();
    };
  }, []);
  
  // Function to handle subscription purchase
  const handleSubscribe = async () => {
    if (!user) return;
    
    setPurchaseLoading(true);
    try {
      // Request subscriptions
      const products = await RNIap.getSubscriptions({ skus: [SUBSCRIPTION_ID] });
      if (products.length === 0) {
        throw new Error('No subscription products available');
      }
      
      // Purchase subscription
      const purchase = await RNIap.requestSubscription({ 
        sku: SUBSCRIPTION_ID,
        andDangerouslyFinishTransactionAutomaticallyIOS: false
      });
      
      // Update user status on the server
      const token = await AsyncStorage.getItem('token');
      if (token && purchase) {
        // Get receipt based on platform
        const receipt = typeof purchase === 'object' && 'transactionReceipt' in purchase
          ? purchase.transactionReceipt 
          : Array.isArray(purchase) && purchase.length > 0 && 'transactionReceipt' in purchase[0]
            ? purchase[0].transactionReceipt
            : '';
            
        const response = await fetch(`${API_BASE_URL}/verify/upgrade`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            receipt: receipt,
            productId: SUBSCRIPTION_ID
          })
        });
        
        if (response.ok) {
          const updatedUser = await response.json();
          setUser(updatedUser);
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Finish the transaction
          if (Platform.OS === 'ios' && typeof purchase === 'object' && 'transactionId' in purchase) {
            await RNIap.finishTransaction({ purchase, isConsumable: false });
          }
          
          Alert.alert('Success', 'Your subscription is now active!');
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Subscription Failed', 'There was an error processing your subscription. Please try again later.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First try to fetch from API
        const token = await AsyncStorage.getItem('token');
        
        if (token) {
          // Make API request to fetch user data
          const response = await fetch(`${API_BASE_URL}/verify/user`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            // Update local storage with the latest user data
            await AsyncStorage.setItem('user', JSON.stringify(userData));
          } else if (response.status === 401 || response.status === 403) {
            // Handle authentication errors explicitly
            throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
          } else {
            // If API call fails for other reasons, fall back to local storage
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
              setUser(JSON.parse(userData));
            }
          }
        } else {
          // No token, try local storage
          const userData = await AsyncStorage.getItem('user');
          if (userData) {
            setUser(JSON.parse(userData));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else {
          // If network error, try local storage as fallback
          try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
              console.log('userData: ', userData);
              setUser(JSON.parse(userData));
            }
          } catch (localError) {
            console.error('Error loading local user data:', localError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [handleAuthError]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3366FF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Layout style={styles.profileContainer}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
          </View>
          
          {user.premium !== undefined && (
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Account Type</Text>
              <Text style={styles.value}>{user.premium ? 'Premium' : 'Free'}</Text>
            </View>
          )}

          {user.created_at && (
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Member Since</Text>
              <Text style={styles.value}>
                {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}

          {user.last_login && (
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Last Login</Text>
              <Text style={styles.value}>
                {new Date(user.last_login).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {!user.premium && (
            <View style={styles.subscriptionContainer}>
              <Button
                status="primary"
                onPress={handleSubscribe}
                disabled={purchaseLoading}
                accessoryLeft={purchaseLoading ? (props) => <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
              >
                {purchaseLoading ? 'Processing...' : 'Upgrade to Premium'}
              </Button>
            </View>
          )}
        </Card>
      </Layout>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8F9BB3',
  },
  profileContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 8,
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#8F9BB3',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  subscriptionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EDF1F7',
  },
});

export default ProfileScreen;
