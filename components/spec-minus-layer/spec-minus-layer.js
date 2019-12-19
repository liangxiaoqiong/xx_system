/*components/buy-num-layer*/
var api = require('../../utils/wxApi.js')
var app = getApp()
Component({
  options: {
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {},
  /**
   * 组件的初始数据
   */
  data: {
    goodsItem: {},
    isShowMinusLayer: false,
    minusCart: {},
  },
  /**
   * 组件的方法列表
   */
  methods: {

    /** region 购物车数量--弹框 start*/
    showSpecMinusLayer: function(goodsItem){
      var self = this
      var sdata = this.data
      self.setData({
        goodsItem: goodsItem
      })
      //获取商品在购物车个规格数据
      api.wxRequest({
        url: '/index.php?act=Cart&op=index&action=getGoodsSpecDataInCart',
        data: {goods_id: sdata.goodsItem.goods_id}
      }).then(function (res) {
        self.setData({
          minusCart: res.data,
          isShowMinusLayer: true
        })
      })
    },
    hideSpecMinusLayer: function(){
      this.setData({
        isShowMinusLayer: false,
        minusCart: {},
      })
    },
    minusNumAction: function(event) {
      var self = this
      var sdata = this.data
      var index = event.currentTarget.dataset.index
      var getItem = sdata.minusCart.items[index].buy_num
      var numResult = (+getItem) - 1
      var setItem = 'minusCart.items['+index+'].buy_num'
      self.setData({
        [setItem]: numResult
      })
    },
    //小程序批量修改购物车数量
    submitSpecMinus: function(){
      var self = this
      var sdata = this.data
      var itemData = []
      sdata.minusCart.items.forEach(function(value, index){
        itemData[index] = {
          "gs_id": value.gs_id,
          "num": value.buy_num
        }
      })
      api.wxRequest({
        url: '/index.php?act=Cart&op=index&action=batchMod',
        data: {cart_data: JSON.stringify(itemData)}
      }).then(function(res){
        self.setData({
          ['goodsItem.buy_num']: res.data.total_buy_num
        })
        self.hideSpecMinusLayer()
        var options = {
          cart_num: res.data.total_num,
          buy_num: res.data.total_buy_num,
          is_cart_multi: res.data.is_cart_multi,
          goods_id: sdata.goodsItem.goods_id,
          isSyncGoodsItem: true
        }
        self.triggerEvent('syncnum', options)
      })
    },
    /** endregion 购物车数量--弹框 end*/
  }
})