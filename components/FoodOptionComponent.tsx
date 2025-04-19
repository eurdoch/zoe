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
    paddingVertical: 12,
    paddingLeft: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FoodOptionComponent;
