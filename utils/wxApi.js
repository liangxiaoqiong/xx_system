var md5 = require('md5.js')    // 引入md5.js文件
var wxRequestFail = 0//请求失败，重新请求，防止死循环，最多3次
var requestUrl = 'https://mapi.duinin.com'
var wxApi = {
  wxRequest: function (config) {
    wxRequestFail++
    return new Promise(function (resolve, reject) {
      var nonceStr = Math.random().toString(36).substr(2, 15)
      var timeStamp = parseInt(new Date().getTime() / 1000) + ''
      var sign = md5.hexMD5('nonceStr='+nonceStr+'&timeStamp='+timeStamp+'&key=vjd8988998').toUpperCase()
      var store_id = wx.getStorageSync('store_id')
      var token = wx.getStorageSync('token')
      var param = '&nonceStr='+nonceStr+'&timeStamp='+timeStamp+'&sign='+sign+'&store_id='+store_id+'&from=mini&key='+token
      config.data = config.data || {}
      if (store_id === '') {
        wxApi.getStoreData().then(function () {
          store_id = wx.getStorageSync('store_id')
          param = '&nonceStr='+nonceStr+'&timeStamp='+timeStamp+'&sign='+sign+'&store_id='+store_id+'&from=mini&key='+token
          wxApi.requestSubmit(config, param, resolve, reject)
        })
      } else {
        wxApi.requestSubmit(config, param, resolve, reject)
      }
    })
  },
  requestSubmit: function (config, param, resolve, reject) {
    wx.request({
      url: requestUrl + '' + config.url + '' + param,
      data: config.data,
      dataType: config.dataType || 'json',
      method: config.method || 'POST',
      header: {
        "content-type": (config.header && config.header.contentType) ? config.header.contentType : "application/json",
      },
      success: function (res) {
        var oldResult = res.data
        var result = {}
        result.code = oldResult.code || (oldResult.result === 0 ? 200 : oldResult.result)
        result.msg = oldResult.msg || oldResult.error
        result.data = oldResult.data || oldResult.datas
        if (result.code === 200){
          resolve(result)
        }else{
          if(result.code === -100 || result.code === -999){
            //会话过期,重新登录
            var pend_num_id = wx.getStorageSync('pend_num_id')
            wx.clearStorageSync() //清除缓存，重新启动页面
            wx.reLaunch({
              url: '/pages/classify/classify?scene='+pend_num_id
            })
          }wx.showToast({
            title: result.msg ? result.msg : '请求失败了',
            icon: 'none',
            duration: 2000
          })
          reject(result)
        }
      },
      fail: function (err) {
        console.log(err)
        console.log("请求失败了")
        if(wxRequestFail < 3){
          wxApi.wxRequest(config)
        } else {
          wxRequestFail = 0
          reject(err)
        }
      }
    })
  },

  loginInit: function(isTimeOut){
    return new Promise(function (resolve, reject) {
      var token_timeout = wx.getStorageSync('token_timeout')
      var timeStamp = parseInt(new Date().getTime() / 1000) + (24 * 60 * 60 * 1000)
      var userInfo = wx.getStorageSync('userInfo')
      wxApi.getStoreData().then(function (res) {
        //isTimeOut = true
        if(token_timeout === '' || +timeStamp <= +token_timeout || isTimeOut || userInfo === '') {
          // 登录
          wx.login({
            success (resLogin) {
              console.log(resLogin)
              wxApi.wxRequest({
                url: '/index.php?act=MiniLogin&op=getLoginToken',
                data: {code: resLogin.code},
                method: 'GET'
              }).then(function (resToken) {
                // 登录成功获取用户信息
                wx.getSetting({
                  success (resSetting) {
                    if (resSetting.authSetting['scope.userInfo']) {
                      wx.getUserInfo({
                        withCredentials: true,
                        success (resUserinfo) {
                          // 可以将 res 发送给后台解码出 unionId
                          wx.setStorageSync('login_token', resToken.data.login_token)
                          var data = {
                            login_token: resToken.data.login_token,
                            recommend_id: wx.getStorageSync('recommend_id') || '',
                            encryptedData: resUserinfo.encryptedData,
                            iv: resUserinfo.iv
                          }
                          //登录获取member_id
                          wxApi.wxRequest({
                            url: '/index.php?act=MiniLogin&op=login',
                            data: data
                          }).then(function (res) {
                            resolve(res)
                            wx.setStorageSync('member_id', res.data.member_id)
                            var userInfo_ = {}
                            var userInfo = JSON.stringify(res.data.wx_info)
                            userInfo_ = JSON.parse(userInfo)
                            userInfo_.member_name = res.data.member_info.member_name
                            wx.setStorageSync('userInfo', userInfo_)
                            wx.setStorageSync('token', res.data.token)
                            wx.setStorageSync('token_timeout', res.data.token_timeout)
                            wx.setStorageSync('isAuthorize', true)
                          }).catch(function (res) {
                            reject(res)
                          })
                        },
                        fail (res){
                          reject(res)
                        }
                      })
                    } else {
                      wx.setStorageSync('isAuthorize', false)
                      var result = {
                        code: 401,
                        msg: '未授权：获取用户数据失效'
                      }
                      reject(result)
                    }
                  },
                  fail (res){
                    reject(res)
                  }
                })
              })
            },
            fail (res){
              console.log(res)
              reject(res)
            }
          })
        }else{
          //缓存中获取
          var token = wx.getStorageSync('token')
          console.log('token='+token)
          console.log('缓存中获取')
          wx.setStorageSync('isAuthorize', true)
          resolve()
        }
      })
    }).catch(function(reason) {
      console.log(reason);
    });
  },

  //获取店铺信息
  getStoreData: function(){
    return new Promise(function (resolve, reject) {
      var store_id = wx.getStorageSync('store_id')
      if(store_id === '' || true){
        wx.setStorageSync('store_id', '16964')//yiyi_16962,7777_16964，联客荟生活家_16961
      }
      wxApi.wxRequest({
        url: '/index.php?act=MiniLogin&op=getStoreData',
        method: 'GET'
      }).then(function (res) {
        wx.setStorageSync('storeData', res.data)
        resolve(res)
      })
    })
  },
  //错误信息提示,断点
  toastError: function (title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 2000
    })
    return false
  }
}
module.exports = wxApi
