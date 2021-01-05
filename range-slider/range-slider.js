Component({

  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },

  properties: {
    //组件宽度
    width: {
      type: Number,
      value: 750
    },
    //组件高度
    height: {
      type: Number,
      value: 60
    },
    //滑块大小
    blockSize: {
      type: Number,
      value: 54
    },
    //区间进度条高度
    barHeight: {
      type: Number,
      value: 7.5
    },
    //背景条颜色
    backgroundColor: {
      type: String,
      value: 'rgb(206, 206, 206)'
    },
    //已选择的颜色
    activeColor: {
      type: String,
      value: '#C29B40'
    },
    //最小值
    min: {
      type: Number,
      value: 0
    },
    //最大值
    max: {
      type: Number,
      value: 100
    },
    //设置初始值
    values: {
      type: Array,
      value: [0, 100]
    },
    //步长值
    step: {
      type: Number,
      value: 1
    },
    //live模式，是否动态更新
    liveMode: {
      type: Boolean,
      value: true
    }
  },

  data: {
    isMinActive: false,
    isMaxActive: false,

    MAX_LENGTH: 700,
    maxBlockLeft: 350,

    minBlockLeft: 0,
    progressBarLeft: 0,
    progressBarWidth: 350,

    originalMinValue: 0,
    originalMaxValue: 0,

    _blockDownX: 0,
    _blockLeft: 0,
    _curBlock: 'minBlock'
  },
  observers: {
    //组件宽度
    width: function (newVal) {
      this._refresh();
    },
    //滑块大小
    blockSize: function (newVal) {
      this._refresh();
    },
    //最小值
    min: function (newVal) {
      this._refresh();
    },
    //最大值
    max: function (newVal) {
      this._refresh();
    },
    //设置初始值
    values: function () {
      this._refresh();
    }
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
    attached() {
      this._refresh.bind(this)();
    }
  },
  methods: {
    //补0
    _pad: function (num, n) {
      return Array(n - ('' + num).length + 1).join(0) + num;
    },
    _pxToRpx(px) {
      const {
        windowWidth
      } = wx.getSystemInfoSync();
      return (750 * px) / windowWidth;
    },
    _onBlockTouchStart(e) {
      let {
        tag,
        left
      } = e.target.dataset;
      if (tag == 'minBlock' || tag == 'maxBlock') {
        this.setData({
          isMinActive: tag == 'minBlock',
          isMaxActive: tag == 'maxBlock',
          _blockDownX: e.changedTouches[0].pageX,
          _blockLeft: left,
          _curBlock: tag
        });
      }
    },
    _onBlockTouchMove(e) {
      const {
        tag
      } = e.target.dataset;
      if (tag == 'minBlock' || tag == 'maxBlock') {
        const [minValue, maxValue, minLeft, maxLeft] = this._calculateValues(e);
        this._refreshProgressBar(minLeft, maxLeft);
        this._refreshBlock(minLeft, maxLeft);
        //拖动时也触发事件
        const eventDetail = {
          minValue: this.formatNumber(minValue, this.data.step),
          maxValue: this.formatNumber(maxValue, this.data.step),
          fromUser: true,
          originalValue: {
            minValue,
            maxValue
          }
        };
        this.setData({
          originalMinValue: minValue,
          originalMaxValue: maxValue
        })
        if (this.data.liveMode) {
          this.triggerEvent('change', eventDetail, {})
        };
      }
    },
    _onBlockTouchEnd(e) {
      const {
        tag
      } = e.target.dataset;
      if (tag == 'minBlock' || tag == 'maxBlock') {
        const [minValue, maxValue, minLeft, maxLeft] = this._calculateValues(e);
        this._refreshProgressBar(minLeft, maxLeft);
        this._refreshBlock(minLeft, maxLeft);
        const eventDetail = {
          minValue: this.formatNumber(minValue, this.data.step),
          maxValue: this.formatNumber(maxValue, this.data.step),
          fromUser: true,
          originalValue: {
            minValue,
            maxValue
          }
        };
        this.setData({
          isMinActive: false,
          isMaxActive: false,
          originalMinValue: minValue,
          originalMaxValue: maxValue
        });
        this.triggerEvent('change', eventDetail, {})

      }
    },
    _isValuesValid: function (values) {
      return values != null && values != undefined && values.length == 2;
    },
    /**
     * 根据手势计算相关数据
     */
    _calculateValues(e) {
      const {
        _blockDownX,
        _blockLeft,
        _curBlock,
        minBlockLeft,
        maxBlockLeft,
        max,
        min,
        MAX_LENGTH
      } = this.data;
      const pageX = e.changedTouches[0].pageX;
      const moveLength = pageX - _blockDownX;
      let left = _blockLeft + this._pxToRpx(moveLength);
      left = Math.max(0, left);
      left = Math.min(left, MAX_LENGTH);
      let minBlockLeftX = minBlockLeft;
      let maxBlockLeftX = maxBlockLeft;
      if (_curBlock == 'minBlock') {
        minBlockLeftX = left;
      } else {
        maxBlockLeftX = left;
      }
      const range = max - min;
      const minLeft = Math.min(minBlockLeftX, maxBlockLeftX);
      const maxLeft = Math.max(minBlockLeftX, maxBlockLeftX);
      const minValue = (minLeft / MAX_LENGTH) * range + min;
      const maxValue = (maxLeft / MAX_LENGTH) * range + min;
      return [minValue, maxValue, minLeft, maxLeft];
    },
    /**
     * 计算滑块坐标
     */
    _calculateBlockLeft(minValue, maxValue) {
      const {
        max,
        min,
        MAX_LENGTH
      } = this.data;
      const range = max - min;
      const minLeft = ((minValue - min) / range) * MAX_LENGTH;
      const maxLeft = ((maxValue - min) / range) * MAX_LENGTH;
      return [minLeft, maxLeft];
    },
    /**
     * 刷新进度条视图
     */
    _refreshProgressBar(minBlockLeft, maxBlockLeft) {
      const blockSize = this.data.blockSize;
      this.setData({
        progressBarLeft: minBlockLeft + blockSize / 2,
        progressBarWidth: Math.abs(maxBlockLeft - minBlockLeft),
      })
    },
    /**
     * 刷新滑块视图
     */
    _refreshBlock(minBlockLeft, maxBlockLeft) {
      this.setData({
        minBlockLeft,
        maxBlockLeft
      })
    },
    /**
     * 刷新整个视图
     */
    _refresh() {
      const {
        width,
        blockSize,
        min,
        max,
      } = this.data;
      const MAX_LENGTH = width - blockSize;
      this.setData({
        MAX_LENGTH,
        maxBlockLeft: MAX_LENGTH,
        progressBarWidth: MAX_LENGTH
      })
      let values = this.data.values;
      if (this._isValuesValid(values)) {
        values[0] = Math.max(min, values[0]);
        values[0] = Math.min(values[0], max);
        values[1] = Math.max(min, values[1]);
        values[1] = Math.min(values[1], max);
        const [minLeft, maxLeft] = this._calculateBlockLeft(values[0], values[1]);
        this._refreshProgressBar(minLeft, maxLeft);
        this._refreshBlock(minLeft, maxLeft);
      }
    },
    formatNumber(num, step) {
      //格式化数字，保留几位小数
      let stepStr = '' + step;
      let index = stepStr.indexOf('.');
      let len = index > -1 ? stepStr.length - index - 1 : 0;
      let offestNum = parseInt(1 + Array(('' + len).length + 1).join(0)) * 0.1;
      let tmpNum = num * offestNum;
      return ((parseInt(tmpNum / step + (step > 1 ? 1 : step) * 0.5) * step) / offestNum).toFixed(len);
    }
  }
})