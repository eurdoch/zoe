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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../config';

type LoginScreenProps = {
  navigation: NavigationProp<any>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [emailPending, setEmailPending] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e: any) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const checkValid = emailRegex.test(email);
    
    if (checkValid) {
      console.log('Valid email entered is: ', email);
      setIsLoading(true);
      
      try {
        const baseUrl = await getApiBaseUrl();
        const response = await fetch(`${baseUrl}/verify/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email }),
        });
        
        const data = await response.json();
        console.log('Verification response:', data);
        
        // Check if verification is pending
        if (data.status === 'pending') {
          setEmailPending(true);
        } else {
          Alert.alert('Error', 'Failed to send verification code. Please try again.');
        }
        
      } catch (error) {
        console.error('Error sending verification code:', error);
        Alert.alert('Error', 'Failed to send verification code. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      console.log('Email is not valid.');
    }
  };

  const handleCodeVerification = async () => {
    if (!verificationCode || verificationCode.length < 4) {
      Alert.alert('Invalid Code', 'Please enter the verification code you received.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const baseUrl = await getApiBaseUrl();
      const response = await fetch(`${baseUrl}/verify/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email,
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
          setEmailPending(false);
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.wrapper}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#7CDB8A" />
            ) : emailPending ? (
              // Verification code input view
              <>
                <Text style={styles.title}>Enter Verification Code</Text>
                <Text style={styles.subtitle}>
                  We've sent a verification code to {email}
                </Text>
                <TextInput
                  style={styles.codeInput}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="Enter code"
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                    handleCodeVerification();
                  }}
                />
                <LinearGradient
                  colors={['#444444', '#222222']}
                  style={styles.gradientContainer}
                >
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleCodeVerification}
                  >
                    <Text style={styles.buttonText}>Verify</Text>
                  </TouchableOpacity>
                </LinearGradient>
                <View style={styles.textButtonsContainer}>
                  <TouchableOpacity
                    style={styles.textButton}
                    onPress={() => setEmailPending(false)}
                  >
                    <Text style={styles.textButtonText}>Change Email Address</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.textButton}
                    onPress={async () => {
                      setIsLoading(true);
                      try {
                        const baseUrl = await getApiBaseUrl();
                        const response = await fetch(`${baseUrl}/verify/send`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ email: email }),
                        });
                        
                        const data = await response.json();
                        console.log('Resend verification response:', data);
                        
                        // Check if verification is pending
                        if (data.status === 'pending') {
                          setEmailPending(true);
                        } else {
                          Alert.alert('Error', 'Failed to send verification code. Please try again.');
                        }
                        
                        // Clear the verification code field
                        setVerificationCode("");
                        
                        Alert.alert('Success', 'A new verification code has been sent to your email.');
                      } catch (error) {
                        console.error('Error resending verification code:', error);
                        Alert.alert('Error', 'Failed to resend verification code. Please try again.');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    <Text style={styles.textButtonText}>Send Code Again</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // Phone number input view
              <>
                <Text style={styles.title}>Enter Your Email Address</Text>
                <TextInput
                  style={[styles.inputContainer, styles.emailInput]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={(e) => {
                    Keyboard.dismiss();
                    handleVerify(e);
                  }}
                />
                <LinearGradient
                  colors={['#444444', '#222222']}
                  style={styles.gradientContainer}
                >
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleVerify}
                  >
                    <Text style={styles.buttonText}>Login</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  gradientContainer: {
    marginVertical: 8,
    borderRadius: 15,
    overflow: 'hidden',
    width: '100%',
  },
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 40,
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
  emailInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    height: 60,
    borderRadius: 15, 
    borderWidth: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textButtonsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  textButton: {
    marginTop: 10,
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
