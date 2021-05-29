import Taro from '@tarojs/taro';

import { operatingReject } from '@utillib';

export default {
  async getNetworkType() {
    try {
      const { networkType } = await Taro.getNetworkType();

      return networkType;
    } catch (err) {
      return 'unknown';
    }
  },
  async chooseImage(opts = {}) {
    try {
      return await Taro.chooseImage(Object.assign({ count: 1 }, opts));
    } catch (error) {
      return operatingReject(error);
    }
  },
  /**
   * @see https://mp.weixin.qq.com/debug/wxadoc/dev/api/api-react.html#wxshowactionsheetobject
   * @param {Array} itemList
   * @param {Object} opts
   */
  async showActionSheet(itemList: string[] = [], opts: { itemColor?: string; } = {}) {
    try {
      const { tapIndex } = await Taro.showActionSheet({ itemList, ...opts });
      return tapIndex;
    } catch (error) {
      return operatingReject(error);
    }
  },
  async scanCode() {
    try {
      // @ts-ignore
      const { result: scanResult } = await Taro.scanCode();
      return scanResult;
    } catch (err) {
      return operatingReject(err);
    }
  },
  // 如果是执行在自定义组件内，必须传入组件实例，否则永远是 null
  boundingClientRect(selector: string, componentContext?: Taro.General.IAnyObject): Promise<Taro.NodesRef.BoundingClientRectCallbackResult> {
    return new Promise((resolve, reject) => {
      try {
        let query = Taro.createSelectorQuery();

        if (componentContext) {
          query = query.in(componentContext);
        }

        query.select(selector).boundingClientRect((resp) => {
          resolve(resp);
        }).exec();
      } catch (err) {
        reject(err);
      }
    });
  },
  setNavBarColor({
    frontColor,
    backgroundColor,
    animation,
    color,
  }: {
    /** 背景颜色值，有效值为十六进制颜色 */
    backgroundColor?: string;
    /** 前景颜色值，包括按钮、标题、状态栏的颜色，仅支持 #ffffff 和 #000000 */
    frontColor?: string;
    color?: string;
    /** 动画效果 */
    animation?: WechatMiniprogram.AnimationOption;
  }) {
    if (color) {
      frontColor = color;
      backgroundColor = color;
    }

    wx.setNavigationBarColor({
      frontColor: frontColor as string,
      backgroundColor: backgroundColor as string,
      animation,
      fail(err) {
        console.error(err);
      }
    });
  },
};
