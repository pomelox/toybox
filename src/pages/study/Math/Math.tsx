import React, { useEffect, useState, useRef } from 'react';
import { View } from '@tarojs/components';
import { wrapPage } from '@src/PageWrapper';
import { AtButton, AtList, AtListItem } from 'taro-ui';
import '@taro-ui-style/components/button.scss';
import '@taro-ui-style/components/list.scss';
import './Math.less';

enum OpEnum {
  Plus = '+',
  Minus = '-',
}
enum FlagEnum {
  Normal = '',
  Carry = '进位',
  Borrow = '借位',
}
type MathItem = {
  num0: number;
  op: OpEnum;
  numAfter: number;
  result: number;
  flag: FlagEnum;
}

enum CondEnum {
  Simple = 'Simple',
  Hard = 'Hard',
  Mix = 'Mix',
}
const condMap = {
  [CondEnum.Simple]: '无进位/借位',
  [CondEnum.Hard]: '仅进位/借位',
  [CondEnum.Mix]: '混合',
};

const getRandomInt = (max: number) => {
  return Math.floor(Math.random()*max);
};
const getRandomIntInRange = (min: number, max: number) => {
  return min + getRandomInt(max - min);
};

const opList = [OpEnum.Plus, OpEnum.Minus];
const opListLen = opList.length;
const getRandomOp = () => {
  return opList[getRandomInt(opListLen)];
};

const getTenDigit = (num: number) => {
  return Math.floor(num/10)%10;
};

const getMathItem: (num0: number, op: OpEnum, numAfter: number) => MathItem = (num0, op, numAfter) => {
  let result: number;
  let flag = FlagEnum.Normal;
  if (op === OpEnum.Plus) {
    result = num0 + numAfter;
    if (num0%10 + numAfter%10 >= 10 || getTenDigit(num0) + getTenDigit(numAfter) >= 10) {
      // 进位
      flag = FlagEnum.Carry;
    }
  } else if (op === OpEnum.Minus) {
    result = num0 - numAfter;
    if (num0%10 - numAfter%10 < 0 || getTenDigit(num0) + getTenDigit(numAfter) < 0) {
      // 借位
      flag = FlagEnum.Borrow;
    }
  }
  return {
    num0,
    op,
    numAfter,
    result,
    flag,
  };
};

const checkCond = (item: MathItem, min: number, max: number, cond: CondEnum) => {
  if (!item) {
    return false;
  }
  const biggest = Math.max(item.num0, item.numAfter, item.result);
  if (biggest < min || biggest > max) {
    return false;
  }
  if (cond === CondEnum.Simple && item.flag !== FlagEnum.Normal) {
    return false;
  }
  if (cond === CondEnum.Hard && item.flag === FlagEnum.Normal) {
    return false;
  }
  return true;
};

const genMathList = (num: number, min = 20, max = 100, cond = CondEnum.Mix) => {
  const list: MathItem[] = [];
  let count = 0;
  let specItem: MathItem;
  if (num >= 20 && max >= 100) {
    // 一定有一题和是max
    const num0 = getRandomIntInRange(10, max - 10);
    const op = OpEnum.Plus;
    const numAfter = max - num0;
    const item = getMathItem(num0, op, numAfter);
    if (checkCond(item, min, max, cond)) {
      specItem = item;
      count++;
    }
  }
  while (count < num) {
    const num0 = getRandomInt(max);
    const op = getRandomOp();
    const numAfter = getRandomInt(op === OpEnum.Minus ? num0 : (max - num0));
    const item = getMathItem(num0, op, numAfter);
    if (checkCond(item, min, max, cond)) {
      list.push(item);
      count++;
    }
  }
  if (specItem) {
    // 随机找个位置
    const pos = getRandomInt(list.length);
    list.splice(pos, 0, specItem);
  }
  return list;
};

export default wrapPage(() => {
  const min = 20;
  const max = 100;
  const num = 20;

  const [mathTitle, setMathTitle] = useState('');
  const [mathList, setMathList] = useState<MathItem[]>([]);
  const [showResult, setShowResult] = useState(false);

  const refresh = (cond: string) => {
    const list = genMathList(num, min, max, cond);
    setMathTitle(condMap[cond] || '');
    setMathList(list);
    setShowResult(false);
  };

  return (
    <View className="math-page">
      <View className="panel">
        <View className="panel-content">
          <View className="btn-item">
            {[CondEnum.Simple, CondEnum.Hard, CondEnum.Mix].map((cond) => (
              <View className="subitem">
                <AtButton type="primary" size="small" onClick={(_) => refresh(cond)}>
                  {condMap[cond]}
                </AtButton>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View className="panel">
        <View className="panel-title" onClick={() => setShowResult(mathList.length > 0 ? !showResult : false)}>
          {mathTitle || `点击按钮生成${max}以内加减法`}
        </View>
        <View className="panel-content">
          <AtList>
            {mathList.map((item, index) => (
              <AtListItem
                className="large-font"
                key={index}
                title={`(${index + 1})　　${item.num0} ${item.op} ${item.numAfter} =`}
                // note={item.flag || ''}
                extraText={showResult ? String(item.result) : '　'}
              />
            ))}
          </AtList>
        </View>
      </View>
    </View>
  );
});
