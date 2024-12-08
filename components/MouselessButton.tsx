import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const MouselessButton = ({ onPress, children = "Button 35" }) => {
  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    // iOS shadow
    shadowColor: '#121212',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    // Android shadow
    elevation: 8,
    // Other styles
    flex: 1,
    justifyContent: 'center',
    padding: 16, // equivalent to 1rem
    margin: 0,
  },
  text: {
    color: '#121212',
    fontFamily: 'Inter',
    fontSize: 19.2, // equivalent to 1.2rem
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 19.2,
  }
});

export default MouselessButton;
