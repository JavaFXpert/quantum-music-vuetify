//TODO: Allow complex numbers in unitary matrix

// constant for number of degrees of freedom in 8 dimensional rotations
var rotationDegOfFreedom = 28;

// Object wrapper for reactive variables.
// TODO: Ascertain how to not have to use a wrapper to make reactive variables stay in sync with
//       the Vue data.
var rv = {
// The rotation angles to observe
  rotationangles: [
    { label: "CD", value: 0 },
    { label: "CE", value: 0 },
    { label: "CF", value: 0 },
    { label: "CG", value: 0 },
    { label: "CA", value: 0 },
    { label: "CB", value: 0 },
    { label: "CC'", value: 0 },
    { label: "DE", value: 0 },
    { label: "DF", value: 0 },
    { label: "DG", value: 0 },
    { label: "DA", value: 0 },
    { label: "DB", value: 0 },
    { label: "DC'", value: 0 },
    { label: "EF", value: 0 },
    { label: "EG", value: 0 },
    { label: "EA", value: 0 },
    { label: "EB", value: 0 },
    { label: "EC'", value: 0 },
    { label: "FG", value: 0 },
    { label: "FA", value: 0 },
    { label: "FB", value: 0 },
    { label: "FC'", value: 0 },
    { label: "GA", value: 0 },
    { label: "GB", value: 0 },
    { label: "GC'", value: 0 },
    { label: "AB", value: 0 },
    { label: "AC'", value: 0 },
    { label: "BC'", value: 0 }
  ],

  // Specified resolution of rotation angle degrees at a time to move when optimizing unistochastic matrix
  degreedecimals: 0,

  // Specified number of iterations over the rotational angles when optimizing unistochastic matrix
  numepochs: 20,

  // Specified penalty factor for any element whose desired value is zero, when optimizing unistochastic matrix
  zeroelementpenaltyfactor: 0.0,

  // Calculated Euclidean distance between desired stochastic matrix and calculated unistochastic matrix
  euclideandistance: Number.POSITIVE_INFINITY,

  // Calculated penalty for any element in desired matrix whose desired value is zero as compared to the
  // corresponding element in the unistochastic matrix
  addedpenalty: 0.0,

  // Calculated total cost between desired matrix and unistochastic matrix
  totalcostbetweenmatrices: 0.0
};

