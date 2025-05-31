import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Alert, FlatList } from 'react-native';
import { Button, Text as KittenText } from '@ui-kitten/components';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomModal from '../CustomModal';
import { updatePremiumStatus } from '../network/user';
import { showToastError } from '../utils';
import { AuthenticationError } from '../errors/NetworkError';
import UserType from '../types/User';
import {
  initConnection,
  getSubscriptions,
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  Subscription,
} from 'react-native-iap';

type KittenProps = {
  style?: any;
  [key: string]: any;
};

interface SubscriptionModalProps {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  onAuthError?: (error: AuthenticationError) => void;
  premiumFeatureMessage?: string;
}

const SUBSCRIPTION_ID = 'kallos_premium';

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  setVisible,
  user,
  setUser,
  onAuthError,
  premiumFeatureMessage
}) => {
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);

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

  useEffect(() => {
    const purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
      console.log('Purchase updated:', purchase);
      
      // Only process purchases that we initiated
      if (purchase.productId === SUBSCRIPTION_ID && isProcessingPurchase) {
        try {
          const receipt = purchase.transactionReceipt ? purchase.transactionReceipt : '';
          
          if (receipt) {
            console.log('Transaction receipt:', receipt);
            
            try {
              const token = await AsyncStorage.getItem('token');
              
              if (!token) {
                throw new Error('Authentication token not found');
              }
              
              const currentPlatform = Platform.OS as 'ios' | 'android';
              const updatedUser = await updatePremiumStatus(token, receipt, currentPlatform);
              
              if (updatedUser) {
                setUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('Premium status updated on backend:', updatedUser.premium);
              }
              
              await finishTransaction({ purchase, isConsumable: false });
              console.log('Transaction finished');
              
              Alert.alert(
                'Subscription Activated',
                'Thank you for subscribing to Kallos Premium!',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error updating premium status on backend:', error);
              
              if (error instanceof AuthenticationError && onAuthError) {
                onAuthError(error);
                return;
              }
              
              // DO NOT grant premium access if backend validation fails
              // This could be exploited - always require successful backend validation
              await finishTransaction({ purchase, isConsumable: false });
              
              Alert.alert(
                'Subscription Error',
                'There was an issue processing your subscription. Please contact support if you were charged.',
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

    const purchaseErrorSubscription = purchaseErrorListener((error) => {
      console.error('Purchase error:', error);
      
      if (error.code === 'E_USER_CANCELLED') {
        console.log('User cancelled the purchase');
      } else {
        showToastError('Subscription error. Please try again later.');
      }
      
      setPurchaseLoading(false);
    });

    return () => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
    };
  }, [user, setUser, onAuthError, isProcessingPurchase]);

  const handleSubscriptionSelect = async (subscription: Subscription) => {
    console.log('Selected subscription:', subscription);
    setPurchaseLoading(true);
    setIsProcessingPurchase(true);
    
    try {
      const productId = subscription.productId;
      const offerToken = Platform.OS === 'android' && 'subscriptionOfferDetails' in subscription
        ? subscription.subscriptionOfferDetails?.[0]?.offerToken 
        : '';
      
      console.log(`Requesting subscription for product ID: ${productId}`);
      
      if (Platform.OS === 'android' && offerToken) {
        await requestSubscription({
          sku: productId,
          andDangerouslyFinishTransactionAutomaticallyIOS: false,
          subscriptionOffers: [{ sku: productId, offerToken }]
        });
      } else {
        try {
          await requestSubscription({
            sku: productId,
            andDangerouslyFinishTransactionAutomaticallyIOS: false
          });
        } catch (iosError: any) {
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
            throw iosError;
          }
        }
      }
      
      console.log('Subscription requested successfully');
      // Close modal only after successful purchase initiation
      setVisible(false);
      
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      showToastError('Failed to purchase subscription. Please try again.');
      setVisible(true); // Reopen modal on error
    } finally {
      setPurchaseLoading(false);
      setIsProcessingPurchase(false);
    }
  };

  return (
    <CustomModal visible={visible} setVisible={setVisible}>
      <View>
        {premiumFeatureMessage && (
          <View style={styles.premiumMessageContainer}>
            <Text style={styles.premiumMessage}>{premiumFeatureMessage}</Text>
          </View>
        )}
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
                    disabled={purchaseLoading}
                    style={[styles.menuButton, { backgroundColor: 'transparent' }]}
                    accessoryLeft={purchaseLoading ? (props) => <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
                  >
                    {(evaProps: KittenProps) => (
                      <View style={{ alignItems: 'center', width: '100%' }}>
                        <KittenText {...evaProps} style={styles.buttonText}>
                          {purchaseLoading ? 'Processing...' : (
                            Platform.OS === 'ios' 
                              ? ('title' in item ? item.title : 'Kallos Premium') 
                              : ('name' in item ? item.name : 'Kallos Premium')
                          )}
                        </KittenText>
                        
                        {!purchaseLoading && (
                          Platform.OS === 'ios' ? (
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
                          )
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
  );
};

const styles = StyleSheet.create({
  premiumMessageContainer: {
    backgroundColor: '#f0f4ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3366FF',
  },
  premiumMessage: {
    fontSize: 14,
    color: '#2d3748',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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

export default SubscriptionModal;