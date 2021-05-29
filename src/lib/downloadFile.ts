export function downloadFile(url) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      success: (res) => {
          if (res.statusCode === 200) {
              const fs = wx.getFileSystemManager();
              const arrayBuffer = fs.readFileSync(res.tempFilePath);
              console.log('downloadFile success, byteLength', arrayBuffer.byteLength);
              resolve(arrayBuffer);
          } else {
            console.log('downloadFile error', res);
            reject(res);
          }
      },
      fail: (res) => {
        console.log('downloadFile fail', res);
        reject(res);
      },
    });
  });
};