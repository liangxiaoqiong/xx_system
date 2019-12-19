// components/payment/payment.js
var api = require('../../utils/wxApi.js')
Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
    addGlobalClass: true
  },
  properties: {
    payMethod: {
      type: Object
    },
    parentType: {
      type: String, //父级页面类别 【settlement：确认订单页】
      value: ''
    },
    orderData: {
      type: Object
    }
  },
  data: {
    load: {
      isBusy: false
    },
    isHidePayWayLayer: true,
    order_id: ''
  },
  methods: {
    isPayWayLen: function(options, price){
      if( price <= 0){
        this.changePayWay({currentTarget: {dataset: {way: 0}}})//价格=0，直接线下支付
      } else {
        var payLen = 0
        var payM = ''
        if(+options.wxpay === 1){
          payLen++;
          payM = '1';
        }
        if(+options.cashpay === 1){
          payLen++;
          payM = '0';
        }
        if(+payLen <= 0){
          return api.toastError('该商家暂无支付方式')
        } else {
          if(+payLen === 1){
            this.changePayWay({currentTarget: {dataset: {way: payM}}})//该商家只开启一种支付方式，直接下单支付
          }
          else{
            this.showPayWayLayer()
          }
        }
      }

    },
    /**region 支付方式弹框 start*/
    showPayWayLayer: function () {
      this.setData({
        isHidePayWayLayer: false
      })
    },
    hidePayWayLayer: function () {
      this.setData({
        isHidePayWayLayer: true
      })
    },
    changePayWay: function (event) {
      wx.showLoading({
        title: '支付中',
      })
      var way = event.currentTarget.dataset.way
      if(this.data.parentType === 'settlement') {
        this.triggerEvent('myevent', way)
      } else {
        var options = {
          store_id: wx.getStorageSync('store_id'),
          total_fee: this.data.orderData.totalprice,
          order_id: this.data.orderData.order_id,
          f: wx.getStorageSync('store_id'),
          out_trade_no: this.data.orderData.order_id,
          type: 0,
          member_id: wx.getStorageSync('member_id'),
          channel_id: wx.getStorageSync('storeData').channel_id,
          login_token: wx.getStorageSync('login_token')
        }
        this.submitPay(way, options)
      }
    },
    /**endregion 支付方式弹框 end*/



    submitPay: function(pay_way, options){
      var self = this
      if(+pay_way === 1) {
        self.wxPay(options) //微信支付
      } else {
        //线下支付
        if(self.data.parentType === 'settlement') {
          self.hidePayWayLayer()
          /*wx.showToast({
            title: '支付成功',
            icon: 'success',
            duration: 2000
          })*/
          wx.hideLoading()
          wx.showModal({
            title: '支付成功',
            content: '',
            cancelText: '返回首页',
            confirmColor: '#f82e2e',
            success (res) {
              if (res.confirm) {
                //进入订单详情页
                wx.navigateTo({
                  url: '../../order/order-info/order-info?order_id='+ options.order_id + '&toBack=' + self.data.parentType+'&pay_success=1'
                })
              } else if (res.cancel) {
                //进入首页
                wx.navigateTo({
                  url: '../../classify/classify'
                })
              }
            }
          })
        } else {
          //重新支付
          var query = {
            user_type: 'buyer',
            member_id: wx.getStorageSync('member_id'),
            store_id: wx.getStorageSync('store_id'),
            key: wx.getStorageSync('token'),
            client: 'mini',
            comchannel_id: wx.getStorageSync('storeData').channel_id,
            order_id: options.order_id,
            pay_type: pay_way
          }
          api.wxRequest({
            url: '/index.php?act=Order&op=exchangeOrderPayTypeState',
            data: query,
            header: {
              'contentType': 'application/x-www-form-urlencoded'
            }
          }).then(function (res) {
            //进入订单详情页
            self.hidePayWayLayer()
            /*wx.showToast({
              title: '支付成功',
              icon: 'success',
              duration: 2000
            })*/
            wx.hideLoading()
            wx.showModal({
              title: '支付成功',
              content: '',
              cancelText: '返回首页',
              confirmColor: '#f82e2e',
              success (res) {
                if (res.confirm) {
                  if(self.data.parentType === 'orderinfo') {
                    self.triggerEvent('myevent')
                  } else {
                    //进入订单详情页
                    wx.navigateTo({
                      url: '../../order/order-info/order-info?order_id='+options.order_id + '&toBack=' + self.data.parentType+'&pay_success=1'
                    })
                  }
                } else if (res.cancel) {
                  //进入首页
                  wx.navigateTo({
                    url: '../../classify/classify'
                  })
                }
              }
            })
          })
        }
      }
    },
    /******************统一下单接口请求*******************/
    wxPay: function (options) {
      var self = this
      var total_fee = ((+options.total_fee) * 100).toFixed(0)
      if (self.data.parentType === 'wxpay') {
        total_fee = ((+options.total_fee)).toFixed(0)
      }
      var query = {
        store_id: wx.getStorageSync('store_id'),
        total_fee: total_fee,
        order_id: options.order_id,
        f: options.f,
        out_trade_no: options.order_id,
        type: options.type,
        member_id: options.member_id,
        channel_id: options.channel_id,
        login_token: wx.getStorageSync('login_token')
        //code: options.code
      }
      self.setData({
        order_id: options.order_id
      })
      api.wxRequest({
        url: '/index.php?act=SPay&op=wxpay',
        data: query,
        header: {
          'contentType': 'application/x-www-form-urlencoded'
        },
      }).then(function (res) {
        console.log(res.data)
        var prama = {
          timeStamp: res.data.timeStamp,
          nonceStr: res.data.nonceStr,
          package: res.data.package,
          signType: res.data.signType,
          paySign: res.data.paySign
        }
        self.wxPayment(prama)

      }).catch(function () {
        /*//进入订单详情页
        wx.navigateTo({
          url: '../../order/order-info/order-info?order_id='+options.order_id + '&toBack=' + self.data.parentType
        })*/
      })
    },
    /******************调起小程序微信支付*******************/
    wxPayment: function (prama) {
      var self = this
      wx.hideLoading()
      wx.requestPayment({
        'timeStamp': prama.timeStamp,
        'nonceStr': prama.nonceStr,
        'package': prama.package,
        'signType': prama.signType,
        'paySign': prama.paySign,
        //小程序微信支付成功的回调通知
        'success': function (res) {
          console.log("支付成功");
          self.hidePayWayLayer()
          /*wx.showToast({
            title: '支付成功',
            icon: 'success',
            duration: 2000
          })*/
          wx.hideLoading()
          wx.showModal({
            title: '支付成功',
            content: '',
            cancelText: '返回首页',
            confirmColor: '#f82e2e',
            success (res) {
              if (res.confirm) {
                setTimeout(function () {
                  if (self.data.parentType === 'orderinfo') {
                    self.triggerEvent('myevent')
                  } else if (self.data.parentType === 'wxpay') {
                    wx.navigateBack({delta: 2})
                  } else {
                    //进入订单详情页
                    wx.navigateTo({
                      url: '../../order/order-info/order-info?order_id=' + self.data.order_id + '&toBack=' + self.data.parentType+'&pay_success=1'
                    })
                  }
                },1000)
              } else if (res.cancel) {
                //进入首页
                wx.navigateTo({
                  url: '../../classify/classify'
                })
              }
            }
          })
        },
        //小程序支付失败的回调通知
        'fail': function (res) {
          console.log(JSON.stringify(res));
          console.log("支付失败,准备修改数据")
          //进入订单详情页
          self.hidePayWayLayer()
          /*wx.showToast({
            title: '支付失败',
            icon: 'none',
            duration: 2000
          })*/
          wx.hideLoading()
          wx.showModal({
            title: '支付失败',
            content: '',
            cancelText: '返回首页',
            confirmColor: '#f82e2e',
            success (res) {
              if (res.confirm) {
                setTimeout(function () {
                  if(self.data.parentType === 'orderinfo') {
                    self.triggerEvent('myevent')
                  } else if (self.data.parentType === 'wxpay') {
                    wx.navigateBack({delta: 1})
                  } else {
                    //进入订单详情页
                    wx.navigateTo({
                      url: '../../order/order-info/order-info?order_id='+self.data.order_id + '&toBack=' + self.data.parentType+'&pay_success=0'
                    })
                  }
                }, 1000)
              } else if (res.cancel) {
                //进入首页
                wx.navigateTo({
                  url: '../../classify/classify'
                })
              }
            }
          })
        }
      })
    }
  }
})
