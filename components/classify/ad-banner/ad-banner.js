// components/classify/ad-banner/ad-banner.js
Component({
  /**
   * 组件的属性列表
   */
  options: {
    multipleSlots: true,
    addGlobalClass: true
  },
  properties: {
  },

  /**
   * 组件的初始数据
   */
  data: {
    bannerData: {},
    currentIndex: 0,
    currentSwiperItem: {},//当前swiper数据
  },

  /**
   * 组件的方法列表
   */
  methods: {
    initLoad: function (bannerData) {
      this.setData({
        bannerData: bannerData,
        currentSwiperItem: bannerData.img_list[0]
      })
    },
    swiperChange: function (e) {
      this.setData({
        currentIndex: e.detail.current,
        currentSwiperItem: this.data.bannerData.img_list[e.detail.current]
      })
    },
    swiperLink: function (event) {
      var el = event.currentTarget
      var item = el.dataset.item
      if (item.action === 'no_action') return false
      var url = item.url
      wx.setStorageSync('action_url', url)
      wx.navigateTo({
        url: '/pages/action-link/action-link'
      })
    }
  }
})
