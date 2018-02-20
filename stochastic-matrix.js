Vue.component('stochastic-matrix', {
  props: {
    numrowscols: Number,
    colnames: Array,
    //TODO: study how to be able to camel case rownames, etc. in Vue
    rownames: Array,
    mathmatrix: Object
  },
  template:
    '<table>' +
      '<thead>' +
        '<tr>' +
          '<th></th>' +
          '<th v-for="col in numrowscols">' +
            '{{colnames[col - 1]}}' +
          '</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' +
        '<tr v-for="(rowArray, rowIdx) in numrowscols">' +
          '<th>{{rownames[rowIdx]}}</th>' +
          '<td v-for="(colNum, colIdx) in numrowscols">' +
            //'{{parseFloat(Math.round(mathmatrix[rowIdx][colIdx] * 10000) / 10000).toFixed(4)}}' +
            '{{getRoundedMatrixElement(mathmatrix, rowIdx, colIdx)}}' +
          '</td>' +
        '</tr>' +
      '</tbody>' +
    '</table>',
  methods: {
    getRoundedMatrixElement: function(matrix, rowNum, colNum) {
      return parseFloat(Math.round(matrix.subset(math.index(rowNum, colNum)) * 10000) / 10000).toFixed(4);
    }
  }
});

