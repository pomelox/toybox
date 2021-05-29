import React, { Component } from 'react';
import { genPromise } from '@utillib';
import { View } from '@tarojs/components';
import './app.less';

export interface AppInstance extends Taro.AppInstance {
  persistReadyPromise: ReturnType<typeof genPromise>;
  sessionId?: string;
  sessionStartTime?: number;
  uid?: string;
  appHiding?: boolean;
  lastScene?: number;
  isFromOutside?: boolean;
}

class App extends Component {
  componentDidMount() {}

  componentDidShow() {}

  componentDidHide() {}

  componentDidCatchError() {}

  // this.props.children 是将要会渲染的页面
  render() {
    return (
      <View>
        {this.props.children}
      </View>
    );
  }
}

export default App;
