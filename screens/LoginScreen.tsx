import React, { useState, useRef } from "react";
import { NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import PhoneInput from "react-native-phone-number-input";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

type LoginScreenProps = {
  navigation: NavigationProp<any>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [value, setValue] = useState("");
  const [formattedValue, setFormattedValue] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const phoneInput = useRef<PhoneInput>(null);

  const handleVerify = async (e: any) => {
    e.preventDefault();
    const checkValid = phoneInput.current?.isValidNumber(value);
    
    if (checkValid) {
      console.log('Valid number entered is: ', formattedValue);
      setIsLoading(true);
      
      try {
        const response = await fetch(`${API_BASE_URL}/verify/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber: formattedValue }),
        });
        
        const data = await response.json();
        console.log('Verification response:', data);
        
        // Set the verification ID for later use
        setVerificationId(data.sid);
        
      } catch (error) {
        console.error('Error sending verification code:', error);
        Alert.alert('Error', 'Failed to send verification code. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert('Invalid Number', 'Please enter a valid phone number.');
      console.log('Number is not valid.');
    }
  };

  const handleCodeVerification = async () => {
    if (!verificationCode || verificationCode.length < 4) {
      Alert.alert('Invalid Code', 'Please enter the verification code you received.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/verify/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber: formattedValue,
          code: verificationCode 
        }),
      });
      
      // The server now returns user data directly (not verification check)
      const userData = await response.json();
      console.log('Verification response:', userData);
      
      // Check if the verification was successful
      if (response.ok) {
        console.log('Verification successful!');
        
        try {
          // Store the user data in AsyncStorage
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          
          // Also store the token separately for easier access
          if (userData.token) {
            await AsyncStorage.setItem('token', userData.token);
          }
          
          // Reset form values
          setVerificationId(null);
          setVerificationCode('');
          
          // Navigate to the HomeScreen
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        } catch (error) {
          console.error('Error storing user data:', error);
          Alert.alert('Error', 'Failed to store login information. Please try again.');
        }
      } else {
        // The verification failed
        console.error('Verification failed:', userData);
        Alert.alert(
          'Verification Failed', 
          userData.message || 'The code you entered is incorrect. Please try again.'
        );
      }
      
    } catch (error) {
      console.error('Error checking verification code:', error);
      Alert.alert('Error', 'Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.wrapper}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#7CDB8A" />
        ) : verificationId ? (
          // Verification code input view
          <>
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>
              We've sent a verification code to {formattedValue}
            </Text>
            <TextInput
              style={styles.codeInput}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Enter code"
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleCodeVerification}
            >
              <Text style={styles.buttonText}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.textButton}
              onPress={() => setVerificationId(null)}
            >
              <Text style={styles.textButtonText}>Change Phone Number</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Phone number input view
          <>
            <Text style={styles.title}>Enter Your Phone Number</Text>
            <PhoneInput
              ref={phoneInput}
              defaultValue={value}
              defaultCode="US"
              layout="first"
              onChangeText={(text) => {
                setValue(text);
              }}
              onChangeFormattedText={(text) => {
                setFormattedValue(text);
              }}
              withDarkTheme
              withShadow
              autoFocus
              containerStyle={styles.inputContainer}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleVerify}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  codeInput: {
    width: '100%',
    maxWidth: 400,
    height: 50,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 18,
    backgroundColor: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    marginTop: 20,
    height: 50,
    width: '100%',
    maxWidth: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7CDB8A',
    borderRadius: 8,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  textButton: {
    marginTop: 20,
    padding: 10,
  },
  textButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  redColor: {
    backgroundColor: '#F57777'
  },
  message: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});

export default LoginScreen;
