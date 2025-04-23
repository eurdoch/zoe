// Mock for @ui-kitten/components
const React = require('react');

const mockComponent = (name) => {
  const component = (props) => {
    return React.createElement(name, props, props.children);
  };
  return component;
};

// Create mock components
module.exports = {
  Layout: mockComponent('Layout'),
  Card: mockComponent('Card'),
  Text: mockComponent('Text'),
  Button: mockComponent('Button'),
  Divider: mockComponent('Divider'),
  List: mockComponent('List'),
  ListItem: mockComponent('ListItem'),
  Modal: mockComponent('Modal'),
  Icon: mockComponent('Icon'),
  Spinner: mockComponent('Spinner'),
  Input: mockComponent('Input'),
  CheckBox: mockComponent('CheckBox'),
  Datepicker: mockComponent('Datepicker')
};