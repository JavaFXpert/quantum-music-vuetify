// The rotation angles to observe
var rotationangles  = [
  { label: 'CD', value: 0 },
  { label: 'CE', value: 0 },
  { label: 'CF', value: 0 },
  { label: 'CG', value: 0 },
  { label: 'CA', value: 0 },
  { label: 'CB', value: 0 },
  { label: 'CX', value: 0 },
  { label: 'DE', value: 0 },
  { label: 'DF', value: 0 },
  { label: 'DG', value: 0 },
  { label: 'DA', value: 0 },
  { label: 'DB', value: 0 },
  { label: 'DX', value: 0 },
  { label: 'EF', value: 0 },
  { label: 'EG', value: 0 },
  { label: 'EA', value: 0 },
  { label: 'EB', value: 0 },
  { label: 'EX', value: 0 },
  { label: 'FG', value: 0 },
  { label: 'FA', value: 0 },
  { label: 'FB', value: 0 },
  { label: 'FX', value: 0 },
  { label: 'GA', value: 0 },
  { label: 'GB', value: 0 },
  { label: 'GX', value: 0 },
  { label: 'AB', value: 0 },
  { label: 'AX', value: 0 },
  { label: 'BX', value: 0 }
]

// Determines whether to show the unistochastic (squared) matrix
var showuni = true;

// Object wrapper for reactive variables.
// TODO: Ascertain how to not have to use a wrapper to make reactive variables stay in sync with
//       the Vue data.
var rv = {
  // Spepcified resolution of rotation angle degrees at a time to move when optimizing unistochastic matrix
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
  totalcostbetweenmatrices: 0.0,

};

// C4  D4  E4  F4  G4  A4  B4  C5
var desiredHarmonyMatrix = math.matrix(
    [[.00, .00, .25, .25, .25, .25, .00, .00], //C4
      [.00, .00, .00, .25, .25, .25, .25, .00], //D4
      [.20, .00, .00, .00, .20, .20, .20, .20], //E4
      [.20, .20, .00, .00, .00, .20, .00, .20], //F4
      [.20, .20, .20, .00, .00, .00, .20, .20], //G4
      [.20, .20, .20, .20, .00, .00, .00, .20], //A4
      [.00, .33, .33, .00, .33, .00, .00, .00], //B4
      [.00, .00, .25, .25, .25, .25, .00, .00]]); //C5

// C4  D4  E4  F4  G4  A4  B4  C5
var desiredMelodyMatrix = math.matrix(
    [[.00, .30, .25, .20, .15, .10, .00, .00], //C4
      [.00, .00, .30, .25, .20, .15, .10, .00], //D4
      [.10, .25, .00, .20, .15, .13, .10, .07], //E4
      [.05, .20, .25, .00, .20, .20, .00, .10], //F4
      [.05, .10, .15, .25, .00, .20, .15, .10], //G4
      [.07, .08, .10, .15, .25, .00, .20, .15], //A4
      [.00, .25, .20, .00, .25, .30, .00, .00], //B4
      [.00, .00, .25, .10, .05, .25, .35, .00]]); //C5

// C4  D4  E4  F4  G4  A4  B4  C5
var desiredPermutationMatrix = math.matrix(
    [[.00, 1.0, .00, .00, .00, .00, .00, .00], //C4
      [.00, .00, 1.0, .00, .00, .00, .00, .00], //D4
      [.00, .00, .00, 1.0, .00, .00, .00, .00], //E4
      [.00, .00, .00, .00, 1.0, .00, .00, .00], //F4
      [.00, .00, .00, .00, .00, 1.0, .00, .00], //G4
      [.00, .00, .00, .00, .00, .00, 1.0, .00], //A4
      [.00, .00, .00, .00, .00, .00, .00, 1.0], //B4
      [1.0, .00, .00, .00, .00, .00, .00, .00]]); //C5

var matrixToOptimize = desiredPermutationMatrix;

// constant for number of degrees of freedom in 8 dimensional rotations
var rotationDegOfFreedom = 28;

// register the grid component
Vue.component('demo-grid', {
  template: '#matrix-template',
  replace: true,
  props: {
    numrowscols: Number,
    colnames: Array,
    //TODO: study how to be able to camel case rownames, etc. in Vue
    rownames: Array,
  },
  computed: {
    matrixAsArray: function () {
      //return computeStochasticMatrix().valueOf();
      return computeStochasticMatrix(createAnglesArrayFromRotationAngles(), showuni).valueOf();
    },
  },
  methods: {
  }
})

// function to create array from the rotationangles array
function createAnglesArrayFromRotationAngles() {
  var anglesArray = Array(rotationDegOfFreedom).fill(0);
  for (var i = 0; i < rotationDegOfFreedom; i++) {
    anglesArray[i] = degreesToRadians(rotationangles[i].value);
  }

  //console.log("anglesArray: " + anglesArray)
  return anglesArray;
}


