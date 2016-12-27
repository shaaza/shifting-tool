// Used by updateVariableArray to sort array by cost and co2
sharedElectricData.compareByCo2AndFuelCost = function(a, b) {
  if ( a.flexibility < b.flexibility ) {
    return -1;
  }
  if ( a.flexibility === b.flexibility ) {
    if ( a.cost.fuel < b.cost.fuel ) {
      return -1;
    }
    if ( a.cost.fuel === b.cost.fuel ) {
      return 0;
    }

    return 1;
  }


  return 1;
};

// Creates an ordered array of powerplants from the corresponding objects in shifting.powerPlants. Ordered based on cost and co2
sharedElectricData.updateVariableArray = function() {
  var arr = this.variableArray;
  if ( !arr ) {
    arr = [];
  }
  var i = 0;
  for ( var prop in this.variables ) {
    
    if ( !this.variables[prop].load ) {
      this.variables[prop].load = [];
    }
    arr[i++] = this.variables[prop];
  }
  
  arr.sort(this.compareByCo2AndFuelCost);
  
  for ( i = 0; i < arr.length; ++i ) {
    arr[i].index = i;
  }
  
  this.variableArray = arr;
};
sharedElectricData.updateVariableArray();


// For a given time t, optimize distribution of load among powerplants
sharedElectricData.updateOptimalLoadsAtTimestep = function(t) {
  var i, j;
  var arr = this.variableArray;
  // set minimum of data, power
  var minSumAtT = arr.map(function(x) {return x.min[t];}).reduce(function(a,b) {return a+b;});
  // declare variable to store remaining units to be filled
  var unfilled = this.load[t];
  // Load shouldn't exceed minimum of powerplants
  if(this.load[t] < minSumAtT) {
  this.load[t] = minSumAtT;
  }

  // fill in minimums of all powerplants
  for (var k in arr) {
        // declare unfilled for powerplant if it doesn't exist 
        arr[k].unfilled = arr[k].unfilled || [];
        arr[k].load[t] = arr[k].min[t];
        unfilled = unfilled - arr[k].min[t];
        arr[k].unfilled[t] = arr[k].max[t] - arr[k].min[t];
  }


  // if it's still unfilled
  if(unfilled > 0) {
    for (var k in arr) {
          // if there's more to be filled totally than can be filled by kth powerplant, fully utilize powerplants capacity.
          if(unfilled > 0 && unfilled > arr[k].unfilled[t]) {
            arr[k].load[t] += arr[k].unfilled[t];
            unfilled -= arr[k].unfilled[t];
            arr[k].unfilled[t] = 0;      
          }
          
          // if there's more capacity for the kth powerplant than the units to be filled, fill only as much as needed.
          if(unfilled > 0 && unfilled <= arr[k].unfilled[t]) {
            arr[k].load[t] += unfilled;                 
            arr[k].unfilled[t] -= unfilled;                             
            unfilled = 0;
            break;
          }
        }

  }


    this.cost.fuel[t] = 0;
    this.cost.co2[t] = 0;
    for ( i = 0; i < arr.length; ++i ) {
      if ( arr[i].name !== "Blackout" ) {
        this.cost.fuel[t] += arr[i].load[t] * arr[i].cost.fuel;
        this.cost.co2[t] += arr[i].load[t] * arr[i].cost.co2;
      }
    }
};

// Update cost and co2 parameters and call hourly optimizer
sharedElectricData.updateOptimalLoads = function(callback) {
  this.totalCost = {
    fuel: 0,
    co2: 0
  };
  
  this.totalLoad = 0;

  var v;
  for ( v in this.variables ) {
    this.variables[v].totalLoad = 0;
    this.variables[v].totalCost = { fuel: 0, co2: 0 };
  }
  for ( var t = 0; t < numTimeSteps; ++t ) {
    this.updateOptimalLoadsAtTimestep(t);

    for ( v in this.variables ) {
      this.variables[v].totalLoad += this.variables[v].load[t];
      this.variables[v].totalCost.fuel += this.variables[v].load[t] * this.variables[v].cost.fuel;
      this.variables[v].totalCost.co2 += this.variables[v].load[t] * this.variables[v].cost.co2;
    }
    this.totalCost.fuel += this.cost.fuel[t];
    this.totalCost.co2 += this.cost.co2[t];
    this.totalLoad += this.load[t];
  }
  if ( callback ) {
    callback();
  }
};


// REsult is stored in the following getStackedBarData

sharedElectricData.getStackedBarData = function(callback) {
  var result = [];
  var self = this;

  var resultFn = function(t) {
    return {
      x: t,
      y: self.load[t],
      ys: self.variableArray.map( function(v) { return v.load[t]; } ),
      colors: self.variableArray.map( function(v) { return v.color; } )
    };
  };

  for ( var t = 0; t < numTimeSteps; ++t ) {
    result[t] = resultFn(t);
  }

  // recomputes the bar chart data
  result.callback = function() {
    // copy load back to primary
    for ( t = 0; t < numTimeSteps; ++t ) {
      self.load[t] = result[t].y;
    }
    // recompute results
    self.updateOptimalLoads();

    // copy results back
    for ( t = 0; t < numTimeSteps; ++t ) {
      result[t].y = self.load[t];
      result[t].ys = self.variableArray.map( function(v) { return v.load[t]; } );
      result[t].colors = self.variableArray.map( function(v) { return v.color; } );

    }

    // continue the update chain
    if ( callback ) {
      callback();
    }
    
    return result;
  };

  return result;
};
