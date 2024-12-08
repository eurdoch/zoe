import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MouselessButton from './MouselessButton';
interface MenuItem {
  screenName: string;
  label: string;
}
interface MenuProps {
  navigation: any;
  menuItems: MenuItem[];
}
const Menu = ({ navigation, menuItems }: MenuProps) => {
  const screenWidth = Dimensions.get('window').width;
  const buttonSize = (screenWidth - 80) / 2;
  return (
    <View style={styles.container}>
      {menuItems.map((item, index) => (
        <View
          key={index}
          style={{
            width: buttonSize,
            height: buttonSize,
          }}
        >
          <MouselessButton
            onPress={() => navigation.navigate(item.screenName)}
          >
            {item.label}
          </MouselessButton>
        </View>
      ))}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
export default Menu;
