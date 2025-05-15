import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Icon } from '@ui-kitten/components';
import LinearGradient from 'react-native-linear-gradient';

interface Props {
  onActionSelected: (action: string) => void;
}

const FoodEntryModalContent: React.FC<Props> = ({ onActionSelected }) => {
  const actions = [
    { id: 'search', label: 'Search Food Database', icon: 'search-outline' },
    { id: 'label', label: 'Scan Nutrition Label', icon: 'file-text-outline' },
    { id: 'barcode', label: 'Scan Barcode', icon: 'camera-outline' },
    { id: 'image', label: 'Food Image Analysis', icon: 'bulb-outline' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Food Entry</Text>
      
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.actionButton}
          onPress={() => onActionSelected(action.id)}
        >
          <LinearGradient
            colors={['#444444', '#222222']}
            style={styles.gradientButton}
          >
            <View style={styles.buttonContent}>
              <Icon name={action.icon} width={24} height={24} fill="#FFFFFF" />
              <Text style={styles.buttonText}>{action.label}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
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
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  actionButton: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
  },
  gradientButton: {
    width: '100%',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 15,
  }
});

export default FoodEntryModalContent;