import Taro from '@tarojs/taro';

export default {
  reportPerformance(id: number, value: number, dimensions?: string | any[] | undefined ) {
    // 先判断是否支持
    if (!Taro.canIUse('reportPerformance')) {
      return;
    }

    wx.reportPerformance(id, value, dimensions);
    console.log('reportPerformance', id, value, dimensions)
  },
};
