/*pages/order/order-info/order-info.js*/
var api = require('../../../utils/wxApi.js')
Page({
  data: {
    loadCompleted: false,
    toBack: '1',
    //==1支付完成：关闭所有页面返回上一页面为分类页(首页)
    //==2订单列表进入的：关闭当前页面返回上一页面为订单列表页
    //==3订单详情进入的：关闭当前页面返回上一页面为订单列表页
    orderRequestQuery: {},
    payMethod: {},
    info: {},
    tempOrder: {
      order_state: {
        title: '',
        desc: ''
      }//订单状态
    },
  },
  //监听返回上一页面
  onUnload: function () {//如果页面被卸载时被执行,自定义页面跳转方法
    if(this.data.toBack === 'settlement'){
      var psWay = getApp().globalData.psWay
      if(psWay === 3) {
        var pend_num_id = wx.getStorageSync('pend_num_id')
        wx.reLaunch({
          url: '/pages/classify/classify?scene='+pend_num_id
        })
      } else {
        wx.reLaunch({
          url: '/pages/classify/classify'
        })
      }
    } else if(this.data.toBack === 'orderinfo'){
      wx.redirectTo({
        url: '/pages/order/order-list/order-list'
      })
    }
  },
  onLoad: function (options) {
    var orderRequestQuery = {
      user_type: 'buyer',
      member_id: wx.getStorageSync('member_id'),
      store_id: wx.getStorageSync('store_id'),
      key: wx.getStorageSync('token'),
      client: 'mini',
      comchannel_id: wx.getStorageSync('storeData').channel_id,
      order_id: options.order_id,
      orderId: options.order_id
    }
    this.setData({
      toBack: options.toBack,
      orderRequestQuery: orderRequestQuery,
      payMethod: {wxpay: wx.getStorageSync('storeData').wxpay, cashpay: wx.getStorageSync('storeData').cashpay}
    })
    this.getOrderInfo()
  },
  getOrderInfo: function(){
    wx.showLoading({
      title: '订单加载中...',
    })
    var self = this
    var sdata = this.data
    api.wxRequest({
      url: '/index.php?act=Order&op=orderPhotoS',
      data: sdata.orderRequestQuery,
      header: {
        'contentType': 'application/x-www-form-urlencoded'
      }
    }).then(function(res){
      var order_ = res.data.order
      //余额+商家积分抵用+平台积分抵用+平台优惠券+优惠券+满减
      var order_discount = +((+order_.balance) + (+order_.credits_exmoney) + (+order_.platform_credits_exmoney) + (+order_.thirdpart_momey) + (+order_.platform_coupons_money) + (+order_.coupons_exmoney) + (+order_.mj_price))
      var order_state = {}
      switch (+order_.order_state){
        case 0:
          order_state = {
            icon: 'success',
            bg_color: 'red',
            title: '支付成功',
            desc: '订单支付成功，等待商家备货'
          }
          break;
        case 1:
          order_state = {
            icon: 'success',
            title: '已接单',
            desc: '等待商家发货'
          }
          break;
        case 2:
          order_state = {
            icon: 'success',
            title: '交易成功',
            desc: ''
          }
          break;
        case 5:
          order_state = {
            bg_color: 'grey',
            icon: 'cancel',
            title: '商家取消订单',
            desc: '取消原因：' + order_.close_reason
          }
          break;
        case 6:
          if (+order_.cancel_nopay === 1) {
            order_state = {
              bg_color: 'grey',
              icon: 'cancel',
              title: '订单取消',
              desc: '本次订单已取消'
            }
          } else {
            order_state = {
              bg_color: 'red',
              icon: 'wait',
              title: '等待支付',
              desc: '超过30分钟未支付，订单将失效'
              //desc: '超过'+wx.getStorageSync('storeData').nopay_time+'分钟未支付，订单将失效'
            }
          }
          break;
        case 7:
          order_state = {
            icon: 'success',
            title: '待收货'
          }
          break;
      }
      self.setData({
        info: res.data,
        tempOrder: {
          order_state: order_state
        },
        loadCompleted: true
      })
      wx.hideLoading()
    }).catch(function () {
      self.setData({
        loadCompleted: true
      })
    })
  },
  //删除订单
  delOrder: function(){
    var self = this
    var sdata = this.data
    wx.showModal({
      title: '确认删除该订单？',
      confirmColor: '#f82e2e',
      success(res) {
        if (res.confirm) {
          api.wxRequest({
            url: '/index.php?act=order&op=delete',
            data: sdata.orderRequestQuery,
            header: {
              'contentType': 'application/x-www-form-urlencoded'
            }
          }).then(function (res) {
            wx.showToast({
              title: '订单删除成功',
              duration: 2000
            })
            setTimeout(function () {
              wx.navigateBack()
            },1000)
          })
        }
      }
    })
  },
  //再来一单
  createOrder: function () {
    var self = this
    var order_content = JSON.parse(self.data.info.order.order_content)
    var itemData = []
    order_content.forEach(function (value, index) {
      itemData[index] =  {
        "gs_id": value.gs_id,
        "num": value.gou_num
      }
    })
    api.wxRequest({
      url: '/index.php?act=Cart&op=index&action=batchMod',
      data: { cart_data: JSON.stringify(itemData) }
    }).then(function (res) {
      order_content.forEach(function (value) {
        self.syncPageData(
          {cart_num: res.data.total_num, buy_num: res.data.total_buy_num, is_cart_multi: res.data.is_cart_multi, goods_id: value.goods_id})
      })
      wx.navigateTo({
        url: '/pages/order/cart-settlement/cart-settlement'
      })
    })
  },
  //取消未支付订单
  cancelOrder: function () {
    var self = this
    var sdata = this.data
    wx.showModal({
      title: '确定取消订单？',
      confirmColor: '#f82e2e',
      success(res) {
        if (res.confirm) {
          api.wxRequest({
            url: '/index.php?act=order&op=CancelNoPay',
            data: sdata.orderRequestQuery,
            header: {
              'contentType': 'application/x-www-form-urlencoded'
            }
          }).then(function (res) {
            self.getOrderInfo()
            wx.showToast({
              title: '订单取消成功',
              duration: 2000
            })
          })
        }
      }
    })
  },
  //立即支付
  payNow: function () {
    this.paymentComponent = this.selectComponent('#payment')
    this.paymentComponent.isPayWayLen(this.data.payMethod, this.data.info.order.totalprice)
  },
  /*同步【分类页】的buy_num数据*/
  syncPageData: function (options) {
    var pages = getCurrentPages()
    pages.forEach(function (value, index) {
      //同步分类页数据
      if (value.route == 'pages/classify/classify') {
        pages[index].classifyPageChange(options)
      }
    })
  },
})
