//获取应用实例
var api = require('../../utils/wxApi.js')
var app = getApp();
Page({
  data:{
    isAuthorize: false,
    loginCompleted: false,
    showSkeleton: false,
    loadCompleted: false,//页面数据加载完成
    query:{
      gc_sort: '',
      //商品排序方式=>
      // 【空：为默认排序[综合]】
      // 【price_asc：价格升序】【price_desc：价格降序】
      // 【sale_desc：销量降序】
      page: 1,
      limit: 20,
      gc_id: -2,//-2：全部，-1：未分类
      goods_tag: [],//商品标签。用逗号分隔。
      // 【is_hot：热卖】,【is_abroad：境外】，【is_promote：特价】，【is_qianggou：限时抢购】，【is_special：精选】，【is_booking：预售】
    },
    load: {
      isBusy: false,
      hasMore: true
    },
    isLoadMore: false,
    tagList: [],//系统标签，商品标签数据
    classifyData: {
      classifyList: [],//左侧分类列表
      is_no_classify: '',//是否有“未分类”0/1

      lastGcId: '-2',//上次选中的分类，当前与上次选的一致，不再请求
    },
    temp: {
      isShowFilterLayer: false//是否显示筛选弹框
    },
    classifyGoods: {
      total: 0, list: []
    },
    specLayer: {
      goodsItem: {}
    },
    userInfo: {}, //微信用户信息
    bannerData: {
      bannerHeight: 0,
      list: []
    } //顶部轮播
  },
  onLoad:function (options) {
    var self = this
    wx.showShareMenu({
      withShareTicket: true//允许分享到群
    })

    if (+app.globalData.psWay === 1) {
      var pend_id = ''
      if(options.scene !== '' && options.scene != undefined){
        // options 中的 scene 需要使用 decodeURIComponent 才能获取到生成二维码时传入的 scene
        var scene = decodeURIComponent(options.scene)
        wx.setStorageSync('pend_num_id', scene)
        pend_id = scene
      } else {
        if (options.pend_num_id) {
          wx.setStorageSync('pend_num_id', options.pend_num_id)
          pend_id = options.pend_num_id
        }
      }
      if (pend_id !== '') {
        app.globalData.psWay = 3
      }
    } else {
      if(options.scene !== '' && options.scene != undefined){
        // options 中的 scene 需要使用 decodeURIComponent 才能获取到生成二维码时传入的 scene
        var scene = decodeURIComponent(options.scene)
        wx.setStorageSync('pend_num_id', scene)
      } else {
        if (options.pend_num_id) {
          wx.setStorageSync('pend_num_id', options.pend_num_id)
        }
      }
    }
    self.setData({
      isAuthorize: wx.getStorageSync('isAuthorize'),
    })
    self.loadIndex = self.selectComponent('#loadIndex')
    self.loadIndex.load().then(function () {
      self.initLoad()
      self.setData({
        loginCompleted: true
      })
      if(wx.getStorageSync('isAuthorize')){
        self.setData({
          isAuthorize: wx.getStorageSync('isAuthorize'),
          showSkeleton: true
        })
        self.getClassify()
      }
    })
  },
  //实时更新购物车数量
  onShow: function(ops){
    wx.showShareMenu({
      withShareTicket: true
    })
    this.footCart = this.selectComponent('#footCart')
    if(this.footCart){
      this.footCart.getCartNum()
    }
    this.initLoad()
  },
  //刷新重新授权/是否有用户信息
  refreshAuth: function(){
    var self = this
    api.loginInit().then(function (res) {
      self.setData({
        isAuthorize: wx.getStorageSync('isAuthorize'),
        loginCompleted: true
      })
      if(wx.getStorageSync('isAuthorize')){
        self.initLoad()
        self.getClassify()
      }
    })
  },
  initLoad: function () {
    this.setData({
      userInfo: wx.getStorageSync('userInfo')
    })
    var default_title = ''
    if (+app.globalData.psWay === 1) {
      default_title = '外卖系统'
    } else {
      default_title = '点餐系统'
    }
    var barTitle = wx.getStorageSync('storeData').store_name || default_title
    wx.setNavigationBarTitle({title: barTitle})
  },
  /**
   * 用户分享自定义
   */
  onShareAppMessage: function(res) {
    //'pend_num_id@recommend_id='
    var query = wx.getStorageSync("pend_num_id")+'@'+wx.getStorageSync("member_id")
    return {
      title: wx.getStorageSync("storeData").store_name,
      path: '/pages/classify/classify?pend_recommend=' + query,
      //自定义图片路径，可以是本地文件路径、代码包文件路径或者网络图片路径。支持PNG及JPG。显示图片长宽比是 5:4。
      imageUrl: wx.getStorageSync("storeData").store_img
    }
  },

  /** region其他页面【商品详情页、搜索列表页、购物车页面】修改当前页数据*/
  /* options = {goods_id: '',buy_num: '',cart_num: '', clearCart: true[是否清空购物车]}*/
  classifyPageChange(options) {
    var self = this
    var sdata = self.data
    if(options.clearCart){
      sdata.classifyGoods.list.forEach(function (value, index) {
        var buy_num = 'classifyGoods.list['+ index + '].buy_num'
        self.setData({
          [buy_num]: 0
        })
      })
    } else {
      var key = -1
      sdata.classifyGoods.list.forEach(function (value, index) {
        if(+options.goods_id === +value.goods_id){
          key = index
        }
      })
      if(key !== -1){
        var itemNum = 'classifyGoods.list['+ key + '].buy_num'
        self.setData({
          [itemNum]: options.buy_num
        })
      }
    }

  },
  //购物车数据更改=>同步更改该页面数据
  cartToPage: function(event){
    this.classifyPageChange(event.detail)
  },
  /**endregion*/

  /**region 左侧分类操作*/
  //获取分类列表数据
  getClassify: function () {
    var self = this
    api.wxRequest({
      url: '/index.php?act=Classify&op=getClassify',
      method: 'GET'
    }).then(function (res) {
      var sys_tag = [
        {tag_id: 'is_hot', tag_name: '热卖'}, {tag_id: 'is_abroad', tag_name: '境外'},
        {tag_id: 'is_promote', tag_name: '特价'}, {tag_id: 'is_qianggou', tag_name: '限时抢购'},
        {tag_id: 'is_special', tag_name: '精选'}, {tag_id: 'is_booking', tag_name: '预售'}
      ] //系统标签
      res.data.goods_tag = res.data.goods_tag.concat(sys_tag)
      res.data.goods_tag.forEach(function (value) {
        value.checked = false
      })
      res.data.goods_classify.forEach(function (value) {
        value.isOpen = false //当前分类是否展开子级
        if(value.list.length > 0){
          value.list.forEach(function (value2) {
            value2.isOpen = false
          })
        }
      })
      var banner_height = 0
      var content_height = '100%'
      var banner_ctrl = 0
      var banner_list = []
      if (+getApp().globalData.psWay === 1) {
        // 外卖
        banner_ctrl = res.data.decoration_data.mini_wm_ad_ctrl
        banner_list = res.data.decoration_data.mini_wm_data.img_list
      } else {
        // 堂食
        banner_ctrl = res.data.decoration_data.mini_ts_ad_ctrl
        banner_list = res.data.decoration_data.mini_ts_data.img_list
      }
      if (+banner_ctrl === 1 && banner_list.length > 0) {
        banner_height = wx.getSystemInfoSync().windowWidth / (750 / 270)
      }
      content_height = 'calc(100% - ' + banner_height + 'px)'
      self.setData({
        ['classifyData.classifyList']: res.data.goods_classify,
        ['classifyData.is_no_classify']: res.data.is_no_classify,
        tagList: res.data.goods_tag,
        ['bannerData.bannerHeight']: banner_height,
        ['bannerData.contentHeight']: content_height,
        ['bannerData.isShow']: banner_ctrl,
        ['bannerData.list']: banner_list
      })
      self.resetSearch()
    })
  },
  //切换左侧分类
  //c_type=0:一级分类，1:二级分类，2:三级分类；gc_id:对应当前分类id
  changeClassify: function (event) {
    var self = this
    var sdata = this.data
    var el = event.currentTarget
    var c_type = el.dataset.type
    var gc_id = el.dataset.gcid
    var gckey1 = el.dataset.gckey1 //一级分类key == -1:全部分类||未分类，无子级
    var gckey2 = el.dataset.gckey2 //二级分类key
    var gckey3 = el.dataset.gckey3 //三级分类key
    var setDataItem, gcItemOpen
    if(+gckey1 !== -1){
      switch (+c_type) {
        case 0:
          setDataItem = 'classifyData.classifyList[' + gckey1 + ']'
          gcItemOpen = sdata.classifyData.classifyList[gckey1].isOpen
          break;
        case 1:
          setDataItem = 'classifyData.classifyList[' + gckey1 + '].list['+ gckey2 + ']'
          gcItemOpen = sdata.classifyData.classifyList[gckey1].list[gckey2].isOpen
          break;
        case 2:
          setDataItem = 'classifyData.classifyList[' + gckey1 + '].list['+ gckey2 + '].list[' + gckey3 + ']'
          gcItemOpen = sdata.classifyData.classifyList[gckey1].list[gckey2].list[gckey3].isOpen
          break;
        default:
          break;
      }
    }
    if(+sdata.classifyData.lastGcId !== +gc_id){
      //重置初始化
      self.setData({
        ['classifyData.lastGcId']: gc_id,
        ["query.gc_id"]: gc_id,
      })
      self.resetSearch()
    }
    self.setData({
      [setDataItem+'.isOpen']: !gcItemOpen
    })

  },
  /**endregion 左侧分类操作*/

  /**region 右上角筛选条件*/
  setSort: function (event) {
    var self = this
    var type = event.currentTarget.dataset.type
    var resultType = type
    switch (type) {
      case 'sale':
        resultType = self.data.query.gc_sort === 'sale_desc' ? '' : 'sale_desc'
        break;
      case 'price':
        resultType = self.data.query.gc_sort === 'price_asc' ? 'price_desc' : 'price_asc'
        break;
      default:
        break;
    }
    self.setData({
      ['query.gc_sort']: resultType,
    })
    self.resetSearch()
  },
  //显示||隐藏筛选弹框
  filterSearchLayer: function(){
    this.setData({
      ['temp.isShowFilterLayer']: !this.data.temp.isShowFilterLayer
    })
  },
  //重置筛选条件
  resetFilterSearch: function(){
    var arr = this.data.tagList
    arr.forEach(function (value) {
      value.checked = false
    })
    this.setData({
      ['query.goods_tag']: [],
      tagList: arr,
    })
    this.resetSearch()
  },
  //切换标签
  changeTag: function(event){
    var sdata = this.data
    var tag_id = event.currentTarget.dataset.tagid
    var itemkey = event.currentTarget.dataset.itemkey
    var tag = sdata.query.goods_tag
    var index = +sdata.query.goods_tag.indexOf(tag_id)
    var itemCheck = 'tagList['+itemkey+'].checked'
    if(index === -1){
      tag.splice(tag.length, 0, tag_id)
      this.setData({
        [itemCheck]: true
      })
    }else {
      tag.splice(index , 1)
      this.setData({
        [itemCheck]: false
      })
    }
    this.setData({
      ['query.goods_tag']: tag,
    })
    this.resetSearch()
  },
  //重置查询列表
  resetSearch: function(){
    this.setData({
      ['query.page']: 1,
      ['query.limit']: 20,
      isLoadMore: false,
      ["classifyGoods.total"]: 0,
      ["classifyGoods.list"]: [],
    })
    wx.pageScrollTo({
      scrollTop: 0
    })
    this.getClassifyGoods()
  },
  /**endregion 右上角筛选条件*/

  /**region 获取右侧分类商品列表*/
  getClassifyGoods: function () {
    var self = this
    var sdata = this.data
    self.setData({
      ['load.isBusy']: true
    })
    var query = JSON.stringify(sdata.query)
    query = JSON.parse(query)
    var goodsTag = query.goods_tag.join(',')
    query.goods_tag = goodsTag
    api.wxRequest({
      url: '/index.php?act=Classify&op=getClassifyGoodsList',
      data: query,
      method: 'GET'
    }).then(function (res) {
      if (+res.data.currentTotal < 20) {
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
          classifyGoods: res.data
        })
      } else {
        //加载更多
        var resultList = sdata.classifyGoods.list
        resultList = resultList.concat(res.data.list)
        self.setData({
          ['classifyGoods.list']: resultList,
        })
      }
      self.setData({
        ['query.page']: sdata.query.page+1,
        ['load.isBusy']: false,
        showSkeleton: false,
        loadCompleted: true
      })
      wx.hideLoading()
    })
  },
  moreGoods: function () {
    var self = this
    var sdata = this.data
    if (sdata.load.hasMore && !sdata.load.isBusy) {
      self.setData({
        isLoadMore: true,
        ['load.isBusy']: true,
      })
      self.getClassifyGoods()
    }
  },
  /**endregion 获取右侧分类商品列表*/

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
});
