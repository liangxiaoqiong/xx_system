// pages/order/cart-settlement.js
var api = require('../../../utils/wxApi.js')
var util = require('../../../utils/util.js')
Page({
  data: {
    loadCompeted: false,
    storeData: {},
    orderRequestQuery: {},//订单接口公共参数
    load: {
      isBusy: false
    },
    orderData: {
      pend_data: {
        id: '',//桌位编号=pend_num_id
        name: '',//卓位名称
        pend_order_id: ''//
      }
    },
    //提交后台数据

    /*临时数据*/
    queryOrder:{
      storeMsg: '',//单个店铺留言信息

      pend_num_id: '',
      pend_name: '',
      pend_type: 0,//就餐方式，【0：堂食，1：打包】
      pend_member_num: 1,//就餐人数
      psWay: '3',//选择 1快递配送（默认）、2上门自提、3小程序堂食订单
      order_sn : '',
      user_address:{},//选择的收货地址{}
      //isAbroad:'',
      abroad_name:'',//有境外商品时，填写的真实姓名
      abroad_ID_number:'',//有境外商品时，填写的身份证号
      pickup_user:'',//选择上门自提时，提货人
      pickup_tel:'',//选择上门自提时，提货人手机号
      //invoice_id:'',//发票id(0：未选择或者发票开关关闭)
      pay_type:'', //支付方式(0:货到付款 1:微信支付 4:支付宝支付)",
      store:{
        //store_id:{}
        /*12:{
          message:'',//留言信息
          coupon:{},选择的优惠券，
          coupon_money:'',//优惠券抵扣的金额
          credit_num:'',//使用的积分数
          credit_money:'',//平台使用的积分数=>抵扣金额
          credit_data:{},//当前店铺的积分配置参数（省去积分计算时遍历店铺）
          balance:'',//使用的余额数
          storeGoodsNum:'',//店铺内商品数据
          storeTotal:'',//店铺需支付总金额（不包括运费）
          storeResultTotal:'',//店铺最后需付金额（-优惠券，-积分，-余额，+运费）
          postWay:'1',//选择的配送方式 （默认卖家配送1,买家自提2）
          goods_id:[],//该店铺订单的商品id
          gs_id:[],//该店铺订单的规格id
          delivery_type:'',//选择的配送时间
          mj_price:'',//每个店铺满减金额
          freight_money:'',//该店运费金额
          freight_result:'',//该店结算运费（自提时=0）
          selectedZt:{
            ziti_time:'',//选择的自提时间（时间戳）【立即提取=0】
            ziti_timeType:'now',//自提时间类别，now(立即提取)/30min/60min/custom（默认30min）
            ziti_time_string:'',选择的自提时间（用于自定义时间）
            pickup_address:{}//选择的自提地址（默认第一个）
          },//买家自提时，选择的自提时间、地址
        }*/
      },//提交店内信息
      platform:{
        coupon:{},
        coupon_money:0.00,//优惠券抵扣的金额
        credit_num:0,//平台使用的积分数
        credit_money:0.00,//平台使用的积分数=>抵扣金额
        balance:0.00//平台使用的余额数
      },//提交平台信息
      thirdpart:{
        balance:0.00,//第三方使用的余额，默认显示全部（条件限制判断）
      },//提交第三方信息
      resultTotal:{
        total_num:'',//总共件数
        total_money:'',//商品总金额（+运费+满减）
        result_money:'',//最后需付金额
        total_mj:0.00,//店铺总共活动满减
        total_freight_money:'',//店铺总共需付运费金额
        store_coupon_money:'',//店铺总共优惠券抵扣金额
        store_credit_money:'',//店铺总共积分抵扣金额
        store_balance_money:'',//店铺总共余额抵扣金额
      }//最后抵扣、需付金额
    },//“确认下单”参送的数据
    couponLayerData: {
      type: '',
      couponList: []
    },//优惠券弹框数据
    creditRule: {
      isHideLayer: true,//是否隐藏弹框
      ruleData: {}
    },//临时积分规格数据
    mealNumData: {
      isHideLayer: true,//是否隐藏弹框
      temp_num: '',//临时弹框就餐人数量
      isFocus: false,
    },//就餐人数弹框
    creditBalance: {
      isHideLayer: true,
      isFocus: false,
      type:'',//1: 店铺积分 2: 店铺余额 3: 平台积分 4:平台余额 5.平台第三方余额
      layerTitle: '',
      inputType: 'digit',
      num:'',//抵用金额(积分时：抵用数量)
      change_store_id:'',//商家编号，当使用1，2的时候，store_id为输入店铺抵用的商家编号，其余为当前商家编号{$f}即可
    },//积分||余额修改弹框
    payMethod: {
      isHideLayer: true
    },//支付
    textarea: {
      isShow: false
    },
    settlementQuery: {}
  },
  onLoad: function (options) {
    var orderRequestQuery = {
      user_type: 'buyer',
      member_id: wx.getStorageSync('member_id'),
      store_id: wx.getStorageSync('store_id'),
      key: wx.getStorageSync('token'),
      client: 'mini',
      comchannel_id: wx.getStorageSync('storeData').channel_id,
      come_source: options.come_source, //来源- 0购物车 1商品详情的立即购买
      passGoodsId: options.passGoodsId, //是否传递商品编号
      goodsIdArray: options.goodsIdArray,
    }
    this.setData({
      orderRequestQuery: orderRequestQuery,
      storeData: wx.getStorageSync('storeData'),
      ['queryOrder.psWay']: getApp().globalData.psWay,
    })
    if(this.data.queryOrder.psWay === 1) {
      this.setDefaultAddress()
    } else {
      this.getSettlementData()
    }
  },
  //是否有默认地址，设置默认地址
  setDefaultAddress: function () {
    var self = this
    var default_address = wx.getStorageSync('default_address_id')
    if(default_address === '') {
      api.wxRequest({
        url: '/index.php?act=cntaddress&op=syncdata',
        data: {version: 0},
        header: {
          'contentType': 'application/x-www-form-urlencoded'
        }
      }).then(function (res) {
        if(res.data.citems.length > 0) {
          wx.setStorageSync('default_address_id', res.data.citems[0].address_id)
        }
        self.getSettlementData()
      })
    } else {
      self.getSettlementData()
    }
  },
  //获取结算页数据
  getSettlementData: function(){
    var self = this
    var sdata = this.data
    if (sdata.load.isBusy) return false
    self.setData({
      ['load.isBusy']: true
    })
    var query_ = JSON.stringify(sdata.orderRequestQuery)
    var query = JSON.parse(query_)
    query.storeId = wx.getStorageSync('store_id')
    query.is_pickup = 0
    query.addressId = wx.getStorageSync('default_address_id')
    var pend_num_id = +sdata.queryOrder.psWay === 3 ? wx.getStorageSync('pend_num_id') : ''
    query.pend_num_id = pend_num_id
    api.wxRequest({
      url: '/index.php?act=CommonOrder&op=confirmOrderData',
      data: query,
      header: {
        'contentType': 'application/x-www-form-urlencoded'
      }
    }).then(function (res) {
      if(+sdata.queryOrder.psWay === 3) {
        var pend_id = res.data.pend_data !== null && typeof res.data.pend_data.id !== 'undefined' ? res.data.pend_data.id : ''
        var pend_name = res.data.pend_data !== null && typeof res.data.pend_data.name !== 'undefined' ? res.data.pend_data.name : ''
        self.setData({
          ['queryOrder.pend_num_id']: pend_id,
          ['queryOrder.pend_name']: pend_name,
        })
      }
      self.setData({
        orderData: res.data,
        ['queryOrder.user_address']: res.data.addressData,
        ['queryOrder.order_sn']: res.data.order_sn,
        ['loadCompeted']: true,
      })
      self.init()
    }).catch(function () {
      self.setData({
        ['load.isBusy']: false
      })
    })
  },

  //（默认使用第三方余额）(若使用优惠券，先扣除优惠券金额计算默认使用余额)
  init: function(){
    var self = this
    var sdata = this.data
    var query_default = {}
    var total_num = 0
    var total_mj = 0
    sdata.orderData.storeInfoArray.forEach(function (value,key,json) {

      /*配送时间项*/
      var delivery_type = '';
      if(value.delivery_content !== ''){
        value.delivery_content = JSON.parse(value.delivery_content);
      }else{
        value.delivery_content = [];
      }
      if(+sdata.queryOrder.psWay !== 2) {
        delivery_type = +value.delivery_switch === 1 ? value.delivery_content[0] : '';
      }

      //默认选择一条店内优惠券
      var default_couponS = {}
      for(var key_coupon in value.storeMemberCoupons.use){
        var value_coupon = value.storeMemberCoupons.use[key_coupon]
        if(+value_coupon.is_select === 1){
          default_couponS = value_coupon
        }
      }

      //店铺商品id
      var goods_id_arr = [];var gs_id_arr = [];
      value.order_content.forEach(function (value2,key2,json2) {
        goods_id_arr[key2] = value2.goods_id
        gs_id_arr[key2] = value2.gs_id
      })
      //店铺提交信息初始化默认值
      query_default[value.store_id] = {
        postWay: sdata.queryOrder.psWay, //上门自提=2
        coupon:default_couponS,
        coupon_money:value.coupons_exmoney,
        message:'',
        credit_num:value.rm_credit_num,
        credit_money:value.rm_credit_price,
        credit_data:{
          credit_limit_money:value.credit_limit_money,
          credit_num:value.credit_num,
          credit_percent:value.credit_percent,
          credit_to_money:value.credit_to_money
        },
        balance:value.rm_balance,
        storeGoodsNum:value.goods_total_num,
        storeTotal:value.goods_amount,
        storeResultTotal:value.temp_total_amount,
        goods_id:goods_id_arr,
        gs_id:gs_id_arr,
        delivery_type: delivery_type,//上门自提=>商家配送时间=''
        mj_price:value.mj_price,
        custom_pick_type: value.custom_pick_type,
        custom_pick_switch: value.custom_pick_switch,
        custom_start_time: value.custom_start_time,
        custom_end_time: value.custom_end_time,
        freight_result:value.freight.freight,
        freight_money:value.freight.freight,
        selectedZt:{
          ziti_time: 0,
          ziti_time_string:'',
          ziti_timeType: '',//【自提时间新增“立即提取”】1：设置“立即提取”为默认
          pickup_address:{}
        }
      }
      total_num += value.goods_total_num
      total_mj += Number(value.mj_price)
    })
    self.setData({
      ['queryOrder.store']: query_default
    })

    /*region推荐金额 /总额 */
      //默认选择一条平台优惠券
    var platform_Coupon = {}
    sdata.orderData.platformMemberCoupons.forEach(function (value_couponP,index_couponP,json_couponP) {
      if(+value_couponP.is_select === 1){
        platform_Coupon = json_couponP[index_couponP];//设置默认自提地址
      }
    })
    var platform_ = {
      balance: sdata.orderData.rm_platform_balance,
      coupon: platform_Coupon,
      coupon_money: sdata.orderData.platform_coupons_money,
      credit_num: sdata.orderData.rm_platform_credit_num,
      credit_money: sdata.orderData.rm_platform_credit_price,
    }
    var thirdpart_ = {
      balance: sdata.orderData.rm_thirdpart_money
    }
    var resultTotal_ = {
      result_money: sdata.orderData.temp_total_amount,
      total_mj: total_mj,
      total_num: total_num,
      total_money: sdata.orderData.total_amount,
    }
    self.setData({
      ['queryOrder.platform_']: platform_,
      ['queryOrder.thirdpart']: thirdpart_,
      ['queryOrder.resultTotal']: resultTotal_,
      ['queryOrder.pickup_user']: sdata.orderData.member_pickdata.pick_membername,//选择上门自提时，提货人
      ['queryOrder.pickup_tel']: sdata.orderData.member_pickdata.pick_tel,//选择上门自提时，提货人手机号
      ['queryOrder.abroad_name']:
        sdata.orderData.addressData.truename ? sdata.orderData.addressData.truename : '',//有境外商品时，填写的真实姓名
      ['queryOrder.abroad_ID_number']:
        sdata.orderData.addressData.idcard ? sdata.orderData.addressData.idcard : '',//有境外商品时，填写的身份证号
    })
    self.baseTotal();//计算运费总计
  },

  /**计算运费总计、余额总计、积分总计*/
  baseTotal: function(){
    var self = this
    var sdata = this.data
    var allFreight = 0
    var allCoupon = 0
    var allBalance = 0
    var allCredit_money = 0
    for (var key in sdata.queryOrder.store) {
      var value = sdata.queryOrder.store[key]
      value.freight_result = value.freight_money//卖家配送||买家自提(添加邮费)
      allFreight += Number(value.freight_result)
      allCoupon += Number(value.coupon_money)
      allBalance += Number(value.balance)
      allCredit_money += Number(value.credit_money)
    }
    self.setData({
      ['queryOrder.resultTotal.total_freight_money']: (allFreight).toFixed(2),
      ['queryOrder.resultTotal.store_coupon_money']: (allCoupon).toFixed(2),
      ['queryOrder.resultTotal.store_balance_money']: (allBalance).toFixed(2),
      ['queryOrder.resultTotal.store_credit_money']: (allCredit_money).toFixed(2),
      ['load.isBusy']: false
    })
  },

  //地址切换选择
  changeAddress: function () {
    wx.navigateTo({
      url: '/pages/address/address-list/address-list'
    })
  },

  /** region 桌号选择 start*/
  showPendLayer: function(){
    var options = {
      id: this.data.queryOrder.pend_num_id,
      name: this.data.queryOrder.pend_name
    }
    this.pendLayer = this.selectComponent('#pend-layer')
    this.pendLayer.showPendLayer(options)
  },
  syncPendLayer: function(event){
    console.log(event)
    this.setData({
      ['queryOrder.pend_num_id']: event.detail.id,
      ['queryOrder.pend_name']: event.detail.name
    })
  },
  /** endregion 桌号选择 end*/

  /**region 就餐人数 start*/
  //显示就餐人数弹框
  showMealNum: function(){
    var self = this
    var sdata = this.data
    self.setData({
      ['mealNumData.temp_num']: sdata.queryOrder.pend_member_num,
      ['mealNumData.isHideLayer']: false,
      ['mealNumData.isFocus']: true
    })
  },
  //输入框值更改=>同步
  bindInputMeal: function(e){
    if (e.detail.value.length == 1) {
      e.detail.value = e.detail.value.replace(/[^0-9]/g, '')
    } else {
      e.detail.value = e.detail.value.replace(/\D/g, '')
    }
    this.setData({
      ['mealNumData.temp_num']: e.detail.value
    })
  },
  //弹框按钮“取消”
  cancelMealNum: function(){
    this.setData({
      ['mealNumData.isHideLayer']: true,
      ['mealNumData.isFocus']: false
    })
  },
  //弹框按钮“确定”
  confirmMealNum: function(){
    var self = this
    var sdata = this.data
    if(+sdata.mealNumData.temp_num <= 0){
      self.setData({
        ['mealNumData.temp_num']: 1
      })
      api.toastError('就餐人数不能少于1人')
      return false
    }
    self.setData({
      ['queryOrder.pend_member_num']: sdata.mealNumData.temp_num,
      ['mealNumData.isHideLayer']: true,
      ['mealNumData.isFocus']: false
    })
  },
  //切换就餐方式
  changePendType: function(event){
    this.setData({
      ['queryOrder.pend_type']: event.detail.value
    })
  },
  /**endregion 就餐人数 end*/

  /**region 配送时间弹框 start*/
  showDeliveryLayer: function(event){
    var store_id = event.currentTarget.dataset.storeid
    var delivery = event.currentTarget.dataset.delivery
    if(typeof delivery === "string") {
      delivery = delivery !== '' ? JSON.parse(delivery) : []
    }
    var data_ = {
      chooseDelivery: this.data.queryOrder.store[+store_id].delivery_type,
      deliveryData: {
        delivery_store: store_id,
        delivery_data: delivery
      }
    }
    this.deliveryLayer = this.selectComponent('#deliveryLayer')
    this.deliveryLayer.showDeliveryLayer(data_)
  },
  syncDeliveryLayer: function(event) {
    this.data.queryOrder.store[+event.detail.delivery_store].delivery_type = event.detail.chooseDelivery
    this.setData({
      queryOrder: this.data.queryOrder
    })
  },
  /**endregion 配送时间弹框 end*/

  /**region [店铺store||平台platform]积分、[店铺store||平台platform||第三方thirdpart]余额*/

  /**region 优惠券 start*/
  //显示优惠券弹框
  showCoupon: function (event) {
    var type = event.currentTarget.dataset.type
    var item = event.currentTarget.dataset.item
    var store_id = event.currentTarget.dataset.storeid || ''
    var chooseCoupon = {}
    if(type === 'store'){
      chooseCoupon = this.data.queryOrder.store[+store_id].coupon
    } else {
      chooseCoupon = this.data.queryOrder.platform.coupon
    }
    this.setData({
      couponLayerData: {
        type: type,
        store_id: store_id,
        couponList: item,
        chooseCoupon: chooseCoupon
      }
    })
    this.couponLayer = this.selectComponent('#couponLayer')
    this.couponLayer.showCouponLayer()
  },
  //优惠券弹框 组件回调
  syncCouponLayer: function(event){
    if(this.data.load.isBusy) return false
    this.setData({
      ['load.isBusy']: true
    })
    if(this.data.couponLayerData.type === 'store'){
      this.data.queryOrder.store[this.data.couponLayerData.store_id].coupon = event.detail
    } else {
      this.data.queryOrder.platform.coupon = event.detail
    }
    this.setData({
      queryOrder: this.data.queryOrder
    })
    this.accountCoupon()
  },
  /*请求接口选择优惠券 返回最有方案*/
  accountCoupon:function () {
    var self = this
    var sdata = this.data
    var storeCoupon = []
    var i = 0
    var storeString = JSON.stringify(sdata.queryOrder.store)
    var storeJson = JSON.parse(storeString)
    for(var key in storeJson){
      var value = storeJson[key]
      if(value.coupon){
        storeCoupon[i] = {"store_id": key, "coupons_id": value.coupon.id}
        i++
      }
    }
    var query_ = JSON.stringify(sdata.orderRequestQuery)
    var query = JSON.parse(query_)
    var changeData = {
      store_id: wx.getStorageSync('store_id'),
      order_sn: sdata.queryOrder.order_sn,
      platform_coupons_id: typeof (sdata.queryOrder.platform.coupon.id) !== 'undefined' ? sdata.queryOrder.platform.coupon.id : 0,
      change_array: storeCoupon
    }
    var changeData_ = JSON.stringify(changeData)
    query.changeData = changeData_
    api.wxRequest({
      url: '/index.php?act=CommonOrder&op=changeCoupons',
      data: query,
      header: {
        'contentType': 'application/x-www-form-urlencoded'
      }
    }).then(function (res) {
      //后台返回优惠券数据替换
      //店铺优惠券
      if(res.data.storeInfoArray){
        res.data.storeInfoArray.forEach(function (value,key,json) {
          if(value.store_id !== null || +value.store_id !== 0){
            var storeValue = sdata.queryOrder.store[value.store_id]
            storeValue.coupon = value.coupons_data
            storeValue.coupon_money = value.coupons_exmoney
            storeValue.balance = value.rm_balance
            storeValue.credit_num = value.rm_credit_num
            storeValue.credit_money = value.rm_credit_price
            storeValue.storeResultTotal = value.temp_total_amount
          }
        })
      }

      //平台优惠券
      var platformValue = sdata.queryOrder.platform
      if(typeof (res.data.platform_coupons_id) !== 'undefined'){
        platformValue.coupon = res.data.platform_coupons_data
        platformValue.coupon_money = res.data.platform_coupons_money
      }
      platformValue.balance = res.data.rm_platform_balance
      platformValue.credit_num = res.data.rm_platform_credit_num
      platformValue.credit_money = res.data.rm_platform_credit_price
      sdata.queryOrder.thirdpart.balance = res.data.rm_thirdpart_money
      sdata.orderData.thirdpart_money_most = res.data.thirdpart_limit_money || ''
      sdata.queryOrder.resultTotal.result_money = res.data.temp_total_amount
      self.setData({
        queryOrder: sdata.queryOrder,
        orderData: sdata.orderData
      })
      self.baseTotal();//总计
      self.couponLayer = self.selectComponent('#couponLayer')
      self.couponLayer.hideCouponLayer()
      self.setData({
        ['load.isBusy']: false
      })
    }).catch(function (res) {
      self.setData({
        ['load.isBusy']: false
      })
    })
  },
  /*endregion 优惠券 end*/

  /**region 积分使用规则弹框 start */
  //显示积分使用规则弹框
  showCreditRule: function (event) {
    var type = event.currentTarget.dataset.type
    var orderStore_ = event.currentTarget.dataset.item
    var creditRuleData = {}
    switch (type) {
      case 'store':
        creditRuleData = {
          credit_limit_money:orderStore_.credit_limit_money,
          credit_percent: (+orderStore_.credit_percent *100).toFixed(2),
          credit_to_money:orderStore_.credit_to_money,
          credits_model: orderStore_.credits_model,
          credits_limit_buy: orderStore_.credits_limit_buy
        }
        break;
      case 'platform':
        creditRuleData = {
          credit_limit_money: this.data.orderData.platform_credit_limit_money,
          credit_percent: this.data.orderData.platform_credit_percent,
          credit_to_money: this.data.orderData.platform_credit_to_money,
          credits_model: 0,
          credits_limit_buy: ''
        }
        break;
      default:
        break;
    }
    this.setData({
      ['creditRule.ruleData']: creditRuleData,
      ['creditRule.isHideLayer']: false,
    })
  },
  //关闭积分使用规则弹框
  hideCreditRule: function () {
    this.setData({
      ['creditRule.isHideLayer']: true,
    })
  },
  /*endregion 积分使用规则弹框 end */

  /**region 修改积分||余额弹框 start */
  showCreditBalanceLayer: function(event){
    var type = event.currentTarget.dataset.type

    var orderStore_ = event.currentTarget.dataset.item || {}
    var num, change_store_id, layerTitle = '请输入'
    if(+type === 1 || +type === 2){
      if(+orderStore_.credits_model === 1 && +orderStore_.credits_limit_buy === 1){
        return api.toastError('不可更改')
      }
    }
    switch (+type){
      case 1:
        num =  Number(this.data.queryOrder.store[orderStore_.store_id].credit_num)
        change_store_id = orderStore_.store_id
        layerTitle += '店铺积分'
        break;
      case 2:
        num = Number(this.data.queryOrder.store[orderStore_.store_id].balance).toFixed(2)
        change_store_id = orderStore_.store_id
        layerTitle += '店铺余额'
        break;
      case 3:
        num = Number(this.data.queryOrder.platform.credit_num)
        change_store_id = this.data.orderRequestQuery.store_id
        layerTitle += '平台积分'
        break;
      case 4:
        num = Number(this.data.queryOrder.platform.balance).toFixed(2)
        change_store_id = this.data.orderRequestQuery.store_id
        layerTitle += '平台余额'
        break;
      case 5:
        num = Number(this.data.queryOrder.thirdpart.balance).toFixed(2)
        change_store_id = this.data.orderRequestQuery.store_id
        layerTitle += '平台第三方余额'
        break;
      default:
        break;
    }
    var inputType = this.data.creditBalance.inputType
    if(+type === 1||+type === 3){
      inputType = 'number'
    }
    this.setData({
      ['creditBalance.type']: type,
      ['creditBalance.layerTitle']: layerTitle,
      ['creditBalance.inputType']: inputType,
      ['creditBalance.num']: num,
      ['creditBalance.change_store_id']: change_store_id,
      ['creditBalance.isHideLayer']: false,
      ['creditBalance.isFocus']: true,
    })
  },

  //键盘输入时触发
  bindInputCreditBalance: function(event){
    var value = event.detail.value
    if(+this.data.creditBalance.type === 1 || +this.data.creditBalance.type === 3){
      value = util.numInt(value)
    } else {
      value = util.numPoint(value)
    }
    this.setData({
      ['creditBalance.num']: value,
    })
  },

  //取消修改
  cancelCreditBalance: function(){
    this.setData({
      ['creditBalance.isHideLayer']: true,
      ['creditBalance.isFocus']: false,
    })
  },

  //确定
  confirmCreditBalance: function(){
    var self = this
    var sdata = this.data
    if(sdata.load.isBusy) return false
    self.setData({
      ['load.isBusy']: true
    })
    var inputNum = +sdata.creditBalance.num
    var storeInfo = {}
    var store_id = 0
    var queryStore = {}
    if(+sdata.creditBalance.type === 1 || +sdata.creditBalance.type ===2){
      store_id = sdata.creditBalance.change_store_id
      queryStore = sdata.queryOrder.store[store_id]
      sdata.orderData.storeInfoArray.forEach(function (value,index,json) {
        if(+store_id === +value.store_id){
          storeInfo = json[index];
        }
      })
    }
    var most_num = 0,old_num = 0
    switch (+sdata.creditBalance.type){
      case 1:
        if(self.creditCalculate('store',store_id)===false){
          self.setData({
            ['load.isBusy']: false
          })
          return false
        }
        most_num = parseInt(self.creditCalculate('store',store_id));//积分计算
        old_num = queryStore.credit_num;
        break;
      case 2:
        most_num = storeInfo.balance;
        old_num = queryStore.balance;
        break;
      case 3:
        if(self.creditCalculate('platform')===false){
          self.setData({
            ['load.isBusy']: false
          })
          return false
        }
        most_num = parseInt(self.creditCalculate('platform'));
        old_num = sdata.queryOrder.platform.credit_num;
        break;
      case 4:
        most_num = sdata.orderData.platform_balance;
        old_num = sdata.queryOrder.platform.balance;
        break;
      case 5:
        most_num = sdata.orderData.thirdpart_money;
        old_num = sdata.queryOrder.thirdpart.balance;
        break;
      default:
        break;
    }
    if(+inputNum < 0){
      self.setData({
        ['load.isBusy']: false
      })
      return api.toastError('必须大等于0')
    }

    //lxq 2018-08-16 支付积分最大使用限制bug修复
    var old_total
    if(+sdata.creditBalance.type === 1 || +sdata.creditBalance.type ===3){
      if(+sdata.creditBalance.type === 1){
        //店铺_credit_to_money_积分=1元
        var credit_to_money = queryStore.credit_data.credit_to_money;
        //店铺总积分数
        var credit_num = queryStore.credit_data.credit_num;
      }else{
        //平台_credit_to_money_积分=1元
        var credit_to_money = sdata.orderData.platform_credit_to_money;
        //平台总积分数
        var credit_num = sdata.orderData.platform_credit_num;
      }
      //积分换算 * 当前支付金额
      var m_ = +sdata.queryOrder.resultTotal.result_money * credit_to_money;
      var arrSort = [Number(m_),Number(credit_num)];
      arrSort.sort(function(a, b){return a - b});

      old_total = (+old_num)+(+arrSort[0]);
      old_total = parseInt(old_total);
    }
    else{
      old_total = (+old_num)+(+sdata.queryOrder.resultTotal.result_money);
    }
    //弹框的输入框值是否大于最大可抵用数 && 弹框的输入框值是否大于最大可抵用数 比较
    var arrSort2 = [Number(old_total),Number(most_num)];
    arrSort2.sort(function(a, b){return a - b});
    if(+arrSort2[0] < +inputNum){
      self.setData({
        ['creditBalance.num']: arrSort2[0],
        ['load.isBusy']: false
      })
      return api.toastError('最多可使用' + arrSort2[0])
    }
    if(+inputNum === +old_num){
      //弹框的输入框值是否 === 上次输入框值，数据不变，不请求服务器
      self.cancelCreditBalance()
      self.setData({
        ['load.isBusy']: false
      })
      return false;
    }
    self.ajaxChangeCreditBalance()/*ajax请求服务器更改*/
  },

  //积分计算 type:store(单店)/platform(平台)
  creditCalculate: function(type, store_id){
    var total = this.data.queryOrder.resultTotal.total_money //该订单实际支付金额
    var storeCoupon = this.data.queryOrder.resultTotal.store_coupon_money //店铺优惠券抵用金额
    var platformCoupon = this.data.queryOrder.platform.coupon_money //平台优惠券抵用金额
    var _limit_total = (+total)-((+storeCoupon)+(+platformCoupon)) //该订单实际支付金额（-优惠券）
    if(type === 'store'){
      //店铺
      var limit_money = this.data.queryOrder.store[store_id].credit_data.credit_limit_money
      var credits_model = this.data.queryOrder.store[store_id].credits_model
      if((+limit_money >= _limit_total) && +credits_model === 0){
        return api.toastError('订单金额大于' + limit_money + '元才能使用')
      }
      return +this.data.queryOrder.store[store_id].credit_data.credit_num
    }else{
      //平台
      var limit_money = this.data.orderData.platform_credit_limit_money
      if(+limit_money >= _limit_total){
        return api.toastError('订单金额大于' + limit_money + '元才能使用')
      }
      return +this.data.orderData.platform_credit_num;
    }
  },

  //ajax请求服务器更改抵用金额
  ajaxChangeCreditBalance: function(){
    var self = this
    var sdata = this.data
    var query = JSON.stringify(sdata.orderRequestQuery)
    var query_ = JSON.parse(query)
    query_.type = sdata.creditBalance.type
    query_.num = sdata.creditBalance.num
    query_.change_store_id = sdata.creditBalance.change_store_id
    query_.order_sn = sdata.queryOrder.order_sn
    api.wxRequest({
      url: '/index.php?act=CommonOrder&op=changeMoney',
      data: query_,
      header: {
        'contentType': 'application/x-www-form-urlencoded'
      }
    }).then(function (res) {
      //1: 店铺积分 2: 店铺余额 3: 平台积分 4:平台余额 5.平台第三方余额
      switch (+res.data.type){
        case 1:
          var queryStore = sdata.queryOrder.store[sdata.creditBalance.change_store_id]
          queryStore.credit_num = res.data.num
          queryStore.credit_money = res.data.exchange_money
          queryStore.storeResultTotal = res.data.store_temp_total_amount
          self.setData({
            ['queryOrder.store']: sdata.queryOrder.store,
          })
          break;
        case 2:
          var queryStore = sdata.queryOrder.store[sdata.creditBalance.change_store_id]
          queryStore.balance = res.data.exchange_money
          queryStore.storeResultTotal = res.data.store_temp_total_amount
          self.setData({
            ['queryOrder.store']: sdata.queryOrder.store,
          })
          break;
        case 3:
          self.setData({
            ['queryOrder.platform.credit_num']: res.data.num,
            ['queryOrder.platform.credit_money']: res.data.exchange_money
          })
          break;
        case 4:
          self.setData({
            ['queryOrder.platform.balance']: res.data.exchange_money
          })
          break;
        case 5:
          self.setData({
            ['queryOrder.thirdpart.balance']: res.data.exchange_money
          })
          break;
        default:
          break;
      }
      self.setData({
        ['queryOrder.resultTotal.result_money']: res.data.mall_temp_total_amount
      })
      self.baseTotal()//总计
      self.cancelCreditBalance()
      self.setData({
        ['load.isBusy']: false
      })
    }).catch(function () {
      self.setData({
        ['load.isBusy']: false
      })
    })
  },
  /*endregion 修改积分||余额弹框 start */

  /**endregion*/

  /** region 店铺留言 start*/
  showTextarea: function(){
    this.setData({
      ['textarea.isShow']: true,
      ['textarea.isFocus']: true,
    })
  },
  blurMag: function (event) {
    this.setData({
      ['queryOrder.storeMsg']: event.detail.value,
      ['textarea.isShow']: false,
      ['textarea.isFocus']: false,
    })
  },
  /** endregion 店铺留言 end*/

  /**region 点击提交订单 start*/
  //显示支付方式弹框
  showPayWayLayer: function () {
    var self = this;
    var sdata = this.data
    if(+sdata.queryOrder.psWay === 1) {
      if(typeof sdata.queryOrder.user_address.address_id === 'undefined' || +sdata.queryOrder.user_address.address_id <= 0) {
        api.toastError('请选择配送地址')
        return false
      }
    }
    if(+sdata.queryOrder.psWay === 3) {
      if(sdata.queryOrder.pend_num_id === '' || sdata.queryOrder.pend_num_id === undefined){
        api.toastError('请选择桌号')
        return false
      }
    }
    /*region是否可下单*/
    var shopClose = false;
    var shopCloseContent = '';
    sdata.orderData.storeInfoArray.forEach(function (value) {
      if(+value.shop_close === 1){
        shopClose = true;
        shopCloseContent = value.shop_close_content;
      }
    })
    if(shopClose) {
      wx.showModal({
        title: '暂不可提交订单',
        content: shopCloseContent,
        showCancel: false,
        success (res) {
          return false
        }
      })
    }
    /*endregion 是否可下单*/
    var cannotBuy = 0
    var cannotBuy_store = []
    var  cannotBuyCredit = 0
    sdata.orderData.storeInfoArray.forEach(function (value) {
      if(+value.freight.canBuy === 0){
        cannotBuy_store[cannotBuy] = value.store_name;
        cannotBuy++;
      }
      if(+value.credits_can_buy === 0){
        cannotBuyCredit++;
      }
    })
    if(+cannotBuy>0){
      return api.toastError(cannotBuy_store[0] + '未满足起送价，无法提交订单')
    }
    if(+cannotBuyCredit > 0){
      return api.toastError('商品积分限制，无法下单')
    }
    self.paymentComponent = self.selectComponent('#payment')
    self.paymentComponent.isPayWayLen(sdata.orderData.payMethod, sdata.queryOrder.resultTotal.result_money)
  },
  //提交订单 提交数据给后台
  submitOrder: function (event) {
    var self = this
    var sdata = this.data
    var way = event.detail

    if (sdata.load.isBusy) return false
    self.setData({
      ['load.isBusy']: true,
      ['queryOrder.pay_type']: way,
    })
    var mergeorder_content = []
    var i = 0
    for(var key in sdata.queryOrder.store){
      var value = sdata.queryOrder.store[key]
      mergeorder_content[i] = {
        "storeid": key, //"string,子订单商家编号",
        "balance": value.balance, //"string,店铺余额"
        "gou_type": value.coupon.id ? 1 : 0, //"string,是否使用优惠券 (1:使用优惠券)"
        "coupons_id": value.coupon.id ? value.coupon.id : 0, //"string,优惠券编号"
        "coupons_exmoney": value.coupon_money, //"string,优惠券抵用金额"
        "order_msg": sdata.queryOrder.storeMsg, //"string,子店留言"
        "delivery_period": value.delivery_type,
        "mj_price": value.mj_price, //"string,子店满减的金额"
        "totalprice": value.storeResultTotal, // "string,子店显示的价格(说明:=商品的总额 + 运费 - 满减金额 - 子店优惠券金额 - 子店积分抵用 - 子店余额)"
        "get_to_store": value.selectedZt.ziti_time, //"string,自提配送时间戳"
        "pickup_id": value.selectedZt.pickup_address.id ? value.selectedZt.pickup_address.id : 0, //"string,自提编号"
        "postage": value.freight_result, //"string,运费"
        "credits_num": value.credit_num, //"string,子店积分抵用数量"
        "credits_exmoney": value.credit_money //"string,子店积分抵用金额"
      }
      i++
    }
    var submitArray = {
      "buyer_id": wx.getStorageSync('member_id'),//"string,用户编号",
      "platform_balance": sdata.queryOrder.platform.balance,//"string,平台余额抵用",
      "use_platform_coupons": sdata.queryOrder.platform.coupon.id ? 1 : 0,//"string,是否使用平台优惠券",
      "platform_coupons_id": sdata.queryOrder.platform.coupon.id,//"string,平台优惠券编号",
      "platform_coupons_money": +sdata.queryOrder.platform.coupon_money,//"string,平台优惠券的抵用金额",
      "platform_credits_num": sdata.queryOrder.platform.credit_num,//"string,平台积分数量",
      "platform_credits_exmoney": sdata.queryOrder.platform.credit_money,//"string,平台积分抵用金额",
      "thirdpart_money": sdata.queryOrder.thirdpart.balance,//"string,第三方金额抵用",
      "total_price": sdata.queryOrder.resultTotal.result_money,//"string,实付金额",
      "pay_type": sdata.queryOrder.pay_type,//"string,支付方式(0:货到付款 1:微信支付 4:支付宝支付)",
      "merge_store_id": sdata.orderRequestQuery.store_id,//"string,下单商家的编号",
      "order_sn": sdata.queryOrder.order_sn,//"string,订单唯一标识",
      "idcard": sdata.queryOrder.abroad_ID_number,//"string,身份证标示",
      "truename": sdata.queryOrder.abroad_name,//"string, 真实姓名",
      "share_member_id": wx.getStorageSync('recommend_id') || '',//"string,分享人编号",
      "buy_code": '',//"string,二维码字符串",
      "order_type": '',//"string,团购标识",
      "group_id": '',//"string,团购编号",
      "latitude": '',//"string,经度",
      "longitude": '',//"string,纬度",
      "is_pickup":  +sdata.queryOrder.psWay === 2 ? 1 : 0,//"string,是否为自提",
      "address_id": sdata.queryOrder.user_address.address_id ? +sdata.queryOrder.user_address.address_id : 0,//"string,地址编号",
      "isAbroad": sdata.orderData.isAbroad,//"string,是否为海外购",
      "order_membername": sdata.queryOrder.pickup_user,//"string,自提订单联系人",
      "order_membertel": sdata.queryOrder.pickup_tel,//"string,自提订单联系电话",
      "invoice_id": sdata.orderData.invoice_data.invoice_id ? sdata.orderData.invoice_data.invoice_id : 0,//发票编号(0：未选择或者发票开关关闭)
      "mergeorder_content": mergeorder_content,
      "pend_num_id": sdata.queryOrder.pend_num_id,
      "pend_name": sdata.queryOrder.pend_name,
      "pend_type": sdata.queryOrder.pend_type,//就餐方式，【0：堂食，1：打包】
      "pend_member_num": sdata.queryOrder.pend_member_num,//就餐人数
    }
    self.createOrder(submitArray)//下单接口
  },
  //创建订单接口，下单接口
  createOrder: function (submitArray) {
    var self = this
    var sdata = this.data
    var query_ = JSON.stringify(sdata.orderRequestQuery)
    var query = JSON.parse(query_)
    query.orderData = JSON.stringify(submitArray)
    api.wxRequest({
      url: '/index.php?act=CommonOrder&op=createOrder',
      data: query,
      header: {
        'contentType': 'application/x-www-form-urlencoded'
      }
    }).then(function (res) {
      console.log(res)
      var pay_way = res.data.pay_type
      if(+res.data.pay_type === 1){
        var options = {
          order_id: res.data.morder_id,
          total_fee: res.data.total_price,
          se: sdata.orderRequestQuery.store_id,
          f: res.data.f || '',
          member_id: sdata.orderRequestQuery.member_id,
          channel_id: sdata.orderRequestQuery.comchannel_id,
          return_url: res.data.return_url || '',
          type: 0,
        }
      }else{
        //线下支付
        pay_way = 0
        var options = {
          order_id: res.data.morder_id
        }
      }
      self.payment = self.selectComponent('#payment')
      self.payment.submitPay(pay_way, options)
      self.setData({
        ['load.isBusy']: false
      })
    }).catch(function (res) {
      self.setData({
        ['load.isBusy']: false
      })
    })
  }
  /**endregion 点击提交订单  显示支付方式弹框 end*/
})
