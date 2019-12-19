/*pages/search.search.js*/
var api = require('../../utils/wxApi.js')
Page({
  data: {
    searchCompleted: false,
    query: {
      page: 1,
      limit: 20,
      gc_id: -2,
      goods_name: ''
    },
    load: {
      hasMore: true
    },
    isLoadMore: false,
    searchTag: {},
    searchGoods: {},
    userInfo: '', //微信用户信息
  },
  onLoad: function () {
    this.getSearchTag()
  },
  /**region 其他页面||子组件 数据同步 start*/
  //实时更新购物车数量
  onShow: function(){
    this.setData({
      userInfo: wx.getStorageSync('userInfo')
    })
    this.footCart = this.selectComponent('#footCart')
    if(this.footCart){
      this.footCart.getCartNum()
    }
  },
  refreshPage: function () {
    this.getSearchTag()
    this.onShow()
  },
  /**其他页面【商品详情页、购物车页面】修改当前页数据*/
  /* options = {gs_id: '', goods_id: '',buy_num: '',cart_num: '', clearCart: true[是否清空购物车]}*/
  searchPageChange: function(options){
    var self = this
    var sdata = self.data
    if(options.clearCart){
      sdata.searchGoods.list.forEach(function (value, index) {
        var buy_num = 'searchGoods.list['+ index + '].buy_num'
        self.setData({
          [buy_num]: 0
        })
      })
    } else {
      var key = -1
      sdata.searchGoods.list.forEach(function (value, index) {
        if(+options.goods_id === +value.goods_id){
          key = index
        }
      })
      if(key !== -1){
        var itemNum = 'searchGoods.list['+ key + '].buy_num'
        var item_gs_id = 'searchGoods.list['+ key + '].gs_id'
        self.setData({
          [itemNum]: options.buy_num,
          [item_gs_id]: options.gs_id
        })
      }
    }

  },
  //购物车页面回调
  cartToPage: function(event){
    this.searchPageChange(event.detail)
  },
  /*同步【分类页】的buy_num数据*/
  syncPageData: function (options) {
    var pages = getCurrentPages()
    pages.forEach(function (value, index) {
      //同步分类页数据
      if (value.route == 'pages/classify/classify') {
        pages[index].classifyPageChange(options)
      }
    })
  },
  /* options = {goods_id: '',buy_num: '',cart_num: '', clearCart: true[是否清空购物车]}*/
  searchPageChange(options) {
    var self = this
    var sdata = self.data
    if(options.clearCart){
      sdata.searchGoods.list.forEach(function (value, index) {
        var buy_num = 'searchGoods.list['+ index + '].buy_num'
        self.setData({
          [buy_num]: 0
        })
      })
    } else {
      var key = -1
      sdata.searchGoods.list.forEach(function (value, index) {
        if(+options.goods_id === +value.goods_id){
          key = index
        }
      })
      if(key !== -1){
        var itemNum = 'searchGoods.list['+ key + '].buy_num'
        self.setData({
          [itemNum]: options.buy_num
        })
      }
    }

  },
  /**endregion 其他页面||子组件 数据同步 end*/


  /**region 搜索的商品列表 start*/
  //获取热门搜索tag
  getSearchTag: function(){
    var self = this
    var sdata = this.data
    api.wxRequest({
      url: '/index.php?act=MiniLogin&op=getSearchTags',
    }).then(function(res){
      self.setData({
        searchTag: res.data
      })
    })
  },
  //快捷热门词搜索
  changeKeyword: function(event){
    var keyword = event.currentTarget.dataset.item.tags
    this.setData({
      ['query.goods_name']: keyword,
      ['query.page']: 1,
    })
    this.getHotSearch()
  },
  //提交搜索=>接口请求获取数据
  submitSearch: function (event) {
    this.setData({
      ['query.goods_name']: event.detail.value,
      ['query.page']: 1,
    })
    this.getHotSearch()
  },
  //输入时触发
  inputSearch: function (event) {
    this.setData({
      ['query.goods_name']: event.detail.value
    })
    if(this.data.query.goods_name === ''){
      this.setData({
        searchCompleted: false
      })
    }
  },
  //清空输入框的搜索条件
  clearSearch: function () {
    this.setData({
      ['query.goods_name']: '',
        searchCompleted: false,
    })
  },
  //获取热搜商品
  getHotSearch: function () {
    var self = this
    var sdata = this.data
    wx.showLoading({
      title: '搜索中...'
    })
    api.wxRequest({
      url: '/index.php?act=Classify&op=getClassifyGoodsList',
      data: sdata.query,
      method: 'GET'
    }).then(function (res) {
      if (+res.data.currentTotal <= 0) {
        self.setData({
          ['load.hasMore']: false
        })
      } else {
        self.setData({
          ['load.hasMore']: true
        })
      }
      if (sdata.isLoadMore === false) {
        self.setData({
          searchGoods: res.data
        })
      } else {
        //加载更多
        var resultList = sdata.searchGoods.list
        resultList = resultList.concat(res.data.list)
        self.setData({
          ['searchGoods.list']: resultList,
        })
      }
      self.setData({
        ['query.page']: sdata.query.page + 1,
        searchCompleted: true,
      })
      wx.hideLoading()
    }).catch(function(res){
      self.setData({
        searchCompleted: true
      })
      wx.hideLoading()
    })
  },
  moreGoods: function () {
    var self = this
    var sdata = this.data
    if (sdata.load.hasMore) {
      self.getHotSearch()
    }
  },
  /**endregion 搜索的商品列表 end*/

  /**region 子组件数据返回 同步更改购物车数量*/
  //同步购物车数量【goods-item、spec-layer、spec-minus-layer】
  syncCartNum: function (event) {
    //多规格商品返回【spec-layer、spec-minus-layer】
    if(event.detail.isSyncGoodsItem){
      this.goods_item = this.selectComponent('#goods-item__'+event.detail.goods_id)
      this.goods_item.syncBuyNum(event.detail)
    }
    //更新购物车数据
    this.footCart = this.selectComponent('#footCart')
    this.footCart.getCartNum({cart_num: event.detail.cart_num})
    this.syncPageData(event.detail)
  },

  //goods-item组件 点击显示多规格弹框
  syncSpecLayer: function(event){
    this.specLayerComponent = this.selectComponent('#spec-layer')
    if(event.detail.isShow){
      this.specLayerComponent.showSpecLayer(event.detail.goodsItem)
    }
  },
  //goods-item组件 点击显示多规格--弹框
  syncSpecMinusLayer: function(event){
    this.specMinusLayerComponent = this.selectComponent('#spec-minus-layer')
    if(event.detail.isShow){
      this.specMinusLayerComponent.showSpecMinusLayer(event.detail.goodsItem)
    }
  },
  /**endregion*/

  /**region 用户登录*/
  showLoginLayer: function () {
    this.loginLayer = this.selectComponent('#login-layer')
    this.loginLayer.showLayer()
  }
  /**endregion*/

})
