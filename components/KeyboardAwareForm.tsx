
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
} from 'react-native';
import { Button } from 'react-native-paper';
// Interface for individual input configuration
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
      [input.name]: input.isDate ? Math.floor(new Date().getTime() / 1000).toString() : '',
    }), {}));
  };
  // Update form data
  const updateFormData = (field: string, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'createdAt' ? Number(value) : value,
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
      console.log(selectedDate);
      updateFormData('createdAt', Math.floor(selectedDate.getTime() / 1000).toString());
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
              <Button icon="calendar" onPress={showDatePicker}>
                <Text>{new Date((formData[name] as number) * 1000).toLocaleString()}</Text>
              </Button>
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
                returnKeyType={index === inputs.length - 1 ? 'done' : 'next'}
                onSubmitEditing={() => focusNextInput(index)}
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
});
export default KeyboardAwareForm;
