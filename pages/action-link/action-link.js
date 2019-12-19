// pages/action-link/action-link.js
Page({

  data: {
    webViewUrl: ''
  },
  onLoad: function () {
    var actionUrl = wx.getStorageSync('action_url')
    //https://dev.duinin.com/index.php?c=Goods&a=zhuanqu_list&gc_id=35&title=饮料酒水&se=3
    var url = actionUrl + '&f='+wx.getStorageSync('member_id')+'&key='+wx.getStorageSync('token')+'&miniprogram_from=1'
    this.setData({
      webViewUrl: url
    })
  }
});
