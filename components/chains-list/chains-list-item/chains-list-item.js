// components/chains-list/chains-list-item/chains-list-item.js
Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {
    chains: {
      type: Object
    },
    key: {
      type: [Number, String]
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {

  }
})