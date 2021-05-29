import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  Ref,
} from 'react';
import { View, Block } from '@tarojs/components';
import classNames from 'classnames';
import { delay, noop } from '@utillib';
import { useSystemInfo } from "@hooks/useSystemInfo";
import './LoadingBar.less';

function getNextPercent(percent: number): number | false {
  if (percent >= 100) {
    return false;
  }

  percent /= 100;

  let rnd = 0;

  if (percent >= 0 && percent < 0.25) {
    // Start out between 3 - 6% increments
    rnd = (Math.random() * (5 - 3 + 1) + 3) / 100;
  } else if (percent >= 0.25 && percent < 0.65) {
    // increment between 0 - 3%
    rnd = (Math.random() * 3) / 100;
  } else if (percent >= 0.65 && percent < 0.9) {
    // increment between 0 - 2%
    rnd = (Math.random() * 2) / 100;
  } else if (percent >= 0.9 && percent < 0.99) {
    // finally, increment it .5 %
    rnd = 0.005;
  } else {
    // after 99%, don't increment:
    rnd = 0;
  }

  return (percent + rnd) * 100;
}

export interface LoadingBarInterface {
  start: () => void;
  set: (percent: number) => Promise<void>;
  complete: (autoReset?: boolean) => Promise<void>,
  reset: () => Promise<void>;
}

interface LoadingBarProps {
  enable?: boolean;
  autoStart?: boolean;
  color?: string;
  useCustomNavBar?: boolean;
}

export const LoadingBar = forwardRef(({
  enable = true,
  autoStart = false,
  color = '#0066ff',
  useCustomNavBar = false,
}: LoadingBarProps, ref: Ref<LoadingBarInterface>) => {
  const { pageHeaderHeight } = useSystemInfo();
  const loadingBarTimerRef = useRef(-1);
  const loadingBarTimeoutRef = useRef(-1);
  const [percent, setPercent] = useState(0);
  const [complete, setComplete] = useState(false);
  const getNextPercentRef = useRef(noop);

  getNextPercentRef.current = () => {
    return getNextPercent(percent);
  };

  const start = () => {
    if (!complete) {
      clearInterval(loadingBarTimerRef.current);
      loadingBarTimerRef.current = setInterval(() => {
        const nextPercent = getNextPercentRef.current();
        set(nextPercent);
      }, 250);

      clearTimeout(loadingBarTimeoutRef.current);
      // 20秒timeout
      loadingBarTimeoutRef.current = setTimeout(() => {
        clearInterval(loadingBarTimerRef.current);
        completeLoading(true);
      }, 200 * 1000);
    }
  };

  const set = async (percent): Promise<void> => {
    if (typeof percent === 'undefined') {
      return;
    }

    if (percent >= 100) {
      clearInterval(loadingBarTimerRef.current);
      clearTimeout(loadingBarTimeoutRef.current);
    }

    setPercent(percent);
    if (percent >= 100) {
      await delay(250); // 等待动画
      setComplete(true);
      await delay(250); // 等待动画
    }
  };

  const completeLoading = async (autoReset = false) => {
    if (!complete) {
      await set(100);
    }

    if (autoReset) {
      reset();
    }
  };

  const reset = async () => {
    clearInterval(loadingBarTimerRef.current);
    setPercent(0);
    await delay(250); // 等待动画
    setComplete(false);
  };

  useImperativeHandle(ref, () => ({
    start,
    set,
    complete: completeLoading,
    reset,
  }));

  useEffect(() => {
    if (autoStart) {
      start();
    }
  }, [autoStart]);

  return enable ? (
    <View
      className={classNames('loading-bar', {
        'load-complete': complete,
      })}
      style={{
        top: useCustomNavBar ? pageHeaderHeight : 0,
      }}
    >
      <View
        className='bar'
        style={{
          width: `${percent || 0}%`,
          background: color,
        }}
      >
        <View
          className='peg'
          style={{
            boxShadow: `${color} 1px 0 6px 1px;`,
          }}
        />
      </View>
    </View>
  ) : <Block/>;
});
