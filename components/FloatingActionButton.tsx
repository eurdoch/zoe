import {StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface FloatingActionButtonProps {
  onPress: any;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}

const FloatingActionButton = ({ onPress, icon = "plus", style }: FloatingActionButtonProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.fab, style]}>
    <MaterialCommunityIcons name={icon} size={30} color="white" />
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
