// pages/user/user.js
Page({
  data: {
    userInfo: {},
    storeData: {},
    psWay: ''
  },
  onLoad: function (options) {
    this.setData({
      userInfo: wx.getStorageSync('userInfo'),
      storeData: wx.getStorageSync('storeData'),
      psWay: getApp().globalData.psWay,
    })
  },
})
