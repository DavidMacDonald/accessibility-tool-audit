var fs = require('fs'),
    path = require('path'),
    _ = require('lodash');


var paths = {
  testsJson: path.join(__dirname, '../tests.json'),
  analysisJson: path.join(__dirname, '../analysis.json')
};

var testsFile = fs.readFileSync(paths.testsJson).toString();
var tests = JSON.parse(testsFile);
// linear list of all tests
var testList = _.flatten(_.map(_.values(tests), x => _.keys(x)));

var resultTypes = [
  'notfound',
  'error',
  'warning',
  'manual',
  'different',
  'identified',
  'wrong',
  'false-positive'
];

var toolNames = [
  'google',
  'tenon',
  'wave',
  'codesniffer',
  'axe',
  'asqatasun',
  'sortsite',
  'eiii',
  'achecker',
  'nu'
];

var analysis = {};

function analyse(){
  var tool = {};
  var test = {};
  var detectable = [];
  var percent = {};

  // Priming the tools array
  tool = _.reduce(toolNames, function (a, b){
    a[b] = _.reduce(resultTypes, (c, d) => { c[d] = 0; return c; }, {});
    return a;
  }, {});

  for( catname in tests ){
    for( testname in tests[catname] ){
      var resObj = tests[catname][testname]["results"];

      for( toolName in resObj ){
        tool[toolName][resObj[toolName]]++;
      }

      // Test is detectable by at least one tool
      var canDetect = _.without(
        _.values(resObj),
        'notfound',
        'different',
        'false-positive',
        'identified',
        'wrong'
      );

      if( canDetect.length > 0 ){
        detectable.push(testname);
      }
    }
  }

  analysis.counts = tool;

  analysis.totals = {
    total: testList.length,
    detectable: detectable.length,
    undetectable: testList.length - detectable.length
  }

  analysis.percentages = {
    detectable: _.round(analysis.totals.detectable / analysis.totals.total * 100),
    tools: {

    }
  }

  for( tool in analysis.counts ){
    var t = analysis.counts[tool];

    analysis.percentages.tools[tool] = {
      detectable: {
        "error_warning": _.round((t.error + t.warning) / analysis.totals.detectable * 100),
        "error_warning_manual": _.round((t.error + t.warning + t.manual) / analysis.totals.detectable * 100)
      },
      total: {
        "error_warning": _.round((t.error + t.warning) / analysis.totals.total * 100),
        "error_warning_manual": _.round((t.error + t.warning + t.manual) / analysis.totals.total * 100)
      }
    }
  }

  fs.writeFileSync(paths.analysisJson, JSON.stringify(analysis,'',2), 'utf8');
}

module.exports = {
  analyse: analyse,
  resultTypes: resultTypes,
  toolNames: toolNames
}