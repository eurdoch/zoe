import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Button, Card, Layout } from '@ui-kitten/components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_API_URL } from '../config';

interface User {
  user_id?: string;
  name: string;
  email: string;
  premium?: boolean;
  created_at?: string;
  last_login?: string;
}

const ProfileScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First try to fetch from API
        const token = await AsyncStorage.getItem('token');
        
        if (token) {
          // Make API request to fetch user data
          const response = await fetch(`${BASE_API_URL}/auth/user`, {
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
          } else {
            // If API call fails, fall back to local storage
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
        // If network error, try local storage as fallback
        try {
          const userData = await AsyncStorage.getItem('user');
          if (userData) {
            setUser(JSON.parse(userData));
          }
        } catch (localError) {
          console.error('Error loading local user data:', localError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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
});

export default ProfileScreen;
