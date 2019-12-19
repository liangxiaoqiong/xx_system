/*components/load-index/load-index.js*/
var api = require('../../utils/wxApi.js')
Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true
  },
  properties: {
    storeData: {
      type: Object
    }
  },
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    isAuthorize: false,
    storeData: {}
  },
  methods: {
    load: function () {
      var self = this
      self.setData({
        storeData: wx.getStorageSync('storeData')
      })
      return new Promise(function (resolve, reject) {
        api.loginInit().then(function (res) {
          self.setData({
            isAuthorize: wx.getStorageSync('isAuthorize')
          })
          if(wx.getStorageSync('storeData') !==''){
            resolve(res)
          } else {
            api.getStoreData().then(function (res) {
              resolve(res)
            })
          }
        })
      })
    },
    bindGetUserInfo(e) {
      if(e.detail.userInfo){
        wx.setStorageSync('isAuthorize', true)
      }else{
        wx.setStorageSync('isAuthorize', false)
      }
      this.setData({
        isAuthorize: wx.getStorageSync('isAuthorize')
      })
      this.triggerEvent('myevent')//刷新重新授权/是否有用户信息
    }
  }
})