/*pages/order/order-list/order-list.js*/
var api = require('../../../utils/wxApi.js')
Page({
  data: {
    loadCompleted: false,
    //order_state = 0未接单，待接单
    //order_state = 1已接单，待发货
    //order_state = 2交易成功
    //order_state = 3交易成功
    //order_state = 6待付款[待支付||已取消]
    //order_state = 6 && cancel_nopay = 1：已取消订单[买家手动取消||系统自动取消]
    //order_state = 6 && cancel_nopay != 1：未支付，待支付
    //order_state = 7未收货
    orderData: {},
    orderRequestQuery: {},//订单接口公共参数
    payMethod: {},
    thisOrderData: {}
  },
  onLoad: function () {
    var orderRequestQuery = {
      user_type: 'buyer',
      member_id: wx.getStorageSync('member_id'),
      store_id: wx.getStorageSync('store_id'),
      key: wx.getStorageSync('token'),
      client: 'mini',
      comchannel_id: wx.getStorageSync('storeData').channel_id
    }
    this.setData({
      orderRequestQuery: orderRequestQuery,
      payMethod: {wxpay: wx.getStorageSync('storeData').wxpay, cashpay: wx.getStorageSync('storeData').cashpay}
    })
  },
  onShow: function(){
    this.getOrderList()
  },
  getOrderList: function(){
    var self = this
    var sdata = this.data
    api.wxRequest({
      url: '/index.php?act=Order&op=orderList',
      data: sdata.orderRequestQuery,
      header: {
        'contentType': 'application/x-www-form-urlencoded'
      }
    }).then(function (res) {
      res.data.list.forEach(function (value, index, json) {
        value.state_btn_type = 'order-state-btn_2'
        switch (value.state_info) {
          case '未接单':
            value.state_info = '等待接单'
            break;
          case '自动取消未支付订单':
            value.state_info = '已取消'
            value.state_btn_type = 'order-state-btn_1'
            break;
          case '下单未支付':
            value.state_info = '等待支付'
            break;
          case '交易完成':
            value.state_info = '已完成'
            value.state_btn_type = 'order-state-btn_3'
            break;
          default:
            break;
        }
      })
      self.setData({
        orderData: res.data,
        loadCompleted: true
      })
    })
  },
  // 立即支付
  orderTpPay (event) {
    var item = event.currentTarget.dataset.item
    this.setData({
      thisOrderData: item
    })
    this.paymentComponent = this.selectComponent('#payment')
    this.paymentComponent.isPayWayLen(this.data.payMethod ,this.data.thisOrderData.totalprice)
  },
  // 再来一单
  orderToCreat (event) {
    var self = this
    wx.showLoading({
      title: '加载中',
    })
    var item = event.currentTarget.dataset.item
    //再来一单
    var order_content = JSON.parse(item.order_content)
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
      order_content.forEach(function (value, index) {
        self.syncPageData(
          {cart_num: res.data.total_num, buy_num: res.data.total_buy_num, is_cart_multi: res.data.is_cart_multi, goods_id: value.goods_id})
      })
      wx.hideLoading()
      wx.navigateTo({
        url: '/pages/order/cart-settlement/cart-settlement'
      })
    })
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
  linkOrderInfo: function (event) {
    var order_id = event.currentTarget.dataset.orderid
    wx.navigateTo({
      url: '/pages/order/order-info/order-info?order_id=' + order_id +'&toBack=2'
    })
  }
})
