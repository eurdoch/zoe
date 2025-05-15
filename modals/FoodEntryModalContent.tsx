import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput } from 'react-native';
import { Icon } from '@ui-kitten/components';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { mdiBarcodeScan } from '@mdi/js';

interface Props {
  onActionSelected: (action: string, description?: string) => void;
}

const FoodEntryModalContent: React.FC<Props> = ({ onActionSelected }) => {
  const [description, setDescription] = useState<string>('');
  const actions = [
    { id: 'search', icon: 'search-outline' },
    { id: 'barcode', icon: 'camera-outline' }
  ];

  // Placeholder handler for MDI barcode scan
  const handleMdiBarcodeScan = () => {
    console.log('MDI Barcode Scan pressed');
    // Add your custom logic here
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Food Entry</Text>
      
      <View style={styles.descriptionContainer}>
        <TextInput
          style={styles.descriptionInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
          placeholderTextColor="#999"
        />
      </View>
      
      <View style={styles.iconsContainer}>
        <View style={styles.iconsRow}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.iconButton}
              onPress={() => onActionSelected(action.id, description)}
            >
              <LinearGradient
                colors={['#444444', '#222222']}
                style={styles.gradientButton}
              >
                <Icon name={action.icon} width={28} height={28} fill="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
          
          {/* MDI Barcode Scan Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleMdiBarcodeScan}
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
        </View>
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
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  iconsContainer: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
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
  descriptionContainer: {
    width: '100%',
    marginBottom: 15,
  },
  descriptionInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  }
});

export default FoodEntryModalContent;