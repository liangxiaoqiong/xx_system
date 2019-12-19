// components/delivery-layer/delivery-layer.js
Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
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
    isShowDeliveryLayer: false,

    chooseDelivery: '',//val
    deliveryData: {
      delivery_store:0,
      delivery_data:[]
    },//当前店铺的配送时间选项列表
  },
  /**
   * 组件的方法列表
   */
  methods: {
    /**region 显示||隐藏弹框 start*/
    //显示弹框
    showDeliveryLayer: function (item) {
      this.setData({
        deliveryData: item.deliveryData,
        chooseDelivery: item.chooseDelivery,
        isShowDeliveryLayer: true,
      })
      console.log(this.data.deliveryData)
    },
    //隐藏弹框
    hideDeliveryLayer: function(){
      this.setData({
        isShowDeliveryLayer: false,
        chooseDelivery: {}
      })
    },
    /**endregion 显示||隐藏弹框 end*/
    changeDelivery: function (event) {
      var item = event.currentTarget.dataset.item
      this.setData({
        chooseDelivery: item
      })
    },
    submitChoose: function () {
      var data_ = {
        chooseDelivery: this.data.chooseDelivery,
        delivery_store: this.data.deliveryData.delivery_store
      }
      this.triggerEvent('myevent', data_)
      this.hideDeliveryLayer()
    }
  }
})