// register the unistochastic-matrix component
Vue.component('unistochastic-matrix', {
  props: {
    numrowscols: Number,
    colnames: Array,
    //TODO: study how to be able to camel case rownames, etc. in Vue
    rownames: Array,
    wantedmatrix: Object
  },
  data: function() {
    return {
      rotationangles: rv.rotationangles,
      showuni: true,
      rv: rv
    }
  },
  replace: true, //TODO: Learn what replace means
  template:
    '<div>' +
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
              '{{parseFloat(Math.round(matrixAsArray[rowIdx][colIdx] * 100) / 100).toFixed(2)}}' +
            '</td>' +
          '</tr>' +
        '</tbody>' +
      '</table>' +
      '<br/>' +
      '<div class="ml-2">' +
        '<button @click="optimizerotationangles" class="mr-4">Optimize</button>' +
        '<input type="checkbox" id="unistochastic" @click="toggleuni" checked="showuni"/>' +
        '<label for="unistochastic" class="mr-4">Unistochastic</label>' +
        '<label>Zeros penalty factor:</label>' +
        '<input type="range" v-model="rv.zeroelementpenaltyfactor" min="0.0" max="1.0" step="0.1"/>' +
        '<span>{{rv.zeroelementpenaltyfactor}}</span><br/>' +
        '<label>Degree decimals:</label>' +
        '<input type="range" v-model="rv.degreedecimals" min="0" max="2" step="1" id="degree-decimals"/>' +
        '<span class="mr-4">{{rv.degreedecimals}}</span>' +
        '<label>Epochs:</label>' +
        '<input type="range" v-model="rv.numepochs" min="1" max="50" step="1">' +
        '<span>{{rv.numepochs}}</span><br/>' +
        '<span>{{ "Total cost: " + Math.round(rv.totalcostbetweenmatrices * 100) / 100 }}' +
          '{{" = Euclidean distance: " + Math.round(rv.euclideandistance * 100) / 100}}' +
          '{{" + Zeros distance penalty: " + Math.round(rv.addedpenalty * 100) / 100 }}' +
        '</span>' +
      '</div>' +
      '<br/>' +
      '<table>' +
        '<tbody>' +
          '<tr v-for="(srow, srowIdx) in 7">' +
            '<td v-for="(scol, scolIdx) in 4">' +
              '<label>{{rv.rotationangles [(srowIdx) * 4 + (scolIdx)].label}}</label>' +
              '<input type="range" v-model="rv.rotationangles [(srowIdx) * 4 + (scolIdx)].value" min="0" max="359" :step="Math.pow(10, -rv.degreedecimals)" class="rot-slider">' +
            '</td>' +
          '</tr>' +
        '</tbody>' +
      '</table>' +
    '</div>',
  computed: {
    matrixAsArray: function () {
      //return math.eye(8).valueOf();
      return this.computeStochasticMatrix(this.createAnglesArrayFromRotationAngles(), this.showuni).valueOf();
    }
  },
  methods: {
    toggleuni: function () {
      this.showuni = !(this.showuni);

      //TODO: Find a way for the showuni variable to cause
      // the computeStochasticMatrix() method to be run, instead of
      // resorting to the following hack
      rv.rotationangles [0].value = 359 - rv.rotationangles [0].value;
      rv.rotationangles [0].value = 359 - rv.rotationangles [0].value;
    },

    optimizerotationangles: function() {
      var angles180DegreeArray = Array(rotationDegOfFreedom).fill(180);
      for (var i = 0; i < rotationDegOfFreedom; i++) {
        rv.rotationangles[i].value = angles180DegreeArray[i];
      }

      var solutionInRad = this.optimizeRotationAngles(this.loss);
      var solutionInDeg = Array(rotationDegOfFreedom).fill(0);
      for (var i = 0; i < rotationDegOfFreedom; i++) {
        solutionInDeg[i] = this.radiansToDegrees(solutionInRad[i]);
        solutionInDeg = math.round(solutionInDeg,  rv.degreedecimals);
        rv.rotationangles[i].value = solutionInDeg[i];
      }
      console.log("solution is: " + solutionInDeg);
    },

    // function to create array from the rotationangles array
    createAnglesArrayFromRotationAngles: function() {
      var anglesArray = Array(rotationDegOfFreedom).fill(0);
      for (var i = 0; i < rotationDegOfFreedom; i++) {
        anglesArray[i] = this.degreesToRadians(rv.rotationangles[i].value);
      }

      //console.log("anglesArray: " + anglesArray)
      return anglesArray;
    },

    /**
     * Function to compute rotation matrix
     * @param arrayOfAngles Array of rotation angles in radians
     * @param unistochastic Flag that indicates whether to return a unistochastic matrix,
     *                      or the underlying unitary matrix
     * @returns {Unit|*}
     */
    computeStochasticMatrix: function(arrayOfAngles, unistochastic) {
      matrixDims = 8;
      var a = math.zeros(rotationDegOfFreedom);
      for (var i = 0; i < rotationDegOfFreedom; i++) {
        a[i] = arrayOfAngles[i];
      }
      var matrix = math.eye(matrixDims);
      var rotatedMatrix =
          math.multiply(math.transpose(math.matrix([[math.cos(a[0]), -math.sin(a[0]), 0, 0, 0, 0, 0, 0], [math.sin(a[0]), math.cos(a[0]), 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
              math.multiply(math.transpose(math.matrix([[math.cos(a[1]), 0, -math.sin(a[1]), 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [math.sin(a[1]), 0, math.cos(a[1]), 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                  math.multiply(math.transpose(math.matrix([[math.cos(a[2]), 0, 0, -math.sin(a[2]), 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [math.sin(a[2]), 0, 0, math.cos(a[2]), 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                      math.multiply(math.transpose(math.matrix([[math.cos(a[3]), 0, 0, 0, -math.sin(a[3]), 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [math.sin(a[3]), 0, 0, 0, math.cos(a[3]), 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                          math.multiply(math.transpose(math.matrix([[math.cos(a[4]), 0, 0, 0, 0, -math.sin(a[4]), 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [math.sin(a[4]), 0, 0, 0, 0, math.cos(a[4]), 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                              math.multiply(math.transpose(math.matrix([[math.cos(a[5]), 0, 0, 0, 0, 0, -math.sin(a[5]), 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [math.sin(a[5]), 0, 0, 0, 0, 0, math.cos(a[5]), 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                  math.multiply(math.transpose(math.matrix([[math.cos(a[6]), 0, 0, 0, 0, 0, 0, -math.sin(a[6])], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [math.sin(a[6]), 0, 0, 0, 0, 0, 0, math.cos(a[6])]])),
                                     math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, math.cos(a[7]), -math.sin(a[7]), 0, 0, 0, 0, 0], [0, math.sin(a[7]), math.cos(a[7]), 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                          math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, math.cos(a[8]), 0, -math.sin(a[8]), 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, math.sin(a[8]), 0, math.cos(a[8]), 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                              math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, math.cos(a[9]), 0, 0, -math.sin(a[9]), 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, math.sin(a[9]), 0, 0, math.cos(a[9]), 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                                  math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, math.cos(a[10]), 0, 0, 0, -math.sin(a[10]), 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, math.sin(a[10]), 0, 0, 0, math.cos(a[10]), 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                                      math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, math.cos(a[11]), 0, 0, 0, 0, -math.sin(a[11]), 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, math.sin(a[11]), 0, 0, 0, 0, math.cos(a[11]), 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                                          math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, math.cos(a[12]), 0, 0, 0, 0, 0, -math.sin(a[12])], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, math.sin(a[12]), 0, 0, 0, 0, 0, math.cos(a[12])]])),
                                                              math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, math.cos(a[13]), -math.sin(a[13]), 0, 0, 0, 0], [0, 0, math.sin(a[13]), math.cos(a[13]), 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                                                  math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, math.cos(a[14]), 0, -math.sin(a[14]), 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, math.sin(a[14]), 0, math.cos(a[14]), 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                                                      math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, math.cos(a[15]), 0, 0, -math.sin(a[15]), 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, math.sin(a[15]), 0, 0, math.cos(a[15]), 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                                                          math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, math.cos(a[16]), 0, 0, 0, -math.sin(a[16]), 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, math.sin(a[16]), 0, 0, 0, math.cos(a[16]), 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                                                              math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, math.cos(a[17]), 0, 0, 0, 0, -math.sin(a[17])], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, math.sin(a[17]), 0, 0, 0, 0, math.cos(a[17])]])),
                                                                                  math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, math.cos(a[18]), -math.sin(a[18]), 0, 0, 0], [0, 0, 0, math.sin(a[18]), math.cos(a[18]), 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                                                                      math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, math.cos(a[19]), 0, -math.sin(a[19]), 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, math.sin(a[19]), 0, math.cos(a[19]), 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                                                                          math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, math.cos(a[20]), 0, 0, -math.sin(a[20]), 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, math.sin(a[20]), 0, 0, math.cos(a[20]), 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                                                                              math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, math.cos(a[21]), 0, 0, 0, -math.sin(a[21])], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, math.sin(a[21]), 0, 0, 0, math.cos(a[21])]])),
                                                                                                  math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, math.cos(a[22]), -math.sin(a[22]), 0, 0], [0, 0, 0, 0, math.sin(a[22]), math.cos(a[22]), 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                                                                                      math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, math.cos(a[23]), 0, -math.sin(a[23]), 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, math.sin(a[23]), 0, math.cos(a[23]), 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                                                                                          math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, math.cos(a[24]), 0, 0, -math.sin(a[24])], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, math.sin(a[24]), 0, 0, math.cos(a[24])]])),
                                                                                                              math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, math.cos(a[25]), -math.sin(a[25]), 0], [0, 0, 0, 0, 0, math.sin(a[25]), math.cos(a[25]), 0], [0, 0, 0, 0, 0, 0, 0, 1]])),
                                                                                                                  math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, math.cos(a[26]), 0, -math.sin(a[26])], [0, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, math.sin(a[26]), 0, math.cos(a[26])]])),
                                                                                                                      math.multiply(math.transpose(math.matrix([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, math.cos(a[27]), -math.sin(a[27])], [0, 0, 0, 0, 0, 0, math.sin(a[27]), math.cos(a[27])]])),
                                                                                                                          matrix))))))))))))))))))))))))))));

      var rotatedMatrixSquared = math.square(rotatedMatrix);

      // Calculate how closely this matrix fits the desired stochastic matrix
      try {
        this.euclidean(rotatedMatrixSquared, this.wantedmatrix);
      }
      catch (err) {
        console.log("err: " + err);
      }

      var retVal = rotatedMatrix;
      if (unistochastic) {
        retVal = rotatedMatrixSquared;
      }

      return retVal;
    },

    // function to convert degrees to radians
    degreesToRadians: function(angleInDegrees) {
      var radians = angleInDegrees * (math.pi / 180);
      return radians;
    },

    // function to convert radians to degrees
    radiansToDegrees: function(angleInRadians) {
      var degrees = angleInRadians / (math.pi / 180);
      return degrees;
    },

    // Optimization code -----------------
    euclidean: function(computedMatrix, desiredMatrix) {
      var differenceMatrix =
          math.subtract(computedMatrix, desiredMatrix);
      var differenceArraySquared = math.flatten(math.square(differenceMatrix)).valueOf();

      var sumOfSquares = 0;
      for (var i = 0; i < differenceArraySquared.length; i++) {
        sumOfSquares += differenceArraySquared[i];
      }

      //----- Penalize extra for any element whose desired value is zero ------
      //TODO: Make these operations faster if the concept works
      this.rv.euclideandistance = math.sqrt(sumOfSquares);
      //console.log("this.rv.euclideandistance: " + this.rv.euclideandistance);

      this.rv.addedpenalty = 0.0;
      var desiredMatrixArray = math.flatten(desiredMatrix).valueOf(); //TODO: Move or optimize
      var computedMatrixArray = math.flatten(computedMatrix).valueOf(); //TODO: optimize
      for (var i = 0; i < desiredMatrixArray.length; i++) {
        if (desiredMatrixArray[i] < 0.01) {
          this.rv.addedpenalty += computedMatrixArray[i] * this.rv.zeroelementpenaltyfactor;
        }
      }
      //console.log("this.rv.addedpenalty: " + this.rv.addedpenalty);

      this.rv.totalcostbetweenmatrices = this.rv.euclideandistance + this.rv.addedpenalty;
      //----- End Penalize extra for any element whose desired value is zero -----

      //console.log("euclideandistance: " + this.rv.euclideandistance);
      return this.rv.totalcostbetweenmatrices;
    },

    loss: function(arrayOfAngles) {
      var rotMatrix = this.computeStochasticMatrix(arrayOfAngles, true);

      // Get Euclidean distance between computed and desired matrices
      //var euclidDist = euclidean(rotMatrix, matrixToOptimize);
      var euclidDist = this.euclidean(rotMatrix, this.wantedmatrix);
      //console.log("euclidDist: " + euclidDist);
      return euclidDist;
    },

    /**
     * Optimize the angles to minimize the difference between unistochastic matrix and one desired.
     * Uses the rotation angles (e.g. set by sliders) as a starting point
     * @param lossFunction
     * @returns Array of rotation angles in radians, optimized for the best fit
     */
    optimizeRotationAngles: function(lossFunction) {
      var arrayOfAnglesRad = Array(rotationDegOfFreedom).fill(0);
      var minDistance = Number.POSITIVE_INFINITY;

      //For each degree of freedom this will be either 1 or -1, signifying direction of movement
      var unitDirectionArray = Array(rotationDegOfFreedom).fill(1);

      var moveRadians = this.degreesToRadians(math.pow(10, -rv.degreedecimals));
      var midpointAngleRad = this.degreesToRadians(180);

      for (var i = 0; i < rotationDegOfFreedom; i++) {
        arrayOfAnglesRad[i] = this.degreesToRadians(rv.rotationangles[i].value);
      }
      minDistance = lossFunction(arrayOfAnglesRad);

      for (var epochIdx = 0; epochIdx < rv.numepochs; epochIdx++) {
        //console.log("epochIdx: " + epochIdx);
        for (var dofIdx = 0; dofIdx < rotationDegOfFreedom; dofIdx++) {
          //console.log("dofIdx: " + dofIdx);
          var curAngRad = arrayOfAnglesRad[dofIdx];
          var proposedCurAngRad = curAngRad;
          //console.log("  curAngRad: " + curAngRad);
          // Decide whether to move right or left
          unitDirectionArray[dofIdx] = 1;
          if (curAngRad > midpointAngleRad) {
            unitDirectionArray[dofIdx] = -1;
          }
          proposedCurAngRad += moveRadians * unitDirectionArray[dofIdx];
          if (proposedCurAngRad >= 0.0 && proposedCurAngRad < this.degreesToRadians(360)) {
            arrayOfAnglesRad[dofIdx] = proposedCurAngRad;

            var tempDistance = lossFunction(arrayOfAnglesRad);
            if (tempDistance > minDistance) {
              // Moving in the wrong direction so restore the angle in the array and switch direction
              arrayOfAnglesRad[dofIdx] = curAngRad;
              unitDirectionArray[dofIdx] *= -1;
            }
            else {
              // Moving in the right direction so use the proposed angle
              curAngRad = proposedCurAngRad;
              minDistance = tempDistance;
            }
            var finishedWithWhileLoop = false;
            var loopIterations = 0;
            while (!finishedWithWhileLoop) {
              loopIterations++;
              proposedCurAngRad += moveRadians * unitDirectionArray[dofIdx];
              if (proposedCurAngRad >= 0.0 && proposedCurAngRad < this.degreesToRadians(360)) {
                arrayOfAnglesRad[dofIdx] = proposedCurAngRad;
                tempDistance = lossFunction(arrayOfAnglesRad);
                if (tempDistance > minDistance) {
                  // Distance is increasing so restore the angle in the array and leave the loop
                  arrayOfAnglesRad[dofIdx] = curAngRad;
                  finishedWithWhileLoop = true;
                }
                else if (loopIterations > 360 / math.pow(10, -rv.degreedecimals)) {
                  alert("Unexpected: Was in while loop over " + loopIterations + " iterations.");
                  finishedWithWhileLoop = true;
                }
                else {
                  // Distance is not increasing, so use the proposed angle
                  curAngRad = proposedCurAngRad;
                  minDistance = tempDistance;
                }
              }
              else {
                finishedWithWhileLoop = true;
              }
            }
            //rv.rotationangles[dofIdx].value = radiansToDegrees(curAngRad);
          }
          //console.log("  minDistance: " + minDistance);
          //console.log("  euclideanDistance: " + lossFunction(arrayOfAnglesRad));
          //console.log("  arrayOfAnglesRad: " + arrayOfAnglesRad);
        }
      }

      //TODO: Remember to transpose the unitary matrix before using it as a QC gate
      finalRotMatrix = math.transpose(this.computeStochasticMatrix(arrayOfAnglesRad, false));
      finalRotMatrix = math.round(finalRotMatrix, 10);
      //console.log(math.print("TRANSPOSED $foo", {foo: math.format(finalRotMatrix,
      //      {notation: 'fixed', precision: 15})}));
      //console.log("minDistance: " + minDistance);
      //console.log("  euclideanDistance: " + lossFunction(arrayOfAnglesRad));
      //console.log("  arrayOfAnglesRad: " + arrayOfAnglesRad);
      return arrayOfAnglesRad;
    }
  }
});
// end of optimization code -----------

