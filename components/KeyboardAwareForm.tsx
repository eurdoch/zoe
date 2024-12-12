import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TextInputProps,
  ViewStyle,
  TextStyle,
  StyleProp,
  Button,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
interface InputConfig extends Omit<TextInputProps, 'ref'> {
  name: string;
  defaultValue?: string;
  isDate?: boolean;
}
interface FormData {
  [key: string]: string | number;
}
interface KeyboardAwareFormProps {
  inputs: InputConfig[];
  onSubmit?: (data: FormData) => void;
  submitButtonText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  buttonTextStyle?: StyleProp<TextStyle>;
}
// Type for input refs
type InputRefs = {
  [key: string]: TextInput | null;
};
const KeyboardAwareForm: React.FC<KeyboardAwareFormProps> = ({ 
  inputs = [], 
  onSubmit, 
  submitButtonText = 'Submit',
  inputStyle,
  buttonStyle,
  buttonTextStyle,
}) => {
  // Create refs object for all inputs
  const inputRefs = useRef<InputRefs>({});
  // Initialize form state based on input configurations
  const [formData, setFormData] = useState<FormData>(
    inputs.reduce((acc, input) => ({
      ...acc,
      [input.name]: input.defaultValue || (input.name === 'createdAt' ? Math.floor(new Date().getTime() / 1000) : ''),
    }), {})
  );
  // Handle form submission
  const handleSubmit = (): void => {
    onSubmit?.(formData);
    setFormData(inputs.reduce((acc, input) => ({
      ...acc,
      [input.name]: input.isDate ? Math.floor(new Date().getTime() / 1000) : '',
    }), {}));
  };
  // Update form data
  const updateFormData = (field: string, value: string | number): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  // Function to focus next input
  const focusNextInput = (currentIndex: number): void => {
    const nextInput = inputs[currentIndex + 1];
    if (nextInput) {
      inputRefs.current[nextInput.name]?.focus();
    } else {
      handleSubmit();
    }
  };
  const onChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      updateFormData('createdAt', Math.floor(selectedDate.getTime() / 1000));
    }
  };
  const showDatePicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(formData.createdAt as number * 1000),
      onChange,
      mode: 'date',
      is24Hour: true,
      display: 'default'
    });
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.form}>
        {inputs.map((input, index) => {
          // Destructure name and other props to avoid passing name to TextInput
          const { name, defaultValue, ...inputProps } = input;
          
          if (name === 'createdAt') {
            return (
              <TouchableOpacity
                onPress={showDatePicker}
                style={styles.dateButton}
                key={name}
              >
                <MaterialCommunityIcons name="calendar" size={24} color="#007AFF" />
                <Text style={styles.dateText}>{new Date((formData[name] as number) * 1000).toLocaleDateString()}</Text>
              </TouchableOpacity>
            )
          } else {
            return (
              <TextInput
                key={name}
                ref={(ref: TextInput | null) => {
                  inputRefs.current[name] = ref;
                }}
                style={[styles.input, inputStyle]}
                value={formData[name] as string}
                onChangeText={(value: string) => updateFormData(name, value)}
                returnKeyType={index === inputs.length - 2 ? 'done' : 'next'}
                onSubmitEditing={() => index === inputs.length - 2 ? handleSubmit() : focusNextInput(index)}
                blurOnSubmit={index === inputs.length - 1}
                {...inputProps}
              />
            );
          }
        })}
        <TouchableOpacity 
          style={[styles.button, buttonStyle]}
          onPress={handleSubmit}
        >
          <Text style={[styles.buttonText, buttonTextStyle]}>
            {submitButtonText}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  form: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  dateText: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dateButton: {
    gap: 5,
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  }
});
export default KeyboardAwareForm;
