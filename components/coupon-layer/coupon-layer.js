/*components/coupon-layer/coupon-layer.js*/
Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {
    //优惠券列表
    couponData: {
      type: Object
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    isShowCouponLayer: false,
    chooseCoupon: {},//选择的优惠券
  },
  /**
   * 组件的方法列表
   */
  methods: {
    /**region 显示||隐藏弹框 start*/
    //显示弹框
    showCouponLayer: function () {
      var arr = this.data.couponData.couponList
      arr.forEach(function (value) {
        if(+value.coupons_type === 2){
          value.coupons_show_discount = (+value.coupons_discount * 10).toFixed(1)
        }
      })
      this.setData({
        ['couponData.couponList']: arr,
        chooseCoupon: this.data.couponData.chooseCoupon,
        isShowCouponLayer: true,
      })
    },
    //隐藏弹框
    hideCouponLayer: function(){
      this.setData({
        isShowCouponLayer: false,
        chooseCoupon: {}
      })
    },
    /**endregion 显示||隐藏弹框 end*/
    //切换选择的优惠券
    changeCoupon: function (event) {
      var item = event.currentTarget.dataset.item
      if(+this.data.chooseCoupon.id === +item.id){
        //上次选中，再次点击不选中
        this.setData({
          chooseCoupon: {}
        })
      }else{
        this.setData({
          chooseCoupon: item
        })
      }
    },
    //提交选择的优惠券，后台请求、计算最优方案=>赋值
    submitCoupon: function () {
      this.triggerEvent('myevent', this.data.chooseCoupon)
    },
  }
})