// Tests

// General function to assign two array values without referencing each other. For testing.
function valueAssigner(arrayobject1, arrayobject2, arraysize) {
   for (i = 0; i < arraysize; i ++) { 
        arrayobject1[i] = arrayobject2[i]; }
}



// Optimization code and data


// General Tool: Prepares any given array of 24-hour loads into a format usable by plot.addLineChart
function plotLineChart(loadarray)
{
    hourlyArray = [];
    for(i=0; i<24; i++){
        hourlyArray[i] = {};
        hourlyArray[i].x = i;
        hourlyArray[i].y = loadarray[i];
    }
    return hourlyArray;
}


// The load shifting optimization functions using a Brick and Wall Model
function optimize() 
{
    function optimize1() {

        // Stage 1 - Fill minimum of powerplants: fill in optimumUsage and residue arrays for each power plant upto minimum of each powerplant
        var powerPlantKeys = Object.keys(shifting.powerPlants);
        var powerPlantCount = powerPlantKeys.length;
        for(i=0; i < powerPlantCount ; i++ ) {
            for(k=0; k < 24 ; k++ ) {
                shifting.output.powerPlantsArray[i].optimumUsage[k] = shifting.output.powerPlantsArray[i].min[k];
                shifting.output.powerPlantsArray[i].residue[k] = shifting.output.powerPlantsArray[i].max[k] - shifting.output.powerPlantsArray[i].optimumUsage[k];
                }
        }
            // Sum of all ith hour usage from each power plant
        for(i=0; i < 24 ; i++ ) {
            shifting.day.usageStatus[i] = 0;
            for(j=0; j < powerPlantCount ; j++ ) {
                shifting.day.usageStatus[i] += shifting.output.powerPlantsArray[j].optimumUsage[i];
            }
        }
    }

    function optimize2() {
        // Stage 2: If not filled, fill upto the min hour requirements (minhr = load - downward flexibility profile)
        // if condition checks remaining available units for the power plants and remaining units to be filled, and fills based on that until min hour requirements are satisfied.
        var powerPlantKeys = Object.keys(shifting.powerPlants);
        var powerPlantCount = powerPlantKeys.length;
        for(i=0; i < 24 ; i++ ) {
            for(k=0; k < powerPlantCount ; k++ )
            {
                if((shifting.day.minhr[i] - shifting.day.usageStatus[i] > 0) && 
                   (shifting.day.minhr[i] - shifting.day.usageStatus[i] >= shifting.output.powerPlantsArray[k].residue[i]) ) {

                        shifting.output.powerPlantsArray[k].optimumUsage[i] = shifting.output.powerPlantsArray[k].optimumUsage[i] + shifting.output.powerPlantsArray[k].residue[i];
                        shifting.day.usageStatus[i] = shifting.day.usageStatus[i] +shifting.output.powerPlantsArray[k].residue[i];
                        shifting.output.powerPlantsArray[k].residue[i] = 0;
                    }

                if((shifting.day.minhr[i] - shifting.day.usageStatus[i]  > 0) && 
                  ((shifting.day.minhr[i] - shifting.day.usageStatus[i]) < shifting.output.powerPlantsArray[k].residue[i]) ) {
                        shifting.output.powerPlantsArray[k].optimumUsage[i] = shifting.output.powerPlantsArray[k].optimumUsage[i] + shifting.day.minhr[i] - shifting.day.usageStatus[i];
                        shifting.output.powerPlantsArray[k].residue[i] = shifting.output.powerPlantsArray[k].residue[i] + shifting.day.usageStatus[i] - shifting.day.minhr[i] ;
                        shifting.day.usageStatus[i] = shifting.day.minhr[i];
                    }

            }
        }
    }

    function optimize3() {
    // Stage 3: Fill in what's remaining based on what's cheapest. 
    var powerPlantKeys = Object.keys(shifting.powerPlants);
    var powerPlantCount = powerPlantKeys.length;

        function sumUsageStatus() {
            var total = 0;
            for(var i in shifting.day.usageStatus) { 
                total += shifting.day.usageStatus[i]; 
            }
            return total;
        }
    var total_unfilled = shifting.day.totalUsage() - sumUsageStatus();
    var hour_unfilled = [];
    for(i=0; i < 24; i++) { 
        hour_unfilled[i] = shifting.day.maxhr[i] - shifting.day.usageStatus[i];
    }

    for(i=0; i < powerPlantCount; i++) {
            for(k=0; k < 24; k++) {
                if (shifting.output.powerPlantsArray[i].residue[k] > 0 && hour_unfilled[k] > 0 && total_unfilled > 0 ) {
                     if (hour_unfilled[k] > shifting.output.powerPlantsArray[i].residue[k] && 
                         total_unfilled > shifting.output.powerPlantsArray[i].residue[k]) {
                            
                            shifting.output.powerPlantsArray[i].optimumUsage[k] = shifting.output.powerPlantsArray[i].optimumUsage[k] + shifting.output.powerPlantsArray[i].residue[k];
                            total_unfilled = total_unfilled - shifting.output.powerPlantsArray[i].residue[k];
                            hour_unfilled[k] = hour_unfilled[k] - shifting.output.powerPlantsArray[i].residue[k];
                            shifting.day.usageStatus[k] = shifting.day.usageStatus[k] + shifting.output.powerPlantsArray[i].residue[k];
                            shifting.output.powerPlantsArray[i].residue[k] = 0;
                    }
                    else if (hour_unfilled[k] <= shifting.output.powerPlantsArray[i].residue[k] && total_unfilled >= hour_unfilled[k]) {
                            
                            shifting.output.powerPlantsArray[i].optimumUsage[k] = shifting.output.powerPlantsArray[i].optimumUsage[k] + hour_unfilled[k];
                            shifting.output.powerPlantsArray[i].residue[k] = shifting.output.powerPlantsArray[i].residue[k] - hour_unfilled[k];
                            total_unfilled = total_unfilled - hour_unfilled[k];
                            shifting.day.usageStatus[k] = shifting.day.usageStatus[k] + hour_unfilled[k];
                            hour_unfilled[k] = 0;
                    }
                    else if (total_unfilled <= shifting.output.powerPlantsArray[i].residue[k] && hour_unfilled[k] >= total_unfilled) {
                            
                            shifting.output.powerPlantsArray[i].optimumUsage[k] = shifting.output.powerPlantsArray[i].optimumUsage[k] + total_unfilled;
                            shifting.output.powerPlantsArray[i].residue[k] = shifting.output.powerPlantsArray[i].residue[k] - total_unfilled;
                            hour_unfilled[k] = hour_unfilled[k] - total_unfilled;
                            shifting.day.usageStatus[k] = shifting.day.usageStatus[k] + total_unfilled;
                            total_unfilled = 0;

                    }
                    else {
                      continue;
                    }

                }
            }
        }

    }


    shifting.output.updateVariableArray();
    optimize1();
    optimize2();
    optimize3();
    shifting.output.result = shifting.output.StackedBarData();
}


