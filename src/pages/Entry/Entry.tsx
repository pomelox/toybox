import React, { useEffect, useState, useRef } from 'react';
import { View } from '@tarojs/components';
import { wrapPage } from '@src/PageWrapper';
import { AtGrid } from 'taro-ui';
import '@taro-ui-style/components/grid.scss';
import * as wxlib from '@wxlib';

export default wrapPage(() => {
  const panels = [
    {
      title: '小学学习',
      list: [
        {
          value: '100以内加减法',
          path: '/pages/study/Math/Math',
        },
      ],
    },
  ];

  let isNavigating = false;
  const onNavigate = async (item) => {
    if (!item.path || isNavigating) {
      return;
    }
    isNavigating = true;
    try {
      console.log('onNavigate', item);
      wxlib.router.go(item.path, item.params);
    } finally {
      isNavigating = false;
    }
  };

  return (
    <View className="entry-page">
      {panels.map((panel) => (
        <View className="panel">
          <View className="panel-title">{panel.title}</View>
          <View className="panel-content">
            <AtGrid mode="rect" columnNum={2} data={panel.list} onClick={(item) => onNavigate(item)} />
          </View>
        </View>
      ))}
    </View>
  );
});
