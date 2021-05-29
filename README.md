# 项目说明

小程序 demo，基于 taro

# 快速上手

1. 本项目基于 Taro 3.0.10 开发，请先安装（注意和 Taro 3.1 以上版本不兼容）
   ```
   npm install -g @tarojs/cli@3.0.10
   ```
2. 开始开发
   ```
   npm run dev:weapp
   ```
3. 微信开发者工具导入项目
   - 目录: `/dist`
   - appid: wx73882719733bd1fd
4. 开发者工具 - 设置 - 项目设置，修改以下选项（原因见： http://taro-docs.jd.com/taro/docs/before-dev-remind/ ）
   - 关闭 ES6 转 ES5
   - 关闭 上传代码时样式自动补全
   - 关闭 上传代码时自动压缩混淆

# 注意

- worker环境
  - 不支持所有的 wx.xxx
  - 不支持 BigInt
  - 开发者工具有 WXWebAssembly，但是真机上没有

- 网络
  - iOA + Tencent-Wifi 针对udp有特殊的网络策略，在pc上测试 UdpSocket 时最好建个局域网或者连热点