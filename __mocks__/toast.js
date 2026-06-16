const React = require('react');
const { View } = require('react-native');

const Toast = props => React.createElement(View, props);
Toast.show = jest.fn();
Toast.hide = jest.fn();
module.exports = Toast;
module.exports.default = Toast;
