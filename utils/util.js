const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

//限制输入正整数
var numInt = function(value){
  value = ''+value;
  if (value.length == 1) {
    value = value.replace(/[^0-9]/g, '')
  } else {
    value = value.replace(/\D/g, '')
  }
  return Number(value)
}

//限制输入小数
var numPoint = function(value){
  value = value.match(/\d+(\.\d{0,2})?/) ? value.match(/\d+(\.\d{0,2})?/)[0] : ''
  return value
}
var dateTimestamp = function(val){
  var date = new Date(val.replace(/-/g, '/'))
  date = date.getTime()
  return date
}
var isPhone = function(value){
  var reg = /^1[3|4|5|7|8|9][0-9]\d{4,8}$/;
  return reg.test(value);
}
//进入首页
var linkToIndex = function () {
  var psWay = getApp().globalData.psWay
  if(psWay === 3) {
    var pend_num_id = wx.getStorageSync('pend_num_id')
    wx.reLaunch({
      url: '/pages/classify/classify?scene='+pend_num_id
    })
  } else {
    wx.reLaunch({
      url: '/pages/classify/classify'
    })
  }
}


/**
 * 秒=>天，时，分，秒
 * toType='day','hour','min','sec'
 * time=单位s
 */
var timeTo_ = function (toType, time) {
  switch (toType) {
    case 'day':
      var value_ = Math.floor((time / 3600) / 24);        //计算天
      //value_=(Array(2).join(0) + value_).slice(-2);
      break;
    case 'hour':
      var value_ = Math.floor((time / 3600) % 24);      //计算小时
      value_ = (Array(2).join(0) + value_).slice(-2);
      break;
    case 'min':
      var value_ = Math.floor((time / 60) % 60);      //计算分
      value_ = (Array(2).join(0) + value_).slice(-2);
      break;
    case 'sec':
      var value_ = Math.floor(time % 60);             // 计算秒
      value_ = (Array(2).join(0) + value_).slice(-2);
      break;
    default:
      break;
  }
  return value_;
}
module.exports = {
  formatTime: formatTime,
  numInt: numInt,
  numPoint: numPoint,
  dateTimestamp: dateTimestamp,
  isPhone: isPhone,
  linkToIndex: linkToIndex,
  timeTo_: timeTo_,
}
