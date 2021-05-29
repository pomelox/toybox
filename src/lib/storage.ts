import { pify } from './pify';
import { isBrowser, isMiniProgram } from "./env-detect";

declare const localStorage;

export const storage = {
	async getItem(key) {
		try {
			if (isMiniProgram) {
				const { data } = await pify<WechatMiniprogram.GetStorageOption, WechatMiniprogram.GetStorageSuccessCallbackResult>(wx.getStorage)({ key });
				return data;
			} else if (isBrowser) {
				return localStorage.getItem(key);
			}
		} catch (err) {
			return null;
		}
	},
	async setItem(key, data) {
		try {
			if (isMiniProgram) {
				await pify<WechatMiniprogram.SetStorageOption, WechatMiniprogram.GeneralCallbackResult>(wx.setStorage)({
					key,
					data
				});
			} else if (isBrowser) {
				localStorage.setItem(key, data);
			}
		} catch (err) {
			console.error('setStorage error', err);
		}
	},
	async removeItem(key) {
		try {
			if (isMiniProgram) {
				await pify<WechatMiniprogram.RemoveStorageOption, WechatMiniprogram.GeneralCallbackResult>(wx.removeStorage)({ key });
			} else if (isBrowser) {
				localStorage.removeItem(key);
			}
		} catch (err) {
			console.error('removeStorage error', err);
		}
	},
};
