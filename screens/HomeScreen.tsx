import React, { useState, useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Menu from '../components/Menu';
import SubscriptionModal from '../components/SubscriptionModal';
import { checkPremiumStatus } from '../network/user';
import { AuthenticationError } from '../errors/NetworkError';
import UserType from '../types/User';

type HomeScreenProps = {
  navigation: NavigationProp<any>;
};

const menuItems = [
  {
    label: "Lifts",
    screenName: "Exercise",
  },
  {
    label: "Macros",
    screenName: "Diet",
  },
  {
    label: "Weight",
    screenName: "Weight",
  },
  {
    label: "Supplements",
    screenName: "Supplement",
  },
]

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  
  
  // Calculate trial end date (2 weeks from now)
  const getTrialEndDate = () => {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    return trialEndDate.toLocaleDateString();
  };

  // Handle menu item press
  const handleMenuItemPress = async (item: { screenName: string; label: string; data?: any }) => {
    // Check if the Diet option was pressed
    if (item.screenName === 'Diet') {
      try {
        // Get token from AsyncStorage
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          console.error('No authentication token found');
          // Navigate to login if no token is available
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }
        
        // Check premium status
        const premiumStatus = await checkPremiumStatus(token);
        
        if (!premiumStatus.premium) {
          // User is not premium, show subscription modal
          setSubscriptionModalVisible(true);
          return;
        }
        
        // If user is premium, proceed to Diet screen
        navigation.navigate(item.screenName, { data: item.data });
      } catch (error) {
        console.error('Error checking premium status:', error);
        
        if (error instanceof AuthenticationError) {
          // Handle authentication error - redirect to login
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } else {
          // Show generic error message
          Alert.alert(
            'Error',
            'Unable to verify premium status. Please try again later.',
            [
              { text: 'OK', style: 'default' }
            ]
          );
        }
      }
    } else {
      // For other screens, navigate normally
      navigation.navigate(item.screenName, { data: item.data });
    }
  };
  
  // Authentication error handler
  const handleAuthError = useCallback(async (error: AuthenticationError) => {
    console.log('Authentication error detected:', error);
    
    // Remove token and user from AsyncStorage
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      console.log('Token and user removed from AsyncStorage');
      
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (storageError) {
      console.error('Error removing data from storage:', storageError);
    }
  }, [navigation]);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Menu 
          menuItems={menuItems}
          navigation={navigation}
          onItemPress={handleMenuItemPress}
        />
      </View>
      
      
      <SubscriptionModal
        visible={subscriptionModalVisible}
        setVisible={setSubscriptionModalVisible}
        user={user}
        setUser={setUser}
        onAuthError={handleAuthError}
        premiumFeatureMessage={`Diet tracking is a premium feature. Upgrade to access macro tracking, nutrition analysis, and detailed meal logging. Start with a 2-week free trial - you'll be charged on ${getTrialEndDate()}.`}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
