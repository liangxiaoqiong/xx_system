/*components/buy-num-layer*/
var api = require('../../../utils/wxApi.js')
var app = getApp()
Component({
  options: {
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {
    //传值标题
    goodsItem: {
      type: Object
    },
    storeData: {
      type: Object
    },
    userInfo: {
      type: [Object, String]
    }
  },
  //监听数据
  observers: {
    //监听选择的规格=>判断规格是否选择全=>获取不容规格的价格，规格组合
    'chooseSpec.**': function (arr) {
      var sdata = this.data
      arr === sdata.chooseSpec
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

  },
  /**
   * 组件的初始数据
   */
  data: {
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

    specMinus: {
      isShowLayer: false,
      minusCart: {},
    }//减减弹框数据
  },
  /**
   * 组件的方法列表
   */
  methods: {
    /**region 商品数量--||++*/
    goodsNumAction: function(event){
      var self = this
      var sdata = this.data
      if (sdata.userInfo === '' || sdata.userInfo == null) {
        self.triggerEvent('login')
        return false
      }
      var type = event.currentTarget.dataset.type ? event.currentTarget.dataset.type : 'add'
      if ((sdata.goodsItem.spec_length && sdata.goodsItem.spec_length > 1)
        || sdata.goodsItem.spec_option && sdata.goodsItem.spec_option.length > 1) {
        if(type === 'minus'){
          if(+sdata.goodsItem.is_cart_multi !== 1){
            //多规格，购物车只有单个规格，直接--
            var item = {
              gs_id: sdata.goodsItem.gs_id,
              num: (+sdata.goodsItem.buy_num) - 1,
            }
            self.postCartNum(item, 'goodsItem')
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
        self.postCartNum(item, 'goodsItem')
      }
    },


    /**region 多规格弹框选择++ start*/
    //显示多规格弹框
    showSpecLayer: function(){
      var options = {
        isShow: true,
        goodsItem: this.data.goodsItem
      }
      this.triggerEvent('speclayer', options)
    },
    /**endregion 加入购物车 end*/

    /** region 购物车数量--弹框 start*/
    showSpecMinusLayer: function(){
      var options = {
        isShow: true,
        goodsItem: this.data.goodsItem
      }
      this.triggerEvent('specminuslayer', options)
    },
    /** endregion 购物车数量--弹框 end*/

    /*提交购物车数据修改 */
    postCartNum: function(item, updItem){
      var self = this
      api.wxRequest({
        url: '/index.php?act=Cart&op=index&action=addCart',
        data: item
      }).then(function (res) {
        self.setData({
          [updItem+'.buy_num']: res.data.buy_num,
          [updItem+'.is_cart_multi']: res.data.is_cart_multi
        })
        self.syncCartNum({cart_num: res.data.cart_num, buy_num: res.data.buy_num, is_cart_multi: res.data.is_cart_multi})
      })
    },
    //向父组件传参，更改购物车数量
    syncCartNum: function (options) {
      options.goods_id = this.data.goodsItem.goods_id
      options.gs_id = this.data.goodsItem.gs_id
      this.triggerEvent('myevent', options)
    }
  }
})
