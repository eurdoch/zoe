import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { Icon } from '@ui-kitten/components';

interface SettingsHeaderRightProps {
  navigation: NavigationProp<any>;
}

const SettingsHeaderRight: React.FC<SettingsHeaderRightProps> = ({ navigation }) => {
  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };
  
  return (
    <TouchableOpacity
      onPress={navigateToProfile}
      style={{ padding: 8 }}
    >
      <Icon
        name="settings-outline"
        fill="#000"
        style={{ width: 24, height: 24 }}
      />
    </TouchableOpacity>
  );
};

export default SettingsHeaderRight;