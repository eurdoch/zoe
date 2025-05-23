import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TextInputProps,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import {
  Input,
  Button,
  Text,
  Icon,
  Layout,
  Datepicker
} from '@ui-kitten/components';
import LinearGradient from 'react-native-linear-gradient';

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

type InputRefs = {
  [key: string]: any;
};

const KeyboardAwareForm: React.FC<KeyboardAwareFormProps> = ({ 
  inputs = [], 
  onSubmit, 
  submitButtonText = 'Submit',
  inputStyle,
  buttonStyle,
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

  // Get current date from the form data
  const currentDate = formData.createdAt 
    ? new Date((formData.createdAt as number) * 1000) 
    : new Date();
  
  // Handle date selection from datepicker
  const onDateSelect = (date: Date) => {
    // Set the selected date in formData
    updateFormData('createdAt', Math.floor(date.getTime() / 1000));
  };

  const CalendarIcon = (props: any) => (
    <Icon {...props} name='calendar-outline'/>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Layout style={styles.form}>
        {/* No custom modal needed - UI Kitten Datepicker handles this */}
        {inputs.map((input, index) => {
          // Destructure name and other props to avoid passing name to Input
          const { name, defaultValue, ...inputProps } = input;
          
          if (name === 'createdAt') {
            return (
              <View key={name} style={styles.dateContainer}>
                <Text category="label" style={styles.dateLabel}>Date</Text>
                <Datepicker
                  date={currentDate}
                  onSelect={onDateSelect}
                  accessoryLeft={CalendarIcon}
                  style={styles.datePicker}
                  placeholder="Select Date"
                  min={new Date(2000, 0, 1)}
                  max={new Date(2030, 11, 31)}
                />
              </View>
            )
          } else {
            return (
              <Input
                key={name}
                ref={(ref) => {
                  inputRefs.current[name] = ref;
                }}
                style={[styles.input, inputStyle]}
                value={formData[name] as string}
                onChangeText={(value: string) => updateFormData(name, value)}
                returnKeyType={index === inputs.length - 2 ? 'done' : 'next'}
                onSubmitEditing={() => index === inputs.length - 2 ? handleSubmit() : focusNextInput(index)}
                blurOnSubmit={index === inputs.length - 1}
                size="large"
                textStyle={styles.inputText}
                {...inputProps}
              />
            );
          }
        })}
        <LinearGradient
          colors={['#444444', '#222222']}
          style={styles.gradientContainer}
        >
          <Button 
            style={[styles.button, buttonStyle, { backgroundColor: 'transparent' }]}
            onPress={handleSubmit}
            appearance="filled"
            size="large"
          >
            {(evaProps: any) => <Text {...evaProps} style={styles.buttonText}>{submitButtonText}</Text>}
          </Button>
        </LinearGradient>
      </Layout>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
  },
  form: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  input: {
    marginBottom: 8,
    width: '100%',
    borderRadius: 15,
  },
  inputText: {
    fontSize: 18,
    height: 20,
  },
  gradientContainer: {
    marginVertical: 8,
    borderRadius: 15,
    overflow: 'hidden',
  },
  button: {
    marginTop: 0,
    height: 50,
    borderRadius: 15,
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  dateContainer: {
    alignSelf: 'center',
    marginBottom: 15,
  },
  dateLabel: {
    marginBottom: 4,
  },
  datePicker: {
    marginBottom: 8,
    width: '100%',
    borderRadius: 15,
  }
});

export default KeyboardAwareForm;
