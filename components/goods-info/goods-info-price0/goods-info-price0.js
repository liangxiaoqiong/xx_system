// components/goods-info/goods-info-price-0/goods-info-price0.js
var util = require('../../../utils/util.js')
Component({
  options: {
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {
    info: Object,
    goodsState: Object
  },

  /**
   * 组件的初始数据
   */
  data: {
    countDown: {
      day: '00',
      hour: '00',
      minute: '00',
      second: '00',
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    //商品限时倒计时
    countTime: function () {
      var self = this
      var sdata = this.data
      var interval = setInterval(function () {
        self.setData({
          ['countDown.day']: util.timeTo_('day', +sdata.info.sheng_yu_time),
          ['countDown.hour']: util.timeTo_('hour', +sdata.info.sheng_yu_time),
          ['countDown.minute']: util.timeTo_('min', +sdata.info.sheng_yu_time),
          ['countDown.second']: util.timeTo_('sec', +sdata.info.sheng_yu_time),
        });
        +sdata.info.sheng_yu_time--;
        if (+sdata.info.sheng_yu_time < 0) {
          clearInterval(interval);
          self.setData({
            ['info.state']: 0
          })
          wx.showToast({
            title: '限时活动已结束',
          });
          this.setData({
            ['countDown.day']: '00',
            ['countDown.hour']: '00',
            ['countDown.minute']: '00',
            ['countDown.second']: '00',
          });
        }
      }.bind(this), 1000);
    },
  }
})
