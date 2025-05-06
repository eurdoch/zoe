import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';

const HeaderLogo: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <Image
          source={require('../assets/app_icon.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 0 : 4, // Slight adjustment for Android
  },
  logoImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
});

export default HeaderLogo;