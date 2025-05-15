import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform, TouchableOpacity, FlatList } from 'react-native';
import { Card, Layout, Button, Text as KittenText } from '@ui-kitten/components';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../config';
import { AuthenticationError } from '../errors/NetworkError';
import { showToastError } from '../utils';
import { updatePremiumStatus } from '../network/user';
import CustomModal from '../CustomModal';
import {
  initConnection,
  getSubscriptions,
  getProducts,
  requestSubscription,
  getAvailablePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  SubscriptionPurchase,
  Subscription,
} from 'react-native-iap';

// Type for the UI-Kitten props parameter
type KittenProps = {
  style?: any;
  [key: string]: any;
};

// Import the User type instead of defining it locally
import UserType from '../types/User';

const SUBSCRIPTION_ID = 'kallos_premium';

const ProfileScreen = ({ navigation }: { navigation: any }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    initConnection().then(() => {
      getSubscriptions({ skus: [SUBSCRIPTION_ID] })
        .then((products) => { 
          console.log(products);
          setSubscriptions(products);
        })
        .catch(err => {
          console.error("Could not get subscriptions: ", err);
        });
    })
    .catch(err => {
      console.error("Could not connect to store: ", err);
    });
  }, []);

  // Set up purchase listeners
  useEffect(() => {
    // Purchase listener
    const purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
      console.log('Purchase updated:', purchase);
      
      // Process the purchase (validate receipt with backend, etc)
      // For this example, we're just finishing the transaction
      if (purchase.productId === SUBSCRIPTION_ID) {
        try {
          const receipt = purchase.transactionReceipt ? purchase.transactionReceipt : '';
          
          if (receipt) {
            // Send the receipt to the backend for validation and status update
            console.log('Transaction receipt:', receipt);
            
            try {
              // Get the auth token
              const token = await AsyncStorage.getItem('token');
              
              if (!token) {
                throw new Error('Authentication token not found');
              }
              
              // Send receipt to backend and update premium status
              const currentPlatform = Platform.OS as 'ios' | 'android';
              const updatedUser = await updatePremiumStatus(token, receipt, currentPlatform);
              
              // Update local user object with response from backend
              if (updatedUser) {
                setUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('Premium status updated on backend:', updatedUser.premium);
              }
              
              // Acknowledge the purchase
              await finishTransaction({ purchase, isConsumable: false });
              console.log('Transaction finished');
              
              // Show success message
              Alert.alert(
                'Subscription Activated',
                'Thank you for subscribing to Kallos Premium!',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error updating premium status on backend:', error);
              
              // If backend validation fails, still update locally but show warning
              const updatedUser: UserType | null = user ? { ...user, premium: true } : null;
              if (updatedUser) {
                setUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
              }
              
              // Acknowledge the purchase even if backend update fails
              await finishTransaction({ purchase, isConsumable: false });
              
              // Show warning that backend sync failed
              Alert.alert(
                'Subscription Activated',
                'Your subscription has been activated, but there was an issue syncing with our servers. Your premium features will work, but you may need to restart the app.',
                [{ text: 'OK' }]
              );
            }
          }
        } catch (error) {
          console.error('Error processing purchase:', error);
          showToastError('Failed to process subscription. Please contact support.');
        }
      }
    });

    // Error listener
    const purchaseErrorSubscription = purchaseErrorListener((error) => {
      console.error('Purchase error:', error);
      
      // Handle specific error cases
      if (error.code === 'E_USER_CANCELLED') {
        console.log('User cancelled the purchase');
      } else {
        showToastError('Subscription error. Please try again later.');
      }
      
      setPurchaseLoading(false);
    });

    // Clean up listeners when component unmounts
    return () => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
    };
  }, [user]);

  const handleSubscriptionSelect = async (subscription: Subscription) => {
    console.log('Selected subscription:', subscription);
    setModalVisible(false);
    setPurchaseLoading(true);
    
    try {
      const productId = subscription.productId;
      const offerToken = Platform.OS === 'android' && 'subscriptionOfferDetails' in subscription
        ? subscription.subscriptionOfferDetails?.[0]?.offerToken 
        : '';
      
      console.log(`Requesting subscription for product ID: ${productId}`);
      
      // Normal production flow
      // For Android, we need to pass the offerToken
      if (Platform.OS === 'android' && offerToken) {
        await requestSubscription({
          sku: productId,
          andDangerouslyFinishTransactionAutomaticallyIOS: false,
          subscriptionOffers: [{ sku: productId, offerToken }]
        });
      } else {
        // For iOS - handle Apple ID login requirement
        try {
          await requestSubscription({
            sku: productId,
            andDangerouslyFinishTransactionAutomaticallyIOS: false
          });
        } catch (iosError: any) {
          // Check if error is related to authentication
          if (iosError.message && 
             (iosError.message.includes('login') || 
              iosError.message.includes('authentication') || 
              iosError.message.includes('sign in'))) {
            console.log('User needs to log in to Apple ID');
            Alert.alert(
              'Apple ID Required',
              'Please sign in with your Apple ID to complete this purchase.',
              [{ text: 'OK' }]
            );
          } else {
            // Re-throw other errors to be caught by the outer catch block
            throw iosError;
          }
        }
      }
      
      // Subscription request initiated successfully
      console.log('Subscription requested successfully');
      // The actual purchase completion is handled in the purchaseUpdatedListener
      
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      showToastError('Failed to purchase subscription. Please try again.');
    } finally {
      setPurchaseLoading(false);
    }
  };

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First try to fetch from API
        const token = await AsyncStorage.getItem('token');
        
        if (token) {
          // Make API request to fetch user data
          const baseUrl = await getApiBaseUrl();
          const response = await fetch(`${baseUrl}/verify/user`, {
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
          
          <View style={styles.buttonContainer}>
            <LinearGradient
              colors={['#444444', '#222222']}
              style={styles.gradientContainer}
            >
              <Button
                appearance="filled"
                size="large"
                onPress={() => navigation.navigate('PrivacyPolicy')}
                style={[styles.menuButton, { backgroundColor: 'transparent' }]}
              >
                {(evaProps: KittenProps) => <KittenText {...evaProps} style={styles.buttonText}>Privacy Policy</KittenText>}
              </Button>
            </LinearGradient>
          </View>
          
          {!user.premium && (
            <View style={styles.buttonContainer}>
              <LinearGradient
                colors={['#3366FF', '#1144CC']}
                style={styles.gradientContainer}
              >
                <Button
                  appearance="filled"
                  size="large"
                  onPress={() => setModalVisible(true)}
                  disabled={purchaseLoading}
                  style={[styles.menuButton, { backgroundColor: 'transparent' }]}
                  accessoryLeft={purchaseLoading ? (props) => <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
                >
                  {(evaProps: KittenProps) => (
                    <KittenText {...evaProps} style={styles.buttonText}>
                      {purchaseLoading ? 'Processing...' : 'Upgrade to Premium'}
                    </KittenText>
                  )}
                </Button>
              </LinearGradient>
            </View>
          )}
        </Card>
      </Layout>

      <CustomModal visible={modalVisible} setVisible={setModalVisible}>
        <View>
          <Text style={styles.modalTitle}>Choose a Subscription</Text>
          {subscriptions.length === 0 ? (
            <Text>No subscription options available</Text>
          ) : (
            <FlatList
              data={subscriptions}
              keyExtractor={(item) => item.productId}
              renderItem={({ item }) => (
                <View style={styles.modalButtonContainer}>
                  <LinearGradient
                    colors={['#3366FF', '#1144CC']}
                    style={styles.gradientContainer}
                  >
                    <Button
                      appearance="filled"
                      size="large"
                      onPress={() => handleSubscriptionSelect(item)}
                      style={[styles.menuButton, { backgroundColor: 'transparent' }]}
                    >
                      {(evaProps: KittenProps) => (
                        <View style={{ alignItems: 'center', width: '100%' }}>
                          <KittenText {...evaProps} style={styles.buttonText}>
                            {Platform.OS === 'ios' 
                              ? ('title' in item ? item.title : 'Kallos Premium') 
                              : ('name' in item ? item.name : 'Kallos Premium')}
                          </KittenText>
                          
                          {Platform.OS === 'ios' ? (
                            <>
                              <Text style={styles.subscriptionPrice}>
                                {'localizedPrice' in item ? item.localizedPrice : '$4.99/month'}
                              </Text>
                              {'introductoryPrice' in item && item.introductoryPrice === "$0.00" && (
                                <Text style={styles.trialText}>
                                  {`${'introductoryPriceNumberOfPeriodsIOS' in item ? item.introductoryPriceNumberOfPeriodsIOS : '14'}-day free trial`}
                                </Text>
                              )}
                              <Text style={styles.subscriptionDescription}>
                                {'description' in item ? item.description : 'Premium subscription to Kallos'}
                              </Text>
                            </>
                          ) : (
                            <>
                              <Text style={[styles.androidSubscriptionText, { color: 'white' }]}>
                                {'subscriptionOfferDetails' in item && item.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice === 'Free'
                                  ? `2-week free trial, then ${item.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[1]?.formattedPrice || '$4.99'}/month`
                                  : `${('subscriptionOfferDetails' in item ? 
                                      item.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice : 
                                      '$4.99')}/month`}
                              </Text>
                            </>
                          )}
                        </View>
                      )}
                    </Button>
                  </LinearGradient>
                </View>
              )}
            />
          )}
        </View>
      </CustomModal>
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subscriptionOption: {
    borderWidth: 1,
    borderColor: '#EDF1F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subscriptionPrice: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
  },
  subscriptionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  trialText: {
    fontSize: 13,
    color: '#00FF7F',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  androidSubscriptionText: {
    fontSize: 14,
    color: 'white',
    marginTop: 6,
  },
  buttonContainer: {
    marginVertical: 8,
    width: '100%',
  },
  gradientContainer: {
    marginVertical: 8,
    borderRadius: 15,
    overflow: 'hidden',
  },
  menuButton: {
    height: 60,
    borderRadius: 15,
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modalButtonContainer: {
    marginBottom: 10,
  },
});

export default ProfileScreen;
