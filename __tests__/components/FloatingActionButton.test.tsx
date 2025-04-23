import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import FloatingActionButton from '../../components/FloatingActionButton';

// Mock the Icon component from @ui-kitten/components
jest.mock('@ui-kitten/components', () => ({
  Icon: (props: any) => {
    // Return a component with the props for testing
    return <MockIcon {...props} />;
  },
}));

// Mock component to represent Icon for testing
const MockIcon = (props: any) => {
  return null; // Doesn't need to render anything for our tests
};

describe('FloatingActionButton', () => {
  it('renders correctly with default props', () => {
    const onPressMock = jest.fn();
    const { UNSAFE_getByType } = render(
      <FloatingActionButton onPress={onPressMock} />
    );
    
    // Find the button by its component type
    const button = UNSAFE_getByType(TouchableOpacity);
    expect(button).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { UNSAFE_getByType } = render(
      <FloatingActionButton onPress={onPressMock} />
    );
    
    // Find and press the button
    const button = UNSAFE_getByType(TouchableOpacity);
    fireEvent.press(button);
    
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('passes the correct icon prop when a custom icon is provided', () => {
    const onPressMock = jest.fn();
    const customIcon = 'edit-outline';
    
    // Use a spy to verify the icon prop is passed correctly
    const iconSpy = jest.spyOn(require('@ui-kitten/components'), 'Icon');
    
    render(
      <FloatingActionButton 
        onPress={onPressMock} 
        icon={customIcon} 
      />
    );
    
    // Check that the Icon component was called with the right props
    expect(iconSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: customIcon,
      }),
      expect.anything()
    );
    
    // Clean up the spy
    iconSpy.mockRestore();
  });
});