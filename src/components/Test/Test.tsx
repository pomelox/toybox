import React, { Component } from 'react';
import { View, Text, Button } from '@tarojs/components';
import './Test.less';

export const Test = () => {
  const onClickButton = () => {
    console.log('click button');
  };

  return (
    <View className="iot-test">
      <Text>This is component.</Text>
      <Button onClick={onClickButton}>Click me</Button>
    </View>
  );
};
