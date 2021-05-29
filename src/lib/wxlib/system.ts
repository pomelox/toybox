import Taro, { getCurrentInstance, getSystemInfoSync, getMenuButtonBoundingClientRect } from '@tarojs/taro';
import { AppInstance } from '@src/app';
import promiseBridge from '../promise-bridge';

export interface SystemInfo extends getSystemInfoSync.Result {
  pageHeaderHeight: number;
  menuButtonBoundingClientRect: getMenuButtonBoundingClientRect.Rect;
  tabBarHeight: number;
  environment?: 'wxwork'; // 企业微信特有 'wxwork'
  ipx: boolean;
}

let systemCache;

const system = {
  isIOS,
  isAndroid,
  isFullScreen,
  isWxworkEnv,
  getPhoneInfo,
  getCurrentWxVersion,
  isIPad,
  getCurrentSdkVersion,
  get app(): AppInstance {
    return getCurrentInstance().app as AppInstance;
  },
  get info(): SystemInfo {
    // TODO: 观察第一次获取的值有无问题
    if (systemCache) return systemCache;

    const systemInfo: SystemInfo = Taro.getSystemInfoSync() as SystemInfo;

    const rpx2px = rpx => (rpx / 2) * (systemInfo.windowWidth / 375);

    const menuButtonBoundingClientRect = Taro.getMenuButtonBoundingClientRect();

    if (menuButtonBoundingClientRect.top < systemInfo.statusBarHeight) {
      // Android 获取top值异常，修正为 statusBarHeight + top
      menuButtonBoundingClientRect.top = systemInfo.statusBarHeight + menuButtonBoundingClientRect.top;
    }

    systemInfo.menuButtonBoundingClientRect = menuButtonBoundingClientRect;

    const { height, top } = menuButtonBoundingClientRect;

    // header + statusBar 高度，单位px
    systemInfo.pageHeaderHeight = 2 * (top - systemInfo.statusBarHeight) + height + systemInfo.statusBarHeight;

    const ipx = isFullScreen(systemInfo);

    systemInfo.ipx = ipx;

    if (ipx) {
      systemInfo.tabBarHeight = rpx2px(120 + 68 - 24);
    } else {
      systemInfo.tabBarHeight = rpx2px(120 + 18 - 24);
    }

    systemCache = systemInfo;

    return systemCache;
  },
  get appHiding() {
    // return (wxlib.system.app || {}).appHiding;
    return (this.app || {}).appHiding;
  },
  async init() {
    // 网络切换事件
    if (Taro.onNetworkStatusChange) {
      Taro.onNetworkStatusChange((res) => {
        this.networkType = res.networkType;
      });
    }
    // 初始化拿到网络类型
    try {
      const { networkType } = await Taro.getNetworkType();
      this.networkType = networkType;
    } catch (err) {
    }

    this.getSystemInfo();
    this.update();
  },
  get currentPage() {
    return getCurrentInstance().page;
  },

  getNetworkType() {
    if (!this.networkType) {
      return 'unknow';
    }
    return this.networkType;
  },

  getSystemInfo() {
    if (!this.systemInfo) {
      this.systemInfo = this.info;
    }
    return this.systemInfo;
  },

  update() {
    const updateManager = Taro.getUpdateManager();

    updateManager.onUpdateReady(() => Taro.showModal({
      title: '更新小程序',
      content: '新版本已准备好，是否重启小程序？',
      success: (res) => {
        if (res.confirm) {
          // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
          updateManager.applyUpdate();
        }
      },
    }));
  },

  waitForAppShow() {
    if (!this.appHiding) {
      return Promise.resolve();
    }

    return promiseBridge.register('waitForAppShow');
  },

  waitForAppHide() {
    if (this.appHiding) {
      return Promise.resolve();
    }

    return promiseBridge.register('waitForAppHide');
  },
};

function isIOS() {
  const { platform } = system.info;
  return platform.toLowerCase().indexOf('ios') > -1;
}

function isAndroid() {
  const { platform } = system.info;
  return platform.toLowerCase().indexOf('android') > -1;
}

function isIPad() {
  const { model } = system.info;
  return model.toLowerCase().indexOf('ipad') > -1;
}

function isWxworkEnv() {
  const { environment } = system.info;
  return environment === 'wxwork';
}

function getPhoneInfo() {
  const { brand, model } = system.info;
  return { brand, model };
}

function getCurrentWxVersion() {
  const sysInfo = system.info;
  return sysInfo.version;
}

function getCurrentSdkVersion() {
  const sysInfo = system.info;
  return sysInfo.SDKVersion;
}

/**
 * 全面屏
 *
 * 屏幕比例超过1.86的屏幕，比如: 17:9、18:9、19:9、19.5:9 等这些比例的屏幕都是全面屏。
 *
 * @reference https://developer.huawei.com/consumer/cn/devservice/doc/50111
 * @return {boolean}
 */
function isFullScreen(systemInfo?: SystemInfo) {
  if (!systemInfo) {
    systemInfo = system.info;
  }

  const { screenHeight, screenWidth } = systemInfo;

  return (screenHeight / screenWidth) > 1.86;
}

export default system;
