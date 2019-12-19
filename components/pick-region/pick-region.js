// components/pick-region/pick-region.js
var api = require('../../utils/wxApi.js')
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    isDefault: false,
    regionAreaNameList: [
     /* [],//国家列表
      [], //省份列表
      [], //城市列表
      [], //区域列表*/
    ],//area_name
    regionListObj: [
      /* [],//国家列表
       [], //省份列表
       [], //城市列表
       [], //区域列表*/
    ],
    selectRegion: [0, 0, 0, 0],//同步选择的地址key
    defaultRegionId: ['', '', '', ''],//初始化的地址area_id
    defaultRegionName: ['', '', '', ''],//初始化的地址area_name
    submitSelectRegionId: ['', '', '', ''],//确定 同步选择的地址area_id
    submitSelectRegionName: ['', '', '', ''],//确定 同步选择的地址area_name
  },

  /**
   * 组件的方法列表
   */
  methods: {
    loadInit: function (options) {
      if(options.country_id !== '' && options.province_id !== '' && options.city_id !== '' && options.area_id !== '') {
        var arr_id = [options.country_id, options.province_id, options.city_id, options.area_id]
        var arr_name = [options.country, options.province, options.city, options.area]
        this.setData({
          defaultRegionId: arr_id,
          submitSelectRegionId: arr_id,
          defaultRegionName: arr_name,
          submitSelectRegionName: arr_name,
          isDefault: true
        })
      }
      this.getCountryList()
    },
    /**region 获取地址国家、省份、城市、区域列表 start*/
    //获取国家列表
    getCountryList: function () {
      var self = this
      api.wxRequest({
        url: '/index.php?act=Area&op=getCountryList',
        method: 'GET',
      }).then(function (res) {
        self.setData({
          ['regionListObj.0']: res.data
        })
        var cid = self.data.defaultRegionId[0] !== '' ? self.data.defaultRegionId[0] : res.data[0].area_id
        self.getProvinceList(cid)
      })
    },
    //获取省份列表
    getProvinceList: function (pid) {
      var self = this
      api.wxRequest({
        url: '/index.php?act=Area&op=getProvinceList',
        method: 'GET',
        data: {
          pid: pid
        }
      }).then(function (res) {
        self.setData({
          ['regionListObj.1']: res.data,
        })
        var cid = self.data.defaultRegionId[1] !== '' ? self.data.defaultRegionId[1] : res.data[0].area_id
        self.getCityList(cid)
      })
    },
    //获取城市列表
    getCityList: function (pid) {
      var self = this
      api.wxRequest({
        url: '/index.php?act=Area&op=getCityList',
        method: 'GET',
        data: {
          pid: pid
        }
      }).then(function (res) {
        self.setData({
          ['regionListObj.2']: res.data,
        })
        var cid = self.data.defaultRegionId[2] !== '' ? self.data.defaultRegionId[2] : res.data[0].area_id
        self.getAreaList(cid)
      })
    },
    //获取区域列表
    getAreaList: function (pid) {
      var self = this
      api.wxRequest({
        url: '/index.php?act=Area&op=getAreaList',
        method: 'GET',
        data: {
          pid: pid
        }
      }).then(function (res) {
        self.setData({
          ['regionListObj.3']: res.data,
        })
        self.getCompleted()
      })
    },
    /**endregion 获取地址国家、省份、城市、区域列表 end*/

    /**region 异步加载完成 start*/
    getCompleted: function(){
      var self = this
      var sdata = this.data
      var countryName = [], provinceName = [], cityName = [], areaName = []
      sdata.regionListObj[0].forEach(function (value, index) {
        countryName[index] = value.area_name
      })
      sdata.regionListObj[1].forEach(function (value, index) {
        provinceName[index] = value.area_name
      })
      sdata.regionListObj[2].forEach(function (value, index) {
        cityName[index] = value.area_name
      })
      sdata.regionListObj[3].forEach(function (value, index) {
        areaName[index] = value.area_name
      })
      var regionAreaNameList = []
      regionAreaNameList[0] = countryName
      regionAreaNameList[1] = provinceName
      regionAreaNameList[2] = cityName
      regionAreaNameList[3] = areaName
      self.setData({
        regionAreaNameList: regionAreaNameList
      })
      if(sdata.isDefault) {
        var selectRegion = []
        sdata.regionAreaNameList.forEach(function (value, index) {
          value.forEach(function (value2, index2) {
            if(sdata.defaultRegionName[index] === value2) {
              selectRegion[index] = index2
            }
          })
        })
        self.setData({
          selectRegion: selectRegion,
          isDefault: false,
        })
      }
      console.log(this.data)
    },
    /**endregion 异步加载完成 end*/

    /**region 改变picker的选值 start*/
    //点击确定，传选值给父组件
    bindRegionPickerChange: function(e){
      console.log('picker发送选择改变，携带值为', e.detail.value)
      var self = this
      var sdata = this.data
      self.setData({
        selectRegion: e.detail.value
      })
      var submitSelectRegionId = []
      var submitSelectRegionName = []
      console.log('sdata.regionListObj.length='+sdata.regionListObj.length)
      for(var i = 0; i < 4; i++) {
        var value = sdata.regionListObj[i]
        value.forEach(function (value2, index2) {
          if(sdata.selectRegion[i] === index2){
            submitSelectRegionId[i] = value2.area_id
            submitSelectRegionName[i] = value2.area_name
          }
        })
      }
      self.setData({
        submitSelectRegionId: submitSelectRegionId,
        submitSelectRegionName: submitSelectRegionName
      })
      var options = {
        regionId: submitSelectRegionId,
        regionName: submitSelectRegionName
      }
      self.triggerEvent('myevent', options)
    },
    bindRegionPickerColumnChange: function(e){
      console.log('修改的列为', e.detail.column, '，值为', e.detail.value)
      var column = e.detail.column
      var key = e.detail.value
      var self = this
      var sdata = this.data
      self.data.selectRegion[e.detail.column] = e.detail.value
      self.setData({
        selectRegion: this.data.selectRegion
      })
      var pid = ''
      sdata.regionListObj[column].forEach(function (value, index) {
        if(+key === +index) {
          pid = value.area_id
        }
      })
      switch (column) {
        case 0:
          self.getProvinceList(pid)
          break;
        case 1:
          self.getCityList(pid)
          break;
        case 2:
          self.getAreaList(pid)
          break;
        default:
          break;
      }
    },
    /**endregion 改变picker的选值 end*/





















    bindMultiPickerColumnChange(e) {
      console.log('修改的列为', e.detail.column, '，值为', e.detail.value)
      const data = {
        multiArray: this.data.multiArray,
        multiIndex: this.data.multiIndex
      }
      data.multiIndex[e.detail.column] = e.detail.value
      switch (e.detail.column) {
        case 0:
          switch (data.multiIndex[0]) {
            case 0:
              data.multiArray[1] = ['扁性动物', '线形动物', '环节动物', '软体动物', '节肢动物']
              data.multiArray[2] = ['猪肉绦虫', '吸血虫']
              break
            case 1:
              data.multiArray[1] = ['鱼', '两栖动物', '爬行动物']
              data.multiArray[2] = ['鲫鱼', '带鱼']
              break
          }
          data.multiIndex[1] = 0
          data.multiIndex[2] = 0
          break
        case 1:
          switch (data.multiIndex[0]) {
            case 0:
              switch (data.multiIndex[1]) {
                case 0:
                  data.multiArray[2] = ['猪肉绦虫', '吸血虫']
                  break
                case 1:
                  data.multiArray[2] = ['蛔虫']
                  break
                case 2:
                  data.multiArray[2] = ['蚂蚁', '蚂蟥']
                  break
                case 3:
                  data.multiArray[2] = ['河蚌', '蜗牛', '蛞蝓']
                  break
                case 4:
                  data.multiArray[2] = ['昆虫', '甲壳动物', '蛛形动物', '多足动物']
                  break
              }
              break
            case 1:
              switch (data.multiIndex[1]) {
                case 0:
                  data.multiArray[2] = ['鲫鱼', '带鱼']
                  break
                case 1:
                  data.multiArray[2] = ['青蛙', '娃娃鱼']
                  break
                case 2:
                  data.multiArray[2] = ['蜥蜴', '龟', '壁虎']
                  break
              }
              break
          }
          data.multiIndex[2] = 0
          break
      }
      console.log(data.multiIndex)
      this.setData(data)
    },
  },
})
