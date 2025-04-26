import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Button, Text as KittenText, Icon } from '@ui-kitten/components';

interface MenuItem {
  screenName: string;
  label: string;
  data?: any;
}

interface MenuProps {
  navigation: any;
  menuItems: MenuItem[];
  onItemPress?: (item: MenuItem) => void;
  rightIcon?: {
    name: string;
    onPress: (item: MenuItem) => void;
  };
}

const Menu = ({ navigation, menuItems, onItemPress, rightIcon }: MenuProps) => {
  const handlePress = (item: MenuItem) => {
    if (onItemPress) {
      onItemPress(item);
    } else {
      navigation.navigate(item.screenName, { data: item.data });
    }
  };

  return (
    <View style={styles.container}>
      {menuItems.map((item, index) => (
        <Button
          key={index}
          onPress={() => handlePress(item)}
          appearance="filled"
          size="large"
          style={styles.button}
          accessoryLeft={undefined}
          accessoryRight={
            rightIcon ? 
              (props: any) => (
                <Icon 
                  {...props} 
                  name={rightIcon.name} 
                  onPress={(e: any) => {
                    e.stopPropagation();
                    rightIcon.onPress(item);
                  }}
                />
              ) : undefined
          }
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
    backgroundColor: '#333333', // Dark gray background
  },
  buttonText: {
    fontSize: 18, // Larger text size
    fontWeight: 'bold',
    color: 'white',
  }
});

export default Menu;
