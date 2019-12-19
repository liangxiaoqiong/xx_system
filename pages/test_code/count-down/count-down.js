// pages/test_code/count-down/count-down.js
var util = require('../../../utils/util.js')
Page({
  data: {
    windowHeight: 654,
    maxtime: "",
    isHiddenLoading: true,
    isHiddenToast: true,
    dataList: {},
    countDownDay: 0,
    countDownHour: 0,
    countDownMinute: 0,
    countDownSecond: 0,
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo( {
      url: '../logs/logs'
    })
  },
  onLoad: function() {
    this.setData( {
      windowHeight: wx.getStorageSync( 'windowHeight' )
    });
  },

  // 页面渲染完成后 调用
  onReady: function () {
    var totalSecond = 94866588;

    var interval = setInterval(function () {
      // 秒数
      var second = totalSecond;

      // 天数位
      var day = util.timeTo_('day', second)

      // 小时位
      var hr = util.timeTo_('hour', second)

      // 分钟位
      var min = util.timeTo_('min', second)

      // 秒位
      var sec =  util.timeTo_('sec', second)

      this.setData({
        countDownDay: day,
        countDownHour: hr,
        countDownMinute: min,
        countDownSecond: sec,
      });
      totalSecond--;
      if (totalSecond < 0) {
        clearInterval(interval);
        wx.showToast({
          title: '活动已结束',
        });
        this.setData({
          countDownDay: '00',
          countDownHour: '00',
          countDownMinute: '00',
          countDownSecond: '00',
        });
      }
    }.bind(this), 1000);
  },

  //cell事件处理函数
  bindCellViewTap: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../babyDetail/babyDetail?id=' + id
    });
  }
})