/**
 * Function to compute rotation matrix
 * @param arrayOfAngles Array of rotation angles in radians
 * @param unistochastic Flag that indicates whether to return a unistochastic matrix,
 *                      or the underlying unitary matrix
 * @returns {Unit|*}
 */
function computeStochasticMatrix(arrayOfAngles, unistochastic) {
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
  euclidean(rotatedMatrixSquared, matrixToOptimize);

  var retVal = rotatedMatrix;
  if (unistochastic) {
    retVal = rotatedMatrixSquared;
  }

  return retVal;
}

// function to convert degrees to radians
function degreesToRadians(angleInDegrees) {
  var radians = angleInDegrees * (math.pi / 180);
  return radians;
}

// function to convert radians to degrees
function radiansToDegrees(angleInRadians) {
  var degrees = angleInRadians / (math.pi / 180);
  return degrees;
}

// Optimization code -----------------
function euclidean(computedMatrix, desiredMatrix) {
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
}

function loss(arrayOfAngles) {
  var rotMatrix = computeStochasticMatrix(arrayOfAngles, true);

  // Get Euclidean distance between computed and desired matrices
  var euclidDist = euclidean(rotMatrix, matrixToOptimize);
  //console.log("euclidDist: " + euclidDist);
  return euclidDist;
}

/**
 * Optimize the angles to minimize the difference between unistochastic matrix and one desired.
 * Uses the rotation angles (e.g. set by sliders) as a starting point
 * @param lossFunction
 * @returns Array of rotation angles in radians, optimized for the best fit
 */
function optimizeRotationAngles(lossFunction) {
  var arrayOfAnglesRad = Array(rotationDegOfFreedom).fill(0);
  var minDistance = Number.POSITIVE_INFINITY;

  //For each degree of freedom this will be either 1 or -1, signifying direction of movement
  var unitDirectionArray = Array(rotationDegOfFreedom).fill(1);

  var moveRadians = degreesToRadians(math.pow(10, -rv.degreedecimals));
  var midpointAngleRad = degreesToRadians(180);

  for (var i = 0; i < rotationDegOfFreedom; i++) {
    arrayOfAnglesRad[i] = degreesToRadians(rotationangles[i].value);
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
      if (proposedCurAngRad >= 0.0 && proposedCurAngRad < degreesToRadians(360)) {
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
          if (proposedCurAngRad >= 0.0 && proposedCurAngRad < degreesToRadians(360)) {
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
        //rotationangles[dofIdx].value = radiansToDegrees(curAngRad);
      }
      //console.log("  minDistance: " + minDistance);
      //console.log("  euclideanDistance: " + lossFunction(arrayOfAnglesRad));
      //console.log("  arrayOfAnglesRad: " + arrayOfAnglesRad);
    }
  }

  //TODO: Remember to transpose the unitary matrix before using it as a QC gate
  finalRotMatrix = math.transpose(computeStochasticMatrix(arrayOfAnglesRad, false));
  finalRotMatrix = math.round(finalRotMatrix, 10);
  console.log(math.print("TRANSPOSED $foo", {foo: math.format(finalRotMatrix,
        {notation: 'fixed', precision: 15})}));
  //console.log("minDistance: " + minDistance);
  //console.log("  euclideanDistance: " + lossFunction(arrayOfAnglesRad));
  //console.log("  arrayOfAnglesRad: " + arrayOfAnglesRad);
  return arrayOfAnglesRad;
}

// end of optimization code -----------

// bootstrap the demo
/*
var demo = new Vue({
  el: '#demo',
  data: {
    gridNumRowsCols: 8,
    gridRowNames: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'X'],
    gridColNames: ["C'", "D'", "E'", "F'", "G'", "A'", "B'", "X'"],
    rotationangles : rotationangles,
    showuni: showuni,
    rv: rv
  },
  methods: {
    toggleuni: function () {
      showuni = !showuni;

      //TODO: Find a way for the showuni variable to cause
      // the computeStochasticMatrix() method to be run, instead of
      // resorting to the following hack
      rotationangles [0].value = 359 - rotationangles [0].value;
      rotationangles [0].value = 359 - rotationangles [0].value;
    },
    optimizerotationangles: function() {
      var angles180DegreeArray = Array(rotationDegOfFreedom).fill(180);
      for (var i = 0; i < rotationDegOfFreedom; i++) {
        rotationangles[i].value = angles180DegreeArray[i];
      }

      var solutionInRad = optimizeRotationAngles(loss);
      var solutionInDeg = Array(rotationDegOfFreedom).fill(0);
      for (var i = 0; i < rotationDegOfFreedom; i++) {
        solutionInDeg[i] = radiansToDegrees(solutionInRad[i]);
        solutionInDeg = math.round(solutionInDeg,  rv.degreedecimals);
        rotationangles[i].value = solutionInDeg[i];
      }
      console.log("solution is: " + solutionInDeg);
    },
  }
})
*/
