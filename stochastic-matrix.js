Vue.component('stochastic-matrix', {
  props: {
    numrowscols: Number,
    colnames: Array,
    //TODO: study how to be able to camel case rownames, etc. in Vue
    rownames: Array,
    mathmatrix: Array
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
            '<input type="text" size="3" v-model="mathmatrix[rowIdx][colIdx]"/>' +
          '</td>' +
        '</tr>' +
      '</tbody>' +
    '</table>',
  methods: {
  }
});

