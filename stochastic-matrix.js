// register the stochastic-matrix component
Vue.component('stochastic-matrix', {
  props: {
    numrowscols: Number,
    colnames: Array,
    //TODO: study how to be able to camel case rownames, etc. in Vue
    rownames: Array,
    mathmatrix: Array
  },
  replace: true, //TODO: Learn what replace means
  template:
    '<table>' +
      '<thead>' +
        '<tr>' +
          '<th></th>' +
          '<th v-for="col in numrowscols">' +
            '{{colnames[col - 1]}}' +
          '</th>' +
          '<th>Tot</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' +
        '<tr v-for="(rowArray, rowIdx) in numrowscols">' +
          '<th>{{rownames[rowIdx]}}</th>' +
          '<td v-for="(colNum, colIdx) in numrowscols">' +
            '<input type="text" size="3" v-model="mathmatrix[rowIdx][colIdx]"/>' +
          '</td>' +
          '<td>' +
            //'{{parseFloat(Math.round(rowTotal(rowIdx) * 100) / 100).toFixed(2)}}' +
            '{{rowTotal(rowIdx) * 1.0}}' +
          '</td>' +
        '</tr>' +
      '</tbody>' +
    '</table>',
  methods: {
    rowTotal: function(rIdx) {
      var total = 0.0;
      for (var cIdx = 0; cIdx < this.numrowscols; cIdx++) {
        total += this.mathmatrix[rIdx][cIdx];
      }
      return total;
    }
  }
});

