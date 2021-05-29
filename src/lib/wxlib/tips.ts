import Taro from '@tarojs/taro';
import system from './system';

let hasModalShow = false;

export interface ShowModalOptions extends Taro.showModal.Option {
  enforce?: boolean;
}

export default {
  async showModal(options: ShowModalOptions) {
    Taro.hideToast();

    if (!options.enforce && (system.appHiding || hasModalShow)) {
      console.log('appHiding, cannot show modal');
      return;
    }

    hasModalShow = true;

    const isConfirm = await Taro.showModal(options);

    hasModalShow = false;

    return isConfirm;
  },
};
