// components/chains-list/chains-card-layer/chains-card-layer.js
Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {
    chainsTotal: {
      type: [Number, String]
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isShowLayer: false,
    FilePath:'',           //头像路径
    imgHeight: 820,
    layerHeight: wx.getSystemInfoSync().windowHeight - 100
  },

  /**
   * 组件的方法列表
   */
  methods: {
    showLayer: function (cardImg) {
      console.log(cardImg)
      if (+this.data.chainsTotal >= 5) {
        this.setData({
          imgHeight: 820 + 180
        })
      } else {
        this.setData({
          imgHeight: 820 + 18*(+this.data.chainsTotal)
        })
      }
      this.setData({
        cardImg: cardImg,
        isShowLayer: true,
      })
    },
    hideLayer: function () {
      this.setData({
        isShowLayer: false
      })
    },
    //定义的保存图片方法
    saveImageToPhotosAlbum: function () {
      var that = this
      //调用方法吧图片保存到用户相册
      wx.saveImageToPhotosAlbum({
        filePath: that.data.cardImg,
        //保存成功失败之后，都要隐藏画板，否则影响界面显示。
        success: (res) => {
          console.log(res)
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 2000
          })
        },
        fail: (err) => {
          console.log(err)
          wx.showToast({
            title: '未开启系统相册权限，无法保存到相册',
            icon: 'none',
            duration: 2000
          })
          //"saveImageToPhotosAlbum:fail:auth denied"
          //err.errMsg == 'saveImageToPhotosAlbum:fail auth deny'
        }
      })
    },
  }
})
