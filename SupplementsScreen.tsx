import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SupplementScreenProps {}

const SupplementScreen: React.FC<SupplementScreenProps> = () => {
  return (
    <View style={styles.container}>
      <Text>SupplementScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SupplementScreen;
