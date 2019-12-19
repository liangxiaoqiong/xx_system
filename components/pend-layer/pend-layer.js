/*components/pend-layer/pend-layer.js*/
Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {
    //列表
    pendData: {
      type: Array
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    isShowPendLayer: false,
    choosePend: {},//id,name
  },
  /**
   * 组件的方法列表
   */
  methods: {
    /**region 显示||隐藏弹框 start*/
    //显示弹框
    showPendLayer: function (pend) {
      this.setData({
        choosePend: pend,
        isShowPendLayer: true,
      })
    },
    //隐藏弹框
    hidePendLayer: function(){
      this.setData({
        isShowPendLayer: false,
        choosePend: {}
      })
    },
    /**endregion 显示||隐藏弹框 end*/
    //切换选择的优惠券
    changePend: function (event) {
      var item = event.currentTarget.dataset.item
      this.setData({
        choosePend: item
      })
      this.triggerEvent('myevent', this.data.choosePend)
      this.hidePendLayer()
    },
  }
})