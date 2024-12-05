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
      <Text style={styles.name}>{option.food_name}</Text>
      <Text>{option.name}</Text>
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
  description: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
  },
});

export default FoodOptionComponent;
