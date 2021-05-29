/**
 *  小程序路由模块
 *  @see https://mp.weixin.qq.com/debug/wxadoc/dev/api/ui-navigate.html
 */
import Taro from '@tarojs/taro';
import _ from '@underscore';
import { appendParams } from '@utillib';
import promiseBridge from '../promise-bridge';
import tips from './tips';

const navigateToErrMsgMap = {
  'limit exceed': '页面个数超出小程序限制',
  'not found': '页面不存在',
};

export default {
  /**
   * 获取页面实例
   * @param alpha 距离当前页面的距离，如当前页，不传或传0，上一页，传1
   * @return {*}
   */
  getPage(alpha = 0) {
    const currentPages = Taro.getCurrentPages();
    if (currentPages.length) {
      if (!alpha) {
        alpha = 0;
      }

      const index = currentPages.length - 1 - alpha;

      return currentPages[index];
    }

    console.warn('Can\'t access to current page in App.js! It\'ll only be available in Pages');

    return null;
  },

  _needReloadPages: {},

  shouldPageReload(path?: string) {
    path = path || this.currentRoute;

    const needReloadPageParams = this._needReloadPages[path as string];

    if (needReloadPageParams) {
      delete this._needReloadPages[path as string];
      return needReloadPageParams;
    }
  },

  // 获取当前激活Page实例(无法再App.js中获取该对象)
  get currentPage() {
    return this.getPage();
  },

  /**
   * 获取当前路由路径(绝对路径)
   * @warning 该属性是动态的，与页面之间的关系不是绝对一一对应的，建议使用pagebase上定义的this.currentRoute
   * @return {string}
   */
  get currentRoute() {
    return this.getPageRoute(this.getPage());
  },

  getPageRoute(pageInstance) {
    return pageInstance ? `/${pageInstance.__route__ || pageInstance.route}` : '';
  },

  /**
   * 页面跳转
   *
   * 默认在当前页面至上跳转
   *
   * 如传redirect=true,则关闭当前页面跳转
   * 如传relaunch=true,则关闭所有页面并跳转
   *
   * @param url
   * @param [waitForResponse]
   * @param [redirect]
   * @param [relaunch]
   * @param [replace] alias for redirect
   * @param [data]
   * @return {*}
   */
  async go(url: string, {
    redirect = false,
    relaunch = false,
    replace,
    // 如果需要等待响应，需要自行在目标页面onUnload 时trigger回调
    waitForResponse,
    ...data
  }: {
    redirect?: boolean;
    relaunch?: boolean;
    replace?: boolean;
    // 如果需要等待响应，需要自行在目标页面onUnload 时trigger回调
    waitForResponse?: boolean;
    [propName: string]: any;
  } = {}) {
    if (typeof replace !== 'undefined') {
      redirect = replace;
    }

    const originUrl = url;

    if (data) {
      url = appendParams(url, data);
    }

    if (url.indexOf('/pages/Index/Index') > -1) {
      await Taro.reLaunch({ url });
    } else if (redirect) {
      await Taro.redirectTo({ url });
    } else if (relaunch) {
      if (Taro.reLaunch) {
        await Taro.reLaunch({ url });
      } else {
        await Taro.redirectTo({ url });
      }
    } else {
      await Taro.navigateTo({
        url,
        success: (res) => {
          console.log('navigateTo success', originUrl, res);
        },
        fail: (res) => {
          console.log('navigateTo fail', originUrl, res);
          const errMsg: string = res.errMsg.replace(/^navigateTo:fail\s*/, '');
          let content;
          for (const key in navigateToErrMsgMap) {
            if (errMsg.includes(key)) {
              content = navigateToErrMsgMap[key];
              break;
            }
          }
          tips.showModal({
            title: '打开页面失败',
            content: content || errMsg || '',
            showCancel: false,
          });
        },
      });
    }

    if (waitForResponse) {
      return promiseBridge.register(originUrl);
    }
  },

  replace(url, data = {}) {
    return this.go(url, { redirect: true, ...data });
  },

  relaunch(url, data = {}) {
    return this.go(url, { relaunch: true, ...data });
  },

  /**
   * 后退页面
   *
   * @param delta
   * @return {Promise.<void>}
   */
  async back(delta: number | { reload?: boolean; params?: any } = 1, { reload = false, params = {} }: { reload?: boolean; params?: any } = {}) {
    console.log('back params', delta, reload);

    if (typeof delta !== 'number' && _.isPlainObject(delta)) {
      reload = delta.reload as boolean;
      params = delta.params || {};
      delta = 1;
    }

    console.log('back params after', delta, reload);

    const pageList = Taro.getCurrentPages();
    // 拿到需要回退的页面实例
    const backPage = pageList[pageList.length - (delta as number) - 1];

    if (backPage) {
      if (reload) {
        console.log('reload', reload);
        console.log('this.getPageRoute(backPage)', this.getPageRoute(backPage));

        this.recordNeedReloadPage(this.getPageRoute(backPage), params || {});
      }

      await Taro.navigateBack({ delta: delta as number });
    } else {
      // backPage都找不到，这个时候直接 navigateBack 会导致直接退出小程序，这种 case 回首页
      // 如果明确知道回退页面的路径，建议直接使用 backTo

      this.backHome({ reload });
    }
  },

  /**
   * 回退到固定路由
   *
   * @param {string} path
   * @memberof Router
   */
  async backTo(path, { reload = false, params = {} } = {}) {
    if (path[0] !== '/') path = `/${path}`;

    const pages = getCurrentPages();

    let targetPageIndex = -1;

    const pageRoutes = pages.map(page => this.getPageRoute(page));

    console.log('backTo path', path, { reload, params });
    console.log('pageRoutes', pageRoutes);

    // 从后往前遍历
    for (let i = pageRoutes.length - 1; i >= 0; i--) {
      if (pageRoutes[i] === path) {
        targetPageIndex = i;
        break;
      }
    }

    if (targetPageIndex > -1) {
      const delta = pages.length - 1 - targetPageIndex;

      console.log('find target page', delta);

      this.back(delta, {
        reload,
        params,
      });
    } else {
      console.log('Cannot find target page, relaunching');
      try {
        await this.relaunch(path);
      } catch (err) {
        console.error(`relaunch ${path} 失败，返回首页`, err);
        this.backHome();
      }
    }
  },

  /**
   * 回退到满足条件的路由
   *
   * @param {(page) => boolean} checkFn
   * @memberof Router
   */
  async backToByCond(checkFn: (page) => boolean, { reload = false, params = {} } = {}) {
    if (!checkFn) {
      return;
    }

    const pages = getCurrentPages();

    let targetPageIndex = -1;

    // 从后往前遍历
    for (let i = pages.length - 1; i >= 0; i--) {
      if (checkFn(pages[i])) {
        targetPageIndex = i;
        break;
      }
    }

    if (targetPageIndex > -1) {
      const delta = pages.length - 1 - targetPageIndex;

      console.log('find target page', delta);

      this.back(delta, {
        reload,
        params,
      });
    }
  },

  // 回首页
  backHome({ reload = false, params = {}, tab = 'home' }: {
    reload?: boolean;
    params?: any;
    tab?: string
  } = {}) {
    // // 当前就在首页
    // if (this.currentRoute.indexOf('home-page/home-page') > -1) {
    //   this.currentPage.onShow();
    // } else {
    //   return this.switchTab('home');
    // }
    const path = '/pages/Index/Index';

    if (reload) {
      this.recordNeedReloadPage(path, params);
    }

    this.go(path, { tab });
  },

  // 记录哪个页面需要更新
  recordNeedReloadPage(path = '/pages/Index/Index', params = {}) {
    this._needReloadPages[path] = params;
  },
};
