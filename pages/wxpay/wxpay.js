// pages/wxpay/wxpay.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)
    this.payment = this.selectComponent('#payment')
    this.payment.wxPay(options)
  }
})
