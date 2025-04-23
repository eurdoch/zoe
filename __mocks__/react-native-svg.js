// Mock for react-native-svg
const React = require('react');

const createComponent = (name) => {
  return class extends React.Component {
    render() {
      return React.createElement(name, this.props, this.props.children);
    }
  };
};

module.exports = {
  Svg: createComponent('Svg'),
  Circle: createComponent('Circle'),
  Path: createComponent('Path'),
  Line: createComponent('Line'),
  Text: createComponent('Text'),
  G: createComponent('G'),
  // Add any other SVG components your app uses
};