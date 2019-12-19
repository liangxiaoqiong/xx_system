// pages/address/address-info/address-info.js
var api = require('../../../utils/wxApi.js')
var util = require('../../../utils/util.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    info: {
      address_id: 0,
      member_name: '', //联系人
      member_tel: '', //手机号
      country_id: '', //国家ID
      province_id: '', //省ID
      city_id: '', //市ID
      area_id: '', //区ID
      country: '', //国家名称
      province: '', //省名称
      city: '', //市名称
      area: '', //区名称
      address: '', //详细地址
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if(typeof options.id !== 'undefined') {
      this.setData({
        info: getApp().globalData.editAddress
      })
    }
    /*var region = {
      regionId: {
        country_id: this.data.info.country_id, //国家ID
        province_id: this.data.info.province_id, //省ID
        city_id: this.data.info.city_id, //市ID
        area_id: this.data.info.area_id, //区ID
      },
      regionName: {
        country: this.data.info.country, //国家
        province: this.data.info.province, //省
        city: this.data.info.city, //市
        area: this.data.info.area, //区
      }
    }*/
    this.pickRegion = this.selectComponent('#pickRegion')
    this.pickRegion.loadInit(this.data.info)
  },
  bindInput: function (event) {
    var type = event.target.dataset.input
    this.setData({
      ['info.' + type]: event.detail.value
    })
  },
  //同步地址选择器的数据
  syncRegion: function (event) {
    this.setData({
      ['info.country_id']: event.detail.regionId[0],
      ['info.province_id']: event.detail.regionId[1],
      ['info.city_id']: event.detail.regionId[2],
      ['info.area_id']: event.detail.regionId[3],
      ['info.country']: event.detail.regionName[0],
      ['info.province']: event.detail.regionName[1],
      ['info.city']: event.detail.regionName[2],
      ['info.area']: event.detail.regionName[3],
    })
  },
  checkAddress: function () {
    var self = this
    var sdata = this.data
    if (sdata.info.member_name === '') {
      api.toastError('请填写收货人的姓名')
      return false
    }
    if (!util.isPhone(sdata.info.member_tel)) {
      api.toastError('请填写正确的收货人手机号')
      return false
    }
    if (sdata.info.country_id === '' || sdata.info.province_id === '' || sdata.info.city_id === '' || sdata.info.area_id === '') {
      api.toastError('请选择收货地址')
      return false
    }
    if (sdata.info.address === '') {
      api.toastError('请填写详细地址')
      return false
    }
    self.saveAddress()
  },
  //保存地址
  saveAddress: function () {
    var self = this
    var sdata = this.data
    var url_op = ''
    if(+sdata.info.address_id > 0) {
      url_op = 'update'
    } else {
      url_op = 'addaddress'
    }
    api.wxRequest({
      url: '/index.php?act=cntaddress&op=' + url_op,
      data: {content: JSON.stringify(sdata.info)},
      header: {
        'contentType': 'application/x-www-form-urlencoded'
      }
    }).then(function (res) {
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1000
      })
      setTimeout(function () {
        wx.navigateBack()
      }, 1000)
    })
  },
  //删除地址
  delAddress: function () {
    var self = this
    var sdata = this.data
    wx.showModal({
      title: '确定删除该地址吗?',
      content: '',
      confirmText: '确定',
      confirmColor: '#f82e2e',
      success (res) {
        if (res.confirm) {
          api.wxRequest({
            url: '/index.php?act=cntaddress&op=delete',
            data: {address_id: sdata.info.address_id}
          }).then(function (res) {
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 1000
            })
            setTimeout(function () {
              wx.navigateBack()
            }, 1000)
          })
        }
      }
    })
  }
})