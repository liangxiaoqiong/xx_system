// components/login/login-layer/login-layer.js
var api = require('../../../utils/wxApi.js')
var util = require('../../../utils/util.js')
Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    isShowLayer: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
  },

  /**
   * 组件的方法列表
   */
  methods: {
    showLayer: function () {
      this.setData({
        isShowLayer: true
      })
    },
    hideLayer: function () {
      this.setData({
        isShowLayer: false
      })
    },
    bindGetUserInfo(e) {
      var self = this
      wx.showLoading({
        title: '登录中...',
      })
      self.hideLayer()
      api.loginInit().then(function (res) {
        //util.linkToIndex()
        self.triggerEvent('logincomplete')
        wx.hideLoading()
      })
    }
  }
})
