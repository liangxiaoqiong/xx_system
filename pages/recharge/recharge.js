// pages/recharge/recharge.js
Page({

  data: {
    webViewUrl: ''
  },
  onLoad: function () {
    var url = 'https://' + wx.getStorageSync('storeData').store_domain +'/index.php?m=Wap&c=Balance&a=rechargeCardList&se='+wx.getStorageSync('store_id')+'&f='+wx.getStorageSync('member_id')+'&key='+wx.getStorageSync('token')+'&miniprogram_from=1'
    this.setData({
      webViewUrl: url
    })
  }
});
