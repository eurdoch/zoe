import {StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Icon } from '@ui-kitten/components';
import LinearGradient from 'react-native-linear-gradient';
import { TouchableOpacity } from 'react-native';

interface FloatingActionButtonProps {
  onPress: any;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}

const FloatingActionButton = ({ onPress, icon = "plus-outline", style }: FloatingActionButtonProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.fabContainer, style]}>
    <LinearGradient
      colors={['#444444', '#222222']}
      style={styles.fab}
    >
      <Icon
        name={icon}
        width={30}
        height={30}
        fill="white"
      />
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
});

export default FloatingActionButton;
