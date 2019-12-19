// components/chains-list-layer/chains-list-layer.js
Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {
    chainsData: {
      type: Object
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isShowLayer: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**region 显示||隐藏弹框 start*/
    //显示弹框
    showLayer: function () {
      console.log(this.data.chainsData)
      this.setData({
        isShowLayer: true,
      })
    },
    //隐藏弹框
    hideLayer: function(){
      this.setData({
        isShowLayer: false
      })
    },
    /**endregion 显示||隐藏弹框 end*/
  }
})
