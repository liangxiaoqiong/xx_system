//app.js
App({
  onLaunch: function (ops) {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    //小程序在群里打开后，获取情景值和shareTicket
    console.log("ops:", ops)
    if(typeof ops.query.pend_recommend !== 'undefined'){
      var pend_recommend_ = ops.query.pend_recommend.split('@')
      var pend_num_id = pend_recommend_[0]
      var recommend_id = pend_recommend_[1]
      wx.setStorageSync('pend_num_id', pend_num_id)
      wx.setStorageSync('recommend_id', recommend_id)
    }
    // 获取设备顶部窗口的高度（不同设备窗口高度不一样，根据这个来设置自定义导航栏的高度）
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.statusBarHeight = res.statusBarHeight
        if (res.model.indexOf('iPhone') !== -1) {
          this.globalData.titleBarHeight = 44
        } else {
          this.globalData.titleBarHeight = 48
        }
      }
    })
  },
  globalData: {
    psWay: '1', // 区分配送方式：1快递配送（默认）、2上门自提、3小程序堂食订单
    /*member_id: '',
    token: '',
    //isAuthorize: false,//是否授权获取用户信息
    storeData: {},*/
    statusBarHeight: 0, // 状态栏高度
    titleBarHeight: 0,
  }
})
