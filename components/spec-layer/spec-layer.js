/*components/buy-num-layer*/
var api = require('../../utils/wxApi.js')
var app = getApp()
Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {},
  //监听数据
  observers: {

  },
  /**
   * 组件的初始数据
   */
  data: {
    goodsItem: {},
    isShowSpecLayer: false,
    chooseSpec: [],//选择的规格id列
    chooseSpecString: '',//选择的规格id字符串'_'拼接
    isSelectComplete: false,//多规格是否选择完
    chooseGoods: {
      price: 0,
      specName: '',
      stock: '', //库存，-1：充足
      buyNum: 1
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    /**region 多规格弹框选择++ start*/
    //显示多规格弹框
    showSpecLayer: function (goodsItem) {
      this.setData({
        goodsItem: goodsItem,
        chooseSpec: [],
        isShowSpecLayer: true,
      })
    },
    //隐藏多规格弹框
    hideSpecLayer: function(){
      this.setData({
        isShowSpecLayer: false,
        chooseSpec: [],
        ['chooseGoods.buyNum']: 1
      })
    },
    //选择||取消选择规格
    selectOption: function (event) {
      var self = this
      var sdata = this.data
      var el = event.currentTarget
      var option = el.dataset.option
      var index = el.dataset.index
      var arr = sdata.chooseSpec
      if (+sdata.chooseSpec[index] === +option.id) {
        arr[index] = undefined
      } else {
        arr[index] = option.id
      }
      self.setData({
        chooseSpec: arr
      })
      self.watchSpecSelect()
    },
    //监听选择的规格=>判断规格是否选择全=>获取不容规格的价格，规格组合
    watchSpecSelect: function(){
      var sdata = this.data
      var arr = sdata.chooseSpec
      this.setData({
        chooseSpecString: arr.join('_'),
      })
      if (arr.length === 0 || arr.length !== sdata.goodsItem.spec.length) {
        //规格未选择全
        this.setData({
          isSelectComplete: false,
          ['chooseGoods.price']: sdata.goodsItem.new_price,
          ['chooseGoods.specName']: '',
          ['chooseGoods.stock']: sdata.goodsItem.original_goods_storage
        })
      } else {
        var s = 0
        for (var i = 0; i < arr.length; i++) {
          if (typeof arr[i] === 'undefined' || arr[i] === '') {
            s++
          }
        }
        if(s > 0){
          this.setData({
            isSelectComplete: false,
            ['chooseGoods.price']: sdata.goodsItem.new_price,
            ['chooseGoods.specName']: '',
            ['chooseGoods.stock']: sdata.goodsItem.original_goods_storage
          })
        } else {
          this.setData({
            isSelectComplete: true
          })
          //监听规格是否选择全=>获取不容规格的价格，规格组合
          var len = 0, price = 0, specName = '', stock = ''
          for (var j = 0; j < sdata.goodsItem.spec_option.length; j++) {
            if (sdata.chooseSpecString === sdata.goodsItem.spec_option[j].specs + '') {
              len++
              price = sdata.goodsItem.spec_option[j].new_price
              specName = sdata.goodsItem.spec_option[j].title
              stock = sdata.goodsItem.spec_option[j].original_stock
            }
          }
          if(len > 0){
            this.setData({
              ['chooseGoods.price']: price,
              ['chooseGoods.specName']: specName,
              ['chooseGoods.stock']: stock
            })
          }else{
            this.setData({
              ['chooseGoods.price']: sdata.goodsItem.new_price,
              ['chooseGoods.specName']: '',
              ['chooseGoods.stock']: sdata.goodsItem.original_goods_storage
            })
          }
        }
      }
    },

    /* 多规格数量--||++*/
    specNumAction: function(event){
      var self = this
      var sdata = this.data
      var type = event.currentTarget.dataset.type
      var num = sdata.chooseGoods.buyNum
      if(type === 'minus'){
        if(num <= 1) return false
        num = num - 1
      } else {
        if (+sdata.chooseGoods.stock !== -1 && +num >= +sdata.chooseGoods.stock) {
          return api.toastError('库存不足，无法再加')
        } else {
          num = num + 1
        }
      }
      self.setData({
        ['chooseGoods.buyNum']: num
      })
    },
    //选好了，加入购物车
    submitChoose: function () {
      var self = this
      var sdata = this.data
      if(sdata.isSelectComplete){
        //wx.showLoading()
        var gs_id = sdata.goodsItem.goods_id + '|' + sdata.chooseSpecString
        api.wxRequest({
          url: '/index.php?act=Cart&op=index&action=infoAddCart',
          data: {
            gs_id: gs_id,
            num: sdata.chooseGoods.buyNum
          }
        }).then(function (res) {
          var numOld = sdata.goodsItem.buy_num
          var numNew = (+numOld) + (+sdata.chooseGoods.buyNum)
          self.setData({
            ['goodsItem.buy_num']: numNew,
            ['chooseGoods.buyNum']: 1
          })
          self.hideSpecLayer()
          //向父组件传参，更改购物车数量
          var options = {
            gs_id: gs_id,
            cart_num: res.data.cart_num,
            buy_num: numNew,
            is_cart_multi: res.data.is_cart_multi,
            goods_id: sdata.goodsItem.goods_id,
            isSyncGoodsItem: true
          }
          if (+res.data.is_cart_multi === 0) {
            self.setData({
              ['goodsItem.gs_id']: gs_id,
            })
          }
          self.triggerEvent('syncnum', options)
        })
      }
    },
    /**endregion 加入购物车 end*/
  }
})
