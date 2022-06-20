import {View, Text} from 'react-native';
import React from 'react';
import WebView from 'react-native-webview';

export default function App() {
  return <WebView source={{uri: 'http://192.168.0.106:8080'}} />;
}
