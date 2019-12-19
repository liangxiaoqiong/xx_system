/*components/goods-item/goods-item.js*/
var api = require('../../utils/wxApi.js')
var app = getApp();
Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true
  },
  properties: {
    goodsItem: {
      type: Object
    },
    userInfo: {
      type: [Object, String]
    }
  },
  data: {
    storeData: {}
  },
  ready: function(){
    this.setData({
      storeData: wx.getStorageSync('storeData')
    })
  },
  methods: {
    /**region 商品数量--||++*/
    goodsNumAction: function(event){
      var self = this
      var sdata = this.data
      if (sdata.userInfo === '') {
        self.triggerEvent('login')
        return false
      }
      var type = event.currentTarget.dataset.type
      if ((sdata.goodsItem.spec_length && sdata.goodsItem.spec_length > 1)
        || sdata.goodsItem.spec_option && sdata.goodsItem.spec_option.length > 1) {
        if(type === 'minus'){
          if(+sdata.goodsItem.is_cart_multi !== 1){
            //多规格，购物车只有单个规格，直接--
            var item = {
              gs_id: sdata.goodsItem.gs_id,
              num: (+sdata.goodsItem.buy_num) - 1,
            }
            self.postCartNum(item)
          } else {
            self.showSpecMinusLayer()
          }
        } else {
          //多规格++【累加，而非修改值】
          self.showSpecLayer()
        }
      } else {
        var num = sdata.goodsItem.buy_num
        if(type === 'minus'){
          num = num - 1
        } else {
          if(+sdata.goodsItem.original_goods_storage !== -1 && num >= sdata.goodsItem.original_goods_storage) {
            return api.toastError('库存不足，无法再加')
          } else {
            num = num + 1
          }
        }
        var item = {
          gs_id: sdata.goodsItem.gs_id,
          num: num
        }
        self.postCartNum(item)
      }
    },
    showSpecMinusLayer: function(){
      var options = {
        isShow: true,
        goodsItem: this.data.goodsItem
      }
      this.triggerEvent('specminuslayer', options)
    },
    showSpecLayer: function(){
      var options = {
        isShow: true,
        goodsItem: this.data.goodsItem
      }
      this.triggerEvent('speclayer', options)
    },

    /*提交购物车数据修改 */
    postCartNum: function(item){
      var self = this
      api.wxRequest({
        url: '/index.php?act=Cart&op=index&action=addCart',
        data: item
      }).then(function (res) {
        self.setData({
          ['goodsItem.buy_num']: res.data.buy_num,
          ['goodsItem.is_cart_multi']: res.data.is_cart_multi
        })
        var options = {
          cart_num: res.data.cart_num,
          buy_num: res.data.buy_num,
          is_cart_multi: res.data.is_cart_multi,
          goods_id: self.data.goodsItem.goods_id
        }
        /*++||--购物车数量 同步父组件购物车数量*/
        self.triggerEvent('syncnum', options)  // 将num通过参数的形式传递给父组件

      })
    },

    /*父组件传值同步当前页购买数量【对规格弹框选择完、多规格弹框--完】*/
    syncBuyNum: function(options){
      this.setData({
        ['goodsItem.buy_num']: options.buy_num,
        ['goodsItem.is_cart_multi']: options.is_cart_multi
      })
    },
    /**多规格弹框子组件 "选好"后的触发事件*/
    //跳转=>商品详情页
    linkGoodsInfo: function () {
      //if(this.data.isSearchPage){
        wx.navigateTo({
          url: '/pages/goods-info/goods-info?goods_id='+this.data.goodsItem.goods_id
        })
      //}
    }
  }
})
