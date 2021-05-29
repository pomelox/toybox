import React, {
  useRef,
  useState,
  createContext,
  useContext,
  useEffect,
  forwardRef,
  useImperativeHandle,
  Ref,
  useMemo,
} from 'react';
import * as wxlib from '@wxlib';
import { Handle } from '@utillib';
import { View, Block } from '@tarojs/components';
import { LoadingBar, LoadingBarInterface } from '@components/LoadingBar/LoadingBar';

export const PageContext = createContext<PageContextValue>(null as any);

interface useGlobalComponentsReturn extends GlobalComponentsInterface {
  ready: boolean;
}

export const useGlobalComponents = (): useGlobalComponentsReturn => {
  const pageContextValue = useContext(PageContext);

  if (pageContextValue) {
    return {
      ...pageContextValue.globalComponents,
      ready: true,
    };
  }

  return {
    ready: false,
  } as any;
};

export interface PageContextValue {
  globalComponents: GlobalComponentsInterface;
  componentReady: boolean;
}

export interface PageWrapperProps {
  children?: React.ReactNode;
  loadingBarColor?: string;
  useCustomNavBar?: boolean;
  useTabBar?: boolean;
}

// 用 PageWrapper 暴露全局组件，子组件可用 useGlobalComponents 拿到组件
export const PageWrapper = forwardRef(
  (
    { children, loadingBarColor, useCustomNavBar, useTabBar }: PageWrapperProps,
    ref: Ref<GlobalComponentsInterface>
  ) => {
    const { tabBarHeight } = useMemo(() => wxlib.system.info, []);
    const globalComponentsRef = useRef<GlobalComponentsInterface>(null as any);
    const [componentReady, setComponentReady] = useState<boolean>(false);

    const pageContextValue: PageContextValue = {
      get globalComponents() {
        return globalComponentsRef.current;
      },
      componentReady,
    };

    useImperativeHandle(ref, () => pageContextValue.globalComponents);

    useEffect(() => {
      if (globalComponentsRef.current && !componentReady) {
        setComponentReady(true);
      }
    }, [componentReady]);

    return (
      <PageContext.Provider value={pageContextValue}>
        <View
          style={{
            paddingBottom: useTabBar ? tabBarHeight : 0,
          }}
        >
          {Boolean(componentReady) ? children : null}

          <GlobalComponents
            ref={globalComponentsRef}
            loadingBarColor={loadingBarColor}
            useCustomNavBar={useCustomNavBar}
          />
        </View>
      </PageContext.Provider>
    );
  }
);

export interface GlobalComponentsInterface {
  loadingBar: LoadingBarInterface;
}

export const GlobalComponents = forwardRef(
  (
    {
      loadingBarColor,
      useCustomNavBar,
    }: {
      loadingBarColor?: string;
      useCustomNavBar?: boolean;
    },
    ref: Ref<GlobalComponentsInterface>
  ) => {
    const loadingBar = useRef<Handle<typeof LoadingBar>>(null as any);

    useImperativeHandle(ref, () => ({
      get loadingBar(): LoadingBarInterface {
        return loadingBar.current;
      },
    }));

    return (
      <Block>
        <LoadingBar ref={loadingBar} color={loadingBarColor} useCustomNavBar={useCustomNavBar} />
      </Block>
    );
  }
);

export const wrapPage = (Component, options: PageWrapperProps = {}) => () => (
  <PageWrapper {...options}>
    <Component />
  </PageWrapper>
);
