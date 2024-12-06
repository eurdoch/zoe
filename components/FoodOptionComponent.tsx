import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FoodOptionComponentProps {
  option: any; 
}

const FoodOptionComponent: React.FC<FoodOptionComponentProps> = ({
  option
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{option.name}</Text>
      { option.brand && <Text>{option.brand}</Text> }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FoodOptionComponent;