shifting.output ={};

// Used by updateVariableArray to sort array by cost and co2
shifting.output.compareByCostAndCo2 = function(a, b) {
    if ( a.cost.fuel < b.cost.fuel ) {
      return -1;
    }

    if ( a.cost.fuel === b.cost.fuel ) {
      
      if ( a.cost.co2 < b.cost.co2 ) {
        return -1;
      }
      
      if ( a.cost.co2 === b.cost.co2 ) {
        return 0;
      }
      
      return 1;
    }

    return 1;
  };

// Creates an ordered array of powerplants from the corresponding objects in shifting.powerPlants. Ordered based on cost and co2
shifting.output.updateVariableArray = function() {
  var arr = this.powerPlantsArray;
  if ( !arr ) {
    arr = [];
  }
  var i = 0;

  powerPlantCount = Object.keys(shifting.powerPlants).length;

  for (i = 0; i < powerPlantCount ; i++)  {
    arr[i] = shifting.powerPlants["powerPlant" + i];
  }

arr.sort(this.compareByCostAndCo2);
for ( i = 0; i < arr.length; ++i ) {
  arr[i].index = i;
}
  this.powerPlantsArray = arr;
};


// The following outputs data. Note that this output is stored in shifting.output.result and used then by the plotter functions
// The function rescaleToOptimized in plot.js is triggered on clicking Optimize button and plots the optimized graph. After that, dragBarBehaviour (plot.js) or resetLoadProfile takes over.
shifting.output.StackedBarData = function(callback) {
  var result = [];
  var resultFn = function(t) {
    array = shifting.output.powerPlantsArray.map(function(v) { return v.optimumUsage[t];});
    total = 0;
    for(var i in array) {total += array[i]};
    return {
      x: t,
      ys: shifting.output.powerPlantsArray.map( function(v) { return v.optimumUsage[t]; } ),
      colors: shifting.output.powerPlantsArray.map( function(v) { return v.color; } ),
      y: total
    };
  };

  for ( var t = 0; t < 24; ++t ) {
    result[t] = resultFn(t);
  }

  // recomputes the bar chart data
  result.callback = function() {
    // copy load back to primary
    for ( t = 0; t < 24; ++t ) {
      shifting.day.loadProfile[t] = result[t].y;
    }
    // recompute results
    optimize();
    shifting.output.updateVariableArray();

    array = shifting.output.powerPlantsArray.map(function(v) { return v.optimumUsage[t];});
    total = 0;
    for(var i in array) {total += array[i]};
    // copy results back
    for ( t = 0; t < 24; ++t ) {
      result[t].y = total;
      result[t].ys = shifting.output.powerPlantsArray.map( function(v) { return v.optimumUsage[t]; } );
    }

    // continue the update chain
    if ( callback ) {
      callback();
    }

    return result;
  };

  return result;
};


