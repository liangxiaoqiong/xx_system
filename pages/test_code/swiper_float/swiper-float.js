// pages/test_code/swiper_float/swiper-float.js
Page({
  data: {
    backClass: ["red", "blue", "green","orange"],
    currentItemId:0
  },
  swiperChange:function(e){
    var currentItemId = e.detail.currentItemId;
    this.setData({
      currentItemId:currentItemId
    })
  },
  clickChange:function(e){
    var itemId = e.currentTarget.dataset.itemId;
    this.setData({
      currentItemId: itemId
    })
  }
})
