// pages/test_code/canvas.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    canvasHidden:true,     //设置画板的显示与隐藏，画板不隐藏会影响页面正常显示
    goodsData: {
      goods_img: "../../images/cs_img/img3.jpg",
      goods_name: '乐町优雅复古短上衣2019夏季乐町优雅复古短上衣2019夏季',
      goods_price: '266.00'
    },
    qrcode_img: '../../images/cs_img/QRcode.jpg',
    shareImgPath: '',
    FilePath:'',           //头像路径
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.saveImageToPhotosAlbum()
  },
//定义的保存图片方法
  saveImageToPhotosAlbum:
    function () {
      wx.showLoading({
        title: '保存中...',
      })
      var that = this;
      //设置画板显示，才能开始绘图
      that.setData({
        canvasHidden: false
      })
      var unit = 2
      var context = wx.createCanvasContext('share')
      context.drawImage(that.data.goodsData.goods_img, 0, 0, 280 * unit, 280 * unit)

      context.moveTo(0, 280 * unit)
      context.lineTo(280 * unit, 280 * unit)
      context.setStrokeStyle('rgba(102,102,102,0.2)')
      context.stroke()

      var goods_name = that.data.goodsData.goods_name.substring(0, 16)
      goods_name = goods_name + (that.data.goodsData.goods_name.length > 16 ? '...' : '')
      context.setFontSize(13 * unit)
      context.setFillStyle("#111111")
      context.setTextAlign("left")
      context.fillText(goods_name, 10 * unit, 310 * unit, 200 * unit)

      context.setFontSize(15 * unit)
      context.setFillStyle("#ff0b0b")
      context.setTextAlign("right")
      context.fillText("￥"+that.data.goodsData.goods_price, 280 * unit, 310 * unit, 100 * unit)

      context.setLineCap('round')
      context.moveTo(0, 330 * unit)
      context.lineTo(280 * unit, 330 * unit)
      context.setStrokeStyle('rgba(102,102,102,0.2)')
      context.stroke()

      context.drawImage(that.data.qrcode_img, 10 * unit, 340 * unit,  60 * unit, 60 * unit)

      context.setFontSize(13 * unit)
      context.setFillStyle("#111111")
      context.setTextAlign("left")
      context.fillText("限时优惠，一起来接龙~", 80 * unit, 365 * unit)

      context.setFontSize(12 * unit)
      context.setFillStyle("#666666")
      context.setTextAlign("left")
      context.fillText("长按识别小程序码接龙", 80 * unit, 385 * unit)
      //把画板内容绘制成图片，并回调 画板图片路径
      context.draw(false, function () {
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          width: 280 * unit,
          height: 410 * unit,
          destWidth: 280 * unit * 2,
          destHeight: 410 * unit * 2,
          canvasId: 'share',
          success: function (res) {
            that.setData({
              shareImgPath: res.tempFilePath
            })
            if (!res.tempFilePath) {
              wx.showModal({
                title: '提示',
                content: '图片绘制中，请稍后重试',
                showCancel: false
              })
            }
            console.log(that.data.shareImgPath)
            //画板路径保存成功后，调用方法吧图片保存到用户相册
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              //保存成功失败之后，都要隐藏画板，否则影响界面显示。
              success: (res) => {
                console.log(res)
                wx.hideLoading()
                that.setData({
                  canvasHidden: true
                })
              },
              fail: (err) => {
                console.log(err)
                wx.hideLoading()
                that.setData({
                  canvasHidden: true
                })
              }
            })
          }
        })
      });




    },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
