import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Icon } from '@ui-kitten/components';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { mdiBarcodeScan } from '@mdi/js';
import OldProductResponse, { ProductResponse } from '../types/ProductResponse';
import Food from '../types/Food';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  onActionSelected: (action: string, description?: string) => void;
  productResponse?: ProductResponse | OldProductResponse;
  onFoodAdded?: () => void;
  closeModal: () => void;
  data?: string;
}

const FoodEntryModalContent: React.FC<Props> = ({ 
  onActionSelected, 
  productResponse, 
  onFoodAdded,
  closeModal,
  data = ''
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleCameraPress = () => {
    closeModal();
    navigation.navigate('FoodImageAnalyzer');
  };
  
  const handleBarcodePress = () => {
    closeModal();
    navigation.navigate('BarcodeScanner');
  };
  
  const handleSearchPress = () => {
    closeModal();
    navigation.navigate('DietLog');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Food Entry</Text>
      
      {/* Content will go here */}
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCameraPress}
        >
          <LinearGradient
            colors={['#444444', '#222222']}
            style={styles.gradientButton}
          >
            <Icon name="camera-outline" width={28} height={28} fill="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleBarcodePress}
        >
          <LinearGradient
            colors={['#444444', '#222222']}
            style={styles.gradientButton}
          >
            <Svg width={28} height={28} viewBox="0 0 24 24">
              <Path fill="#FFFFFF" d={mdiBarcodeScan} />
            </Svg>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSearchPress}
        >
          <LinearGradient
            colors={['#444444', '#222222']}
            style={styles.gradientButton}
          >
            <Icon name="search-outline" width={28} height={28} fill="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 10,
    paddingTop: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonsContainer: {
    width: '100%',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  actionButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  gradientButton: {
    width: 60,
    height: 60,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default FoodEntryModalContent;