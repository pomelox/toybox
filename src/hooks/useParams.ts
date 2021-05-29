import { useRouter } from '@tarojs/taro';
import * as wxlib from '@wxlib';
import { useEffect } from 'react';
import { parseParams, parseUrl } from '@utillib';

export const useParams = (): any => {
  const { params } = useRouter();

  const result = parseParams(params);

  // 自动解析 q 参数
  if (result.q) {
    const uri = parseUrl(result.q);

    if (uri && uri.query) {
      Object.assign(result, uri.query);
    }
  }

  useEffect(() => {
    console.log(`${wxlib.router.currentRoute} on Load with params`, params);
  }, [params]);

  return result;
};
