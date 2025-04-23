import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Button, Text as KittenText } from '@ui-kitten/components';

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
          size="large"
          style={styles.button}
          accessoryLeft={undefined}
        >
          {(evaProps: any) => <KittenText {...evaProps} style={styles.buttonText}>{item.label}</KittenText>}
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
    height: 60, // Make buttons taller
    borderRadius: 15, // Increased border radius
  },
  buttonText: {
    fontSize: 18, // Larger text size
    fontWeight: 'bold',
    color: 'white',
  }
});

export default Menu;
