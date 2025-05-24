import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput } from 'react-native';
import { Icon } from '@ui-kitten/components';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { mdiBarcodeScan } from '@mdi/js';
import { Dropdown } from 'react-native-element-dropdown';
import OldProductResponse, { ProductResponse } from '../types/ProductResponse';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFoodData } from '../contexts/FoodDataContext';

interface Props {
  onActionSelected: (action: string, description?: string) => void;
  productResponse?: ProductResponse | OldProductResponse;
  onFoodAdded?: () => void;
  closeModal: () => void;
  data?: string;
}

const UNITS = [
  { label: 'g', value: 'g' },
  { label: 'oz', value: 'oz' },
  { label: 'lb', value: 'lb' },
  { label: 'kg', value: 'kg' },
  { label: 'ml', value: 'ml' },
  { label: 'l', value: 'l' },
];

const FoodEntryModalContent: React.FC<Props> = ({ 
  onActionSelected, 
  productResponse, 
  onFoodAdded,
  closeModal,
  data = ''
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { scannedProductData } = useFoodData();
  const [foodName, setFoodName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [unit, setUnit] = useState<string>('g');

  // Set food name from scannedProductData when available
  useEffect(() => {
    if (scannedProductData?.product?.product_name) {
      const productName = scannedProductData.product.product_name;
      const brandName = scannedProductData.product.brands;
      
      // Concatenate brand name and product name if both exist
      if (brandName && brandName.trim()) {
        setFoodName(`${brandName} ${productName}`);
      } else {
        setFoodName(productName);
      }
    }
  }, [scannedProductData]);

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
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          value={foodName}
          onChangeText={setFoodName}
          placeholder="Food name"
          placeholderTextColor="#999"
          multiline={true}
          textAlignVertical="top"
        />
      </View>
      
      <View style={styles.servingContainer}>
        <View style={styles.amountContainer}>
          <TextInput
            style={styles.textInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="Amount"
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.unitContainer}>
          <Dropdown
            style={styles.dropdown}
            data={UNITS}
            labelField="label"
            valueField="value"
            value={unit}
            onChange={item => setUnit(item.value)}
            placeholder="Unit"
            placeholderStyle={{color: '#999'}}
          />
        </View>
      </View>
      
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
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    width: '100%',
    height: 42,
  },
  multilineInput: {
    height: 60,
    paddingTop: 10,
  },
  servingContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  amountContainer: {
    flex: 1,
    marginRight: 10,
  },
  unitContainer: {
    width: 80,
  },
  dropdown: {
    height: 42,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
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
