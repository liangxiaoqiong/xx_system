// component/foot-cart.js
var api = require('../../utils/wxApi.js')
var app = getApp()
Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {
    //传值标题
    goodsInfo: Object
  },

  /**
   * 组件的初始数据
   */
  data: {
    isShowCartGoods: false,//是否显示购物车商品列表
    //购物车数据
    cartData: {
      totalNum: 0
    },
    //购物车按钮文字
    footBtnType: '',//''-选好了，1-商品详情是接龙的商品
    footBtnText: '选好了',//-选好了，-立即接龙
    //促销列表
    mjData: {
      mjList: [],
      isShowMjLayer: false,
      isHadShowLayer: false
    },
    userInfo: ''
  },
  ready() {
    this.loadInit()
  },
  /**
   * 组件的方法列表
   */
  methods: {
    loadInit: function(){
      this.setData({
        userInfo: wx.getStorageSync('userInfo')
      })
      this.getCartNum()
    },
    //获取购物车数量
    getCartNum: function(options){
      var self = this
      this.setData({
        userInfo: wx.getStorageSync('userInfo'),
      })
      if (self.data.userInfo === '') return false
      if(typeof options !== 'undefined'){
        self.setData({
          ['cartData.totalNum']: options.cart_num
        })
      } else {
        api.wxRequest({
          url: '/index.php?act=Cart&op=index&action=getCartNum'
        }).then(function (res) {
          if(res.code === -100){
            console.log(res)
          } else {
            self.setData({
              ['cartData.totalNum']: res.data.total_num
            })
          }
        })
      }
      if(self.data.cartData.totalNum <= 0){
        self.setData({
          isShowCartGoods: false
        })
      }
    },
    //获取购物车数据
    getCartData: function(options, gs_id){
      var self = this
      var sdata = this.data
      api.wxRequest({
        url: '/index.php?act=Cart&op=index'
      }).then(function (res) {
        self.setData({
          cartData: res.data
        })
        if(typeof options !== 'undefined'){
          if ( options === 'submitCheck') {
            self.toSettlement()
          } else if ( options === 'submitCheck2')  {
            var payUrl = '/pages/order/cart-settlement/cart-settlement?id=1&come_source=1&passGoodsId=1&goodsIdArray=' + JSON.stringify([gs_id])
            self.linkToSettlementPage(payUrl)
          }
        }
      })
    },
    //显示||隐藏购物车商品列表
    cartGoodsLayer: function () {
      if(+this.data.cartData.totalNum > 0){
        this.setData({
          isShowCartGoods: !this.data.isShowCartGoods
        })
        if(this.data.isShowCartGoods){
          this.getCartData()
        }
      }
    },
    //清空购物车
    clearCart: function () {
      var self = this
      var sdata = this.data
      wx.showModal({
        title: '确定清空购物车吗?',
        content: '',
        confirmText: '确认清空',
        confirmColor: '#f82e2e',
        success(res) {
          if (res.confirm) {
            wx.showLoading()
            api.wxRequest({
              url: '/index.php?act=Cart&op=index&action=clearCart',
              data: {
                pick_id: app.globalData.scene
              }
            }).then(function (res) {
              var oldCartData = sdata.cartData
              self.setData({
                isShowCartGoods: false,
                cartData: {}
              })
              var arr = {
                goods_id: -1,
                buy_num: 0,
                cart_num: 0,
                clearCart: true
              }
              self.syncParent(arr)
              wx.hideLoading()
              wx.showToast({
                title: '购物车已清空',
                icon: 'success',
                duration: 2000
              })
            })
          }
        }
      })
    },
    /**region 购物车数量--||++*/
    cartNumAction: function (event) {
      var self = this
      var el = event.currentTarget
      var type = el.dataset.type
      var item = el.dataset.item
      var num = item.num
      if(type === 'minus') {
        num = num - 1
      } else {
        if(+item.goods_storage !== -1 && num >= item.goods_storage) {
          return api.toastError('库存不足，无法再加')
        } else {
          num = num + 1
        }
      }
      api.wxRequest({
        url: '/index.php?act=Cart&op=index&action=changeCartGoodsNum',
        data: {
          gs_id: item.gs_id,
          num: num,
          pick_id: app.globalData.scene
        }
      }).then(function(res){
        self.setData({
          cartData: res.data
        })
        var goods_buy_num = 0
        self.data.cartData.cartList.forEach(function (valCart) {
          valCart.sortedItems.forEach(function (valShop) {
            valShop.cartGoods.forEach(function (valGoods) {
              if (valGoods.goods_id == item.goods_id) {
                goods_buy_num += (+valGoods.buy_num)
              }
            })
          })
        })
        var arr = {
          goods_id: item.goods_id,
          buy_num: goods_buy_num,
          cart_num: res.data.totalNum
        }
        self.syncParent(arr)
      })
    },
    /**region 促销、满减 start*/
    //显示||隐藏 修改促销弹框
    showMjLayer: function(event){
      var item = event.currentTarget.dataset.item
      var cartgoods = event.currentTarget.dataset.cartgoods
      this.setData({
        ['mjData.mjList']: item,
        ['mjData.goods_id']: cartgoods.gs_id,
        ['mjData.gId']: cartgoods.gId,
        ['mjData.isShowMjLayer']: true,
        ['mjData.isHadShowLayer']: true
      })
    },
    hideMjLayer: function(event){
      this.data.mjData.mjList = [];
      this.data.mjData.goods_id = '';
      this.data.mjData.gId = '';
      this.setData({
        ['mjData.isShowMjLayer']: false
      })
    },
    //切换修改促销
    changeMjType: function (e) {
      var self = this
      var sdata = this.data
      api.wxRequest({
        url: '/index.php?act=Cart&op=index&action=changeCartGoodsMjId',
        data: {
          gs_id: sdata.mjData.goods_id,
          mj_id: e.detail.value
        }
      }).then(function (res) {
        self.setData({
          cartData: res.data
        })
        self.hideMjLayer()
        wx.showToast({
          title: '该商品已定位到所选活动',
          icon: 'none',
          duration: 2000
        })
      })
    },
    /**endregion 促销、满减 end*/
    /*选好了，=>订单确认页*/
    submitOrder: function () {
      var self = this
      var sdata = this.data
      if(!sdata.mjData.isHadShowLayer){
        self.getCartData('submitCheck')
      } else {
        self.toSettlement()
      }
    },
    //跳转到结算页
    toSettlement: function () {
      var self = this
      var sdata = this.data
      if (+sdata.footBtnType === 1) {
        //商品详情接龙
        self.isPageGoodsChains()
      } else {
        var payUrl = '/pages/order/cart-settlement/cart-settlement?id=1'
        self.linkToSettlementPage(payUrl)
      }
    },
    //商品详情接龙时
    isPageGoodsChains: function () {
      var self = this
      var sdata = this.data
      var gs_id = sdata.goodsInfo.gs_id
      if (+sdata.goodsInfo.buy_num <= 0) {
        //单规格-该商品未加入到购物车，添加该商品
        if ((sdata.goodsInfo.spec_length && sdata.goodsInfo.spec_length > 1)
          || sdata.goodsInfo.spec_option && sdata.goodsInfo.spec_option.length > 1) {
          return api.toastError('请先选择商品规格')
        }
        api.wxRequest({
          url: '/index.php?act=Cart&op=index&action=infoAddCart',
          data: {
            gs_id: gs_id,
            num: 1,
            buy_type: 1
          }
        }).then(function (res) {
          self.getCartData('submitCheck2', gs_id)
          self.triggerEvent('myevent', {
            goods_id: sdata.goodsInfo.goods_id,
            buy_num: res.data.buy_num,
            cart_num: res.data.cart_num
          })
        })
      } else {
        if ((sdata.goodsInfo.spec_length && sdata.goodsInfo.spec_length > 1)
          || sdata.goodsInfo.spec_option && sdata.goodsInfo.spec_option.length > 1) {
          var gsIdArr = []
          //获取商品在购物车各个规格数据
          api.wxRequest({
            url: '/index.php?act=Cart&op=index&action=getGoodsSpecDataInCart',
            data: {goods_id: sdata.goodsInfo.goods_id}
          }).then(function (res) {
            var gsIdArr = []
            res.data.items.forEach(function (value) {
              gsIdArr.push(value.gs_id)
            })
            payUrl = '/pages/order/cart-settlement/cart-settlement?id=1&come_source=1&passGoodsId=1&goodsIdArray=' + JSON.stringify(gsIdArr)
            self.linkToSettlementPage(payUrl)
          })
        } else {
          var payUrl = '/pages/order/cart-settlement/cart-settlement?id=1&come_source=1&passGoodsId=1&goodsIdArray=' + JSON.stringify([sdata.goodsInfo.gs_id])
          self.linkToSettlementPage(payUrl)
        }
      }
    },
    linkToSettlementPage: function (payUrl) {
      var self = this
      var sdata = this.data
      if(+sdata.cartData.canSettle === 0){
        return api.toastError(sdata.cartData.settleMsg)
      }
      wx.navigateTo({
        url: payUrl
      })
    },
    //同步上一页【分类页、商品详情页、搜索页购物车数据】
    syncParent: function (options) {
      if(this.data.cartData.totalNum <= 0){
        this.setData({
          isShowCartGoods: false
        })
      }
      this.triggerEvent('myevent', options)
    },

    //登录
    login: function () {
      this.triggerEvent('login')
    },
    //修改购物车右下角的文字'选好了'，'立即接龙'
    updFootBtn: function (type) {
      this.setData({
        footBtnType: type
      })
    },
    updFootBtnText: function (text) {
      this.setData({
        footBtnText: text
      })
    },
  }
})
