// components/nav-top-bar/nav-top-bar.js
var util = require('../../utils/util.js')
Component({
  /**
   * 组件的属性列表
   */
  properties: {
  },

  /**
   * 组件的初始数据
   */
  data: {
    heightNav: getApp().globalData.statusBarHeight + getApp().globalData.titleBarHeight,
    statusBarHeight: getApp().globalData.statusBarHeight,
    titleBarHeight: getApp().globalData.titleBarHeight,
    customData: {
      title: '',
      pageSource: ''
    }
  },
  onLoad() {
  },
  /**
   * 组件的方法列表
   */
  methods: {
    initLoad: function (customData) {
      if (typeof customData.title !== 'undefined') {
        this.setData({
          'customData.title': customData.title
        })
      }
      if (typeof customData.pageSource !== 'undefined') {
        this.setData({
          'customData.pageSource': customData.pageSource
        })
      }
      this.setData({
        heightNav: getApp().globalData.statusBarHeight + getApp().globalData.titleBarHeight,
        statusBarHeight: getApp().globalData.statusBarHeight,
        titleBarHeight: getApp().globalData.titleBarHeight,
      })
    },

    // 返回上一页面
    _navback: function () {
      wx.navigateBack()
    },
    // 返回到首页
    _backhome: function () {
      util.linkToIndex()
    }
  }
})
