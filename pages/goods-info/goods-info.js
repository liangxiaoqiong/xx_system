/*goods-info/goods-info.js*/
var api = require('../../utils/wxApi.js')
var WxParse = require('../../utils/wxParse/wxParse.js');
var app = getApp();
Page({
  data: {
    // 此页面 页面内容距最顶部的距离
    navTopH: getApp().globalData.statusBarHeight + getApp().globalData.titleBarHeight,
    goods_img: '',
    goodsQrcode: '',//该商品详情页的图片路径
    chainsData: {
      total: 0,
      list: []
    },//该商品全部接龙列表数据
    chainsShareCardImg: '',//分享卡片：显示的卡片图路径
    canvasHidden: true,     //分享卡片：画板的显示与隐藏，画板不隐藏会影响页面正常显示
    canvasCardHeight: 1000,//分享卡片：

    chainsShareImg: '',//右上角分享：
    canvasShareHidden: true,     //右上角分享：画板的显示与隐藏，画板不隐藏会影响页面正常显示
    canvasShareHeight: 410,//右上角分享：
    isLoadChains: true,
    isDownloadImgCompleted: false,
    info: {},
    query: {},
    swiperH:wx.getSystemInfoSync().windowWidth,
    storeData: {},
    userInfo: {}, //微信用户信息
    scrollHeight: wx.getSystemInfoSync().windowHeight - 46,

    goods_state: {},
  },
  onLoad:function (query) {
    var sdata = this.data
    wx.showLoading({
      title: '商品加载中',
    })
    if (typeof query !== "undefined") {
      if (typeof query.page_source !== 'undefined' || typeof query.scene !== 'undefined') {
        this.navTopBar = this.selectComponent('#navTopBar')
        if(this.navTopBar){
          this.navTopBar.initLoad( {title: '商品详情', pageSource: 'share'})
        }
      }
      this.setData({
        query: {
          goods_id: query.scene ? query.scene : query.goods_id
        },
        storeData: wx.getStorageSync('storeData')
      })
    }
    var goods_state = {
      1: {
        state_name: sdata.storeData.diy_cx_name !== '' ? sdata.storeData.diy_cx_name : "促销价",
        state_title: sdata.storeData.diy_cx_name !== '' ? sdata.storeData.diy_cx_name : "促销优惠"
      },
      2: {
        state_name: "抢购价",
        state_title: '限时抢购'
      },
      3: {
        state_name: "会员价",
        state_title: 'VIP优惠'
      },
      4: {
        state_name: sdata.storeData.diy_group_price_name !== '' ? sdata.storeData.diy_group_price_name : "合伙价",
        state_title: sdata.storeData.diy_group_price_name !== '' ? sdata.storeData.diy_group_price_name : "代理优惠"
      },
    }
    this.setData({
      goods_state: goods_state
    })
    this.getGoodsData()
  },
  onShow: function () {
    this.setData({
      userInfo: wx.getStorageSync('userInfo'),
      navTopH: getApp().globalData.statusBarHeight + getApp().globalData.titleBarHeight,
    })
    this.footCart = this.selectComponent('#footCart')
    if(this.footCart){
      this.footCart.getCartNum()
    }
  },
  refreshPage: function () {
    this.getGoodsData()
    this.onShow()
  },
  //获取商品详情数据
  getGoodsData: function () {
    var self = this
    var sdata = this.data
    api.wxRequest({
      url: '/index.php?act=Goods&op=getMiniGoodsInfo',
      data:{ goods_id: sdata.query.goods_id },
      method: 'GET'
    }).then(function (res) {
      if(+res.code === 200){
        if(res.data.goods_figure !== ''){
          res.data.goods_figure = JSON.parse(res.data.goods_figure)
        }else{
          res.data.goods_figure = []
        }
        WxParse.wxParse('goodsContent', 'html', res.data.goods_content, self, 5);
        self.setData({
          isLoadChains: false,
          info: res.data,
          goodsQrcode: res.data.main_img
        })
        self.syncPageData({gs_id: sdata.info.gs_id, goods_id: sdata.info.goods_id,buy_num: sdata.info.buy_num})
        if (+sdata.info.is_chains === 1) {
          self.footCart = self.selectComponent('#footCart')
          self.footCart.updFootBtnText('立即接龙')
          self.shareChainsInit(1)
          self.getGoodsMiniCode()
          self.getChainsList()
        }
        self.navTopBar = self.selectComponent('#navTopBar')
        if(self.navTopBar){
          self.navTopBar.initLoad({title: res.data.goods_name})
        }
        /*限时倒计时*/
        if (+sdata.info.state > 0) {
          self.goodsCountTime = self.selectComponent('#goodsCountTime')
          self.goodsCountTime.countTime()
        }
        wx.hideLoading()
      }
    })

  },
  /**region 商品接龙*/
  //获取商品二维码数据
  getGoodsMiniCode: function () {
    var self = this
    var sdata = this.data
    api.wxRequest({
      url: '/index.php?act=Goods&op=getGoodsMiniCode',
      data:{ goods_id: sdata.query.goods_id },
    }).then(function (res) {
      self.setData({
        goodsQrcode: res.data.url
      })
    })
  },
  //获取商品接龙列表数据
  getChainsList: function () {
    var self = this
    var sdata = this.data
    api.wxRequest({
      url: '/index.php?act=Goods&op=queryChainsList',
      data:{ goods_id: sdata.query.goods_id },
    }).then(function (res) {
      self.setData({
        chainsData: res.data
      })
    })
  },
  //接龙画图预备工作、画布右上角分享图.卡片,type-1,分享图，2-卡片[未下载完就点击分享卡片按钮]
  shareChainsInit: function (type, callback) {
    var self = this
    var sdata = this.data
    //下载接龙用户头像到本地
    self.setData({
      canvasShareHidden: false
    })
    if (+sdata.info.chains_list.total > 0) {
      self.downloadFile(sdata.info.main_img).then(function (file) {
        self.setData({
          goods_img: file.tempFilePath
        })
        self.downloadFile(sdata.info.chains_list.list[0].member_avatar).then(function (file0) {
          sdata.info.chains_list.list[0].member_img = file0.tempFilePath
          if (+sdata.info.chains_list.total > 1) {
            self.downloadFile(sdata.info.chains_list.list[1].member_avatar).then(function (file1) {
              sdata.info.chains_list.list[1].member_img = file1.tempFilePath
              if (+sdata.info.chains_list.total > 2) {
                self.downloadFile(sdata.info.chains_list.list[2].member_avatar).then(function (file2) {
                  sdata.info.chains_list.list[2].member_img = file2.tempFilePath
                  if (+sdata.info.chains_list.total > 3) {
                    self.downloadFile(sdata.info.chains_list.list[3].member_avatar).then(function (file3) {
                      sdata.info.chains_list.list[3].member_img = file3.tempFilePath
                      if (+sdata.info.chains_list.total > 4) {
                        self.downloadFile(sdata.info.chains_list.list[4].member_avatar).then(function (file4) {
                          sdata.info.chains_list.list[4].member_img = file4.tempFilePath
                          self.setData({
                            canvasShareHidden: false,
                            isDownloadImgCompleted: true
                          })
                          if (+type === 1) {
                            self.canvasDrawShareImg()
                          } else {
                            callback()
                          }
                        })
                      } else {
                        if (+type === 1) {
                          self.canvasDrawShareImg()
                        } else {
                          callback()
                        }
                      }
                    })
                  } else {
                    if (+type === 1) {
                      self.canvasDrawShareImg()
                    } else {
                      callback()
                    }
                  }
                })
              } else {
                if (+type === 1) {
                  self.canvasDrawShareImg()
                } else {
                  callback()
                }
              }
            })
          } else {
            if (+type === 1) {
              self.canvasDrawShareImg()
            } else {
              callback()
            }
          }
        })
      })
    } else {
      self.downloadFile(sdata.info.main_img).then(function (file) {
        self.setData({
          goods_img: file.tempFilePath,
        })
        if (+type === 1) {
          self.canvasDrawShareImg()
        } else {
          callback()
        }
      })
    }

    if (+sdata.info.chains_list.total >= 5) {
      self.setData({
        canvasCardHeight: 820 + 170,
      })
    } else {
      self.setData({
        canvasCardHeight: 820 + 34*(+sdata.info.chains_list.total)
      })
    }
  },
  //显示商品接龙列表弹框
  showChainsLayer: function () {
    this.chainsLayer = this.selectComponent('#chainsListLayer')
    this.chainsLayer.showLayer()
  },

  //点击分享按钮
  clickChainsShare: function () {
    if (this.data.chainsShareCardImg !== '') {
      this.showChainsCardLayer()
    } else {
      this.setData({
        canvasHidden: false
      })
      wx.showLoading({
        title: '获取卡片中...',
      })
      this.downloadCanvasImg()
    }
  },
  //下载画布用到的跨域的远程图片
  downloadCanvasImg: function () {
    var self = this
    var sdata = this.data
    var qrcode_img = this.data.goodsQrcode.replace("http:","https:")
    wx.downloadFile({
      url: qrcode_img,
      success (res) {
        qrcode_img = res.tempFilePath
        var canvasData = {
          goods_img: sdata.goods_img,
          goods_name: sdata.info.goods_name,
          goods_price: sdata.info.goods_price,
          qrcode_img: qrcode_img
        }
        if (!sdata.isDownloadImgCompleted) {
          self.shareChainsInit(2, function () {
            self.canvasDrawCard(canvasData)
          })
        } else {
          self.canvasDrawCard(canvasData)
        }
      },
      fail (res) {
       /* wx.showLoading({
          title: res.errMsg,
        })*/
      }
    })
  },
  downloadFile: function (imgUrl) {
    if (imgUrl == null ) {
      imgUrl = '../../images/img_common/user_logo.png'
    } else {
      imgUrl = imgUrl.replace("http:","https:")
    }
    return new Promise(function (resolve, reject) {
      wx.downloadFile({
        url: imgUrl,
        success (res) {
          resolve(res)
        },
        fail (res) {
          console.log(res)
          resolve({tempFilePath: '../../images/img_common/user_logo.png'})
        }
      })
    }).catch(function(reason) {
      console.log(reason);
    })
  },
  //画布生成卡片
  canvasDrawCard: function (canvasData) {
    var self = this
    var sdata = this.data
    var unit = 2
    var context = wx.createCanvasContext('goods-share-card')
    /*region 自定义画布内容*/
    context.setFillStyle('#fff')
    context.fillRect(0, 0, 280 * unit, (self.data.canvasCardHeight / 2) * unit)
    context.drawImage(canvasData.goods_img, 0, 0, 280 * unit, 280 * unit)

    var goods_name = canvasData.goods_name
    if (canvasData.goods_name.length > 16) {
      goods_name = canvasData.goods_name.substring(0, 16)
      goods_name = goods_name + (canvasData.goods_name.length > 16 ? '...' : '')
    }
    context.setFontSize(13 * unit)
    context.setFillStyle("#111111")
    context.setTextAlign("left")
    context.fillText(goods_name, 10 * unit, 310 * unit, 200 * unit)

    context.setFontSize(15 * unit)
    context.setFillStyle("#ff0b0b")
    context.setTextAlign("right")
    var price = sdata.info.goods_price
    if (sdata.storeData.credits_model == 1 && sdata.info.credits_limit > 0) {
      price = sdata.info.credits_limit + '积分+￥' + sdata.info.new_price
    } else {
      price = '￥' + (+sdata.info.state > 0 ? sdata.info.new_price : sdata.info.goods_price)
    }
    if (price.length > 6) {
      price = price.substring(0, 6) + '...'
    }
    context.fillText(price, 270 * unit, 310 * unit, 100 * unit)

    /*region 最多显示5个接龙数据*/
    var chainsBefore = 5
    var chainsAfter = 10
    var chainsHeight = 0
    if (+sdata.info.chains_list.total > 0) {
      sdata.info.chains_list.list.forEach(function (value, index) {
        if (index < 5) {
          chainsHeight = 18 * (index + 1)
          context.setFontSize(10 * unit)
          context.setFillStyle("#333333")
          context.setTextAlign("left")
          context.fillText((+sdata.info.chains_list.total - index), 10 * unit, (310 + chainsBefore + chainsHeight) * unit)

          context.drawImage(value.member_img, 30 * unit, (298 + chainsBefore + chainsHeight) * unit, 14 * unit, 14 * unit)

          context.setFontSize(10 * unit)
          context.setFillStyle("#333333")
          context.setTextAlign("left")
          var member_name = value.member_name
          if (member_name.length > 3) {
            member_name = member_name.substring(0, 3) + '...'
          }
          context.fillText(member_name, 50 * unit, (310 + chainsBefore + chainsHeight) * unit, 60 * unit)

          context.setFontSize(9 * unit)
          context.setFillStyle("#999999")
          context.setTextAlign("left")
          context.fillText(value.create_time_text, 80 * unit, (310 + chainsBefore + chainsHeight) * unit, 50 * unit)

          context.setFontSize(10 * unit)
          context.setFillStyle("#333333")
          context.setTextAlign("right")
          var spec_name = value.spec_name != null ? value.spec_name : ''
          if (spec_name.length > 14) {
            spec_name = spec_name.substring(0, 14) + '...'
          }
          context.fillText(spec_name + '+' + value.gou_num, 264 * unit, (310 + chainsBefore + chainsHeight) * unit, 180 * unit)
        }
      })
    } else {
      chainsBefore = 20
      chainsAfter = 0
    }
    /*endregion 最多显示5个接龙数据*/

    context.setLineCap('round')
    context.moveTo(0, (310 + chainsBefore + chainsAfter + chainsHeight) * unit)
    context.lineTo(280 * unit, (310 + chainsBefore + chainsAfter + chainsHeight) * unit)
    context.setStrokeStyle('rgba(102,102,102,0.2)')
    context.stroke()

    context.drawImage(canvasData.qrcode_img, 10 * unit, (320 + chainsBefore + chainsAfter + chainsHeight) * unit,  60 * unit, 60 * unit)

    context.setFontSize(13 * unit)
    context.setFillStyle("#111111")
    context.setTextAlign("left")
    context.fillText("限时优惠，一起来接龙~", 80 * unit, (345 + chainsBefore + chainsAfter + chainsHeight) * unit)

    context.setFontSize(12 * unit)
    context.setFillStyle("#666666")
    context.setTextAlign("left")
    context.fillText("长按识别小程序码接龙", 80 * unit, (365 + chainsBefore + chainsAfter + chainsHeight) * unit)
    /*endregion*/

    //把画板内容绘制成图片，并回调 画板图片路径
    context.draw(false, function () {
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          width: 280 * unit,
          height: (self.data.canvasCardHeight / 2) * unit,
          destWidth: 280 * unit * 2,
          destHeight: (self.data.canvasCardHeight / 2)  * unit * 2,
          canvasId: 'goods-share-card',
          success: function (res) {
            self.setData({
              chainsShareCardImg: res.tempFilePath,
              canvasHidden: true
            })
            if (!res.tempFilePath) {
              wx.showModal({
                title: '提示',
                content: '卡片绘制中，请稍后重试',
                showCancel: false
              })
            }
            wx.hideLoading()
            self.showChainsCardLayer()
          },
          fail: function (res) {
            /*wx.showLoading({
              title: res.errMsg,
            })*/
            self.setData({
              canvasHidden: true
            })
          }
        })
      });
  },
  //显示分享商品接龙卡片
  showChainsCardLayer: function () {
    this.chainsCardLayer = this.selectComponent('#chainsCardLayer')
    this.chainsCardLayer.showLayer(this.data.chainsShareCardImg)
  },

  /*region 右上角分享 的画布*/
  canvasDrawShareImg: function () {
    var self = this
    var sdata = this.data
    var unit = 2
    var context = wx.createCanvasContext('goods-share-img')
    /*region 定义画布内容*/
    context.setFillStyle('#fff')
    context.fillRect(0, 0, 250 * unit, 410 * unit)
    var goods_name = sdata.info.goods_name
    if (goods_name.length > 16) {
      goods_name = goods_name.substring(0, 16) + '...'
    }
    context.setFontSize(13 * unit)
    context.setFillStyle("#111111")
    context.setTextAlign("left")
    context.fillText(goods_name, 0 * unit, 15 * unit, 180 * unit)

    context.setFontSize(15 * unit)
    context.setFillStyle("#ff0b0b")
    context.setTextAlign("right")
    var price = sdata.info.goods_price
    if (sdata.storeData.credits_model == 1 && sdata.info.credits_limit > 0) {
      price = sdata.info.credits_limit + '积分+￥' + sdata.info.new_price
    } else {
      price = '￥' + (+sdata.info.state > 0 ? sdata.info.new_price : sdata.info.goods_price)
    }
    if (price.length > 6) {
      price = price.substring(0, 6) + '...'
    }
    context.fillText(price, 240 * unit, 15 * unit, 120 * unit)

    if (+sdata.info.chains_list.total > 0) {
      var chainsHeight = 0
      /*region 最多显示5个接龙数据*/
      sdata.info.chains_list.list.forEach(function (value, index) {
        if (index < 5) {
          chainsHeight = 20 * (index + 1)
          context.setFontSize(10 * unit)
          context.setFillStyle("#333333")
          context.setTextAlign("left")
          context.fillText((+sdata.info.chains_list.total - index), 0 * unit, (20 + chainsHeight) * unit)

          context.drawImage(value.member_img, 20 * unit, ( 10 + chainsHeight) * unit, 14 * unit, 14 * unit)

          context.setFontSize(10 * unit)
          context.setFillStyle("#333333")
          context.setTextAlign("left")
          var member_name = value.member_name
          if (member_name.length > 4) {
            member_name = member_name.substring(0, 4) + '...'
          }
          context.fillText(member_name, 40 * unit, (20 + chainsHeight) * unit, 60 * unit)

          context.setFontSize(9 * unit)
          context.setFillStyle("#999999")
          context.setTextAlign("left")
          context.fillText(value.create_time_text, 90 * unit, (20 + chainsHeight) * unit, 50 * unit)

          context.setFontSize(10 * unit)
          context.setFillStyle("#333333")
          context.setTextAlign("right")
          var spec_name = value.spec_name != null ? value.spec_name : ''
          if (spec_name.length > 10) {
            spec_name = spec_name.substring(0, 10) + '...'
          }
          context.fillText(spec_name + '+' + value.gou_num, 240 * unit, (20 + chainsHeight) * unit, 220 * unit)
        }
      })
      /*endregion 最多显示5个接龙数据*/
      context.drawImage('../../images/img_common/chains_btn.png', 18 * unit, 170 * unit,  210 * unit, 30 * unit)
    } else {
      context.drawImage(sdata.goods_img, 45, 20 * unit, 205 * unit, 205 * unit)
      context.drawImage('../../images/img_common/chains_btn.png', 18 * unit, 170 * unit,  210 * unit, 30 * unit)
    }
    //把画板内容绘制成图片，并回调 画板图片路径
    context.draw(false, function () {
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: 250 * unit,
        height: (self.data.canvasShareHeight / 2) * unit,
        destWidth: 250 * unit * 2,
        destHeight: (self.data.canvasShareHeight / 2)  * unit * 2,
        canvasId: 'goods-share-img',
        success: function (res) {
          self.setData({
            chainsShareImg: res.tempFilePath,
            canvasShareHidden: true
          })
          console.log(res.tempFilePath)
          self.footCart = self.selectComponent('#footCart')
          self.footCart.updFootBtn(1)
        },
        fail: function (res) {
          /*wx.showLoading({
            title: res.errMsg,
          })*/
          self.setData({
            canvasShareHidden: true
          })
        }
      })
    });
    /*endregion*/
  },
  /*endregion*/
  /**endregion*/
  /**
   * 用户分享自定义
   */
  onShareAppMessage: function(res) {
    var self = this
    var sdata = this.data
    var imgUrl = sdata.info.main_img
    if (+sdata.info.is_chains === 1 && sdata.chainsShareImg !== '') {
      imgUrl = sdata.chainsShareImg
    }
    return {
      path: '/pages/goods-info/goods-info?goods_id=' + sdata.info.goods_id + '&page_source=share',
      imageUrl: imgUrl
    }
  },

  //购物车数据更改=>同步更改该页面数据
  cartToPage: function(event){
    if(event.detail.clearCart){
      this.setData({
        ['info.buy_num']: 0
      })
    } else {
      if(+event.detail.goods_id === +this.data.info.goods_id) {
        this.setData({
          ['info.buy_num']: event.detail.buy_num
        })
      }
    }
    this.syncPageData(event.detail)
  },
  //该页面数据=>更改同步购物车页面数量
  getBuyNum: function (event) {
    this.setData({
      ['info.gs_id']: event.detail.gs_id,
      ['info.buy_num']: event.detail.buy_num,
      ['info.is_cart_multi']: event.detail.is_cart_multi
    })
    this.footCart = this.selectComponent('#footCart')
    this.footCart.getCartNum({cart_num: event.detail.cart_num})
    this.syncPageData(event.detail)
  },
  syncPageData: function (options) {
    var pages = getCurrentPages()
    pages.forEach(function (value, index) {
      //同步分类页数据
      if(value.route == 'pages/classify/classify'){
        pages[index].classifyPageChange(options)
      }
      //同步搜索页列表数据
      if(value.route == 'pages/search/search'){
        pages[index].searchPageChange(options)
      }
    })
  },

  //同步购物车数量【buy-num-layer、spec-layer、spec-minus-layer】
  syncCartNum: function (event) {
    //更新购物车数据
    this.setData({
      ['info.buy_num']: event.detail.buy_num
    })
    this.footCart = this.selectComponent('#footCart')
    this.footCart.getCartNum({cart_num: event.detail.cart_num})
    this.syncPageData(event.detail)
  },

  //buy-num-layer组件 点击显示多规格弹框
  syncSpecLayer: function(event){
    this.specLayerComponent = this.selectComponent('#spec-layer')
    if(event.detail.isShow){
      this.specLayerComponent.showSpecLayer(event.detail.goodsItem)
    }
  },
  //buy-num-layer组件 点击显示多规格--弹框
  syncSpecMinusLayer: function(event){
    this.specMinusLayerComponent = this.selectComponent('#spec-minus-layer')
    if(event.detail.isShow){
      this.specMinusLayerComponent.showSpecMinusLayer(event.detail.goodsItem)
    }
  },

  /**region 用户登录*/
  showLoginLayer: function () {
    this.loginLayer = this.selectComponent('#login-layer')
    this.loginLayer.showLayer()
  }
  /**endregion*/
})
