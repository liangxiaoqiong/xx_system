// pages/address/address-list/address-list.js
var api = require('../../../utils/wxApi.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    loadCompeted: false,
    default_address_id: 0,
    addressList: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.setData({
      default_address_id: wx.getStorageSync('default_address_id')
    })
  },
  onShow: function(){
    this.getAddressList()
  },
  getAddressList: function () {
    var self = this
    api.wxRequest({
      url: '/index.php?act=cntaddress&op=syncdata',
      data: {version: 0},
      header: {
        'contentType': 'application/x-www-form-urlencoded'
      }
    }).then(function (res) {
      self.setData({
        addressList: res.data.citems,
        loadCompeted: true
      })
    })
  },
  linkAddressInfo: function (event) {
    var item = event.currentTarget.dataset.item
    getApp().globalData.editAddress = item
    wx.navigateTo({
      url: '/pages/address/address-info/address-info?id=' + item.address_id
    })
  },
  selectAddress: function (event) {
    var address_id = event.currentTarget.dataset.addressid
    wx.setStorageSync('default_address_id', address_id)
    var pages = getCurrentPages()
    if (pages[pages.length - 2].route === 'pages/order/cart-settlement/cart-settlement') {
      wx.redirectTo({
        url: '/pages/order/cart-settlement/cart-settlement'
      })
    }
  }
})
