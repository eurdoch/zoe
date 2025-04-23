// Setup file for Jest

// Mock react-native-gesture-handler
// Note: We're not importing the actual setup as it may cause dependency issues
jest.mock('react-native-gesture-handler', () => {});

// Silence the warning: Animated: `useNativeDriver`
// Updated to reflect new React Native 0.78+ paths
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({
  shouldUseNativeDriver: () => false
}), { virtual: true });

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn,
  useAnimatedStyle: jest.fn,
  withTiming: jest.fn,
  withSpring: jest.fn,
  withSequence: jest.fn,
  withDelay: jest.fn,
  withRepeat: jest.fn,
  withDecay: jest.fn,
  runOnJS: jest.fn,
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  Animated: {
    View: 'Animated.View',
    Text: 'Animated.Text',
    Image: 'Animated.Image',
    ScrollView: 'Animated.ScrollView',
  },
  default: {
    call: jest.fn(),
  },
}), { virtual: true });

// Mock the Navigation
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: jest.fn(),
      reset: jest.fn(),
    }),
    useFocusEffect: jest.fn(),
  };
});

// Mock Toast messages
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));