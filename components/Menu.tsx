import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '@ui-kitten/components';

interface MenuItem {
  screenName: string;
  label: string;
}

interface MenuProps {
  navigation: any;
  menuItems: MenuItem[];
}

const Menu = ({ navigation, menuItems }: MenuProps) => {
  return (
    <View style={styles.container}>
      {menuItems.map((item, index) => (
        <Button
          key={index}
          onPress={() => navigation.navigate(item.screenName)}
          appearance="filled"
          size="medium"
          style={styles.button}
        >
          {item.label}
        </Button>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
    padding: 16,
  },
  button: {
    marginVertical: 8,
  }
});

export default Menu;
