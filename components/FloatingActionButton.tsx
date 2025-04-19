import {StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Icon } from '@ui-kitten/components';

interface FloatingActionButtonProps {
  onPress: any;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}

const FloatingActionButton = ({ onPress, icon = "plus-outline", style }: FloatingActionButtonProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.fab, style]}>
    <Icon
      name={icon}
      width={30}
      height={30}
      fill="white"
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default FloatingActionButton;
