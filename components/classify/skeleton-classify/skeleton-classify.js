Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
    addGlobalClass: true
  },
  data: {
    goodsList: []
  },
  ready () {
    var list = []
    for (var i = 0; i < 10; i++){
      list[i] = {}
    }
    this.setData({
      goodsList: list
    })
  }
})