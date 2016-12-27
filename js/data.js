// NOTE: This script must be loaded first.

// colors corresponding to the bars of each power source
var colors= ["#400000", "#e57373", "#bf8f8f", "#731f00", "#bf7960", "#cc5200", "#331400", "#e6c3ac", "#403630", "#e59900", "#7f5500", "#8c8169", "#332900", "#ccbe00", "#ced9a3", "#558000", "#d4ff80", "#19bf00", "#33592d", "#3df29d", "#a3d9bf", "#0d332b", "#008077", "#00eeff", "#008fb3", "#1a5766", "#a3bfd9", "#668fcc", "#3d6df2", "#393c4d", "#0000f2", "#0000e6", "#333366", "#14004d", "#5b29a6", "#c339e6", "#331a31", "#f2b6ee", "#8c467e", "#590030", "#d9368d", "#594349", "#ff0022", "#992636"];

// Changing the number of time steps will BREAK the program, unless the min and max arrays for all powerplants, LPs, FPs etc. are changed to arrays of length numTimeSteps.
// Also, optimize.js is not designed to use numTimeSteps and will have to be changed seperately, apart forms etc.

var numTimeSteps = 24;

// sharedElectricData is used by optimaltimestep.js. Preloaded data for the same is found here. 
// This data is later modified on adding powerplants, removing powerplants, entering a new load profile and on dragging the bars.

var sharedElectricData = {
  
  
  load: [162, 204, 228, 204, 189, 210, 205, 2082, 436, 240, 244, 1420, 3587, 3994, 3875, 3858, 3940, 3708, 3373, 3087, 4921, 4217, 1749, 778],
  
  
  cost: {
    fuel: [],  // Initialized later
    co2: []    // Initialized later
  },
  
  variables: {
        powerPlant0: {
        name: "Blackout",
        // The fixed property is just an unwanted remnant from the older program. Set fixed to false for all power plants. NOTE: Should remove this at a later stage.
        fixed: false,
        cost: { fuel: Infinity,
                co2: Infinity},
        // Minimum power that must be used for each hour
        min: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        // Maximum power that can be used for each hour
        max: [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity],
        color: colors[0],
        // The following array is used during optimization to store energy that has already been contributed by this powerplant for each hour 
        optimumUsage: [],
        // The following array is used during optimization to store the remaining energy that can been contributed by this powerplant for each hour
        residue: []
    } ,
    powerPlant1: {
        name: "nuclear",
        fixed: false,
        cost: { fuel: 0.01,
                co2: 0.066},
        min: [82, 82, 82, 82, 82, 82, 82, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 82, 82, 82, 82, 82],
        max: [82, 82, 82, 82, 82, 82, 82, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 82, 82, 82, 82, 82],
        color: colors[1],
        optimumUsage: [],
        residue: []
    },
    powerPlant2: {
        name: "gas",
        fixed: false,
        cost: { fuel: 0.1,
                co2: 0.5},
        min: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        max: [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity],
        color: colors[2],
        optimumUsage: [],
        residue: []
    },
    powerPlant3: {
        name: "wind",
        fixed: false,
        cost: { fuel: 0,
                co2: 0.01},
        min: [34, 122, 146, 122, 107, 127, 122, 120, 128, 0, 79, 95, 95, 112, 143, 123, 120, 112, 97, 146, 115, 103, 146, 165],
        max: [34, 122, 146, 122, 107, 127, 122, 120, 128, 0, 79, 95, 95, 112, 143, 123, 120, 112, 97, 146, 115, 103, 146, 165],
        color: colors[3],
        optimumUsage: [],
        residue: []
    },

    powerPlant4: {
        name: "solar",
        fixed: false,
        cost: { fuel: 0,
                co2: 0.025},
        min: [0, 0, 0, 0, 0, 1, 1, 47, 69, 75, 0, 0, 148, 82, 74, 37, 16, 0, 0, 0, 0, 0, 0, 0],
        max: [0, 0, 0, 0, 0, 1, 1, 47, 69, 75, 0, 0, 148, 82, 74, 37, 16, 0, 0, 0, 0, 0, 0, 0],
        color: colors[4],
        optimumUsage: [],
        residue: []
    },

    powerPlant5: {
        name: "hydro",
        fixed: false,
        cost: { fuel: 0.031,
                co2: 0.01},
        min: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        max: [935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935],
        color: colors[5],
        optimumUsage: [],
        residue: []
    },

    powerPlant6: {
        name: "coal1",
        fixed: false,
        cost: { fuel: 0.03,
                co2: 0.8},
        min: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        max: [825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825],
        color: colors[6],
        optimumUsage: [],
        residue: []
    },
    powerPlant7: {
        name: "coal2",
        fixed: false,
        cost: { fuel: 0.03,
                co2: 0.9},
        min: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        max: [825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825],
        color: colors[7],
        optimumUsage: [],
        residue: []
    }
  }
};


// shifting is used by optimize.js. Contains preloaded data.
// This data is later modified on adding powerplants, removing powerplants, entering a new load profile and on dragging the bars.
// shifting stores the load profiles and FPs for the load shifting optimization
var shifting = {};
shifting.day = {

    // Hourly Power Supply - Load Profile
    loadProfile: [162, 204, 228, 204, 189, 210, 205, 2082, 436, 240, 244, 1420, 3587, 3994, 3875, 3858, 3940, 3708, 3373, 3087, 4921, 4217, 1749, 778],
    // Downward Flexibility Profile
    df: [0, 0, 0, 0, 0, 0, 0, 200, 0, 0, 0, 300, 300, 300, 300, 300, 300, 300, 0, 0, 0, 200, 400, 200],
    // Upward Flexibility Profile
    uf: [200, 200, 200, 200, 200, 200, 200, 0, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 300, 300, 200, 200],
    // Min Hour Requirements - Downward Flexibility Profile
    sumdf: function() { var sum=[]; for(i=0; i<24; i++) {sum[i] = 0; sum[i] = this.loadProfile[i] - this.df[i];} return sum;},
    minhr: [162, 164, 167, 176, 165, 176, 177, 2082, 436, 194, 195, 1420, 3587, 3994, 3875, 3858, 3940, 3708, 3373, 3087, 4921, 4217, 1749, 778].map(function(x) {return parseInt(x/2);}),
    // Max Hour Requirements - Upward Flexibility Profile NOTE: Create function. Total upper limit required.
    sumuf: function() { var sum=[]; for(i=0; i<24; i++) {sum[i] = 0; sum[i] = parseInt(this.loadProfile[i]) + parseInt(this.uf[i]);} return sum;},
    maxhr: [162, 164, 167, 176, 165, 176, 177, 2082, 436, 194, 195, 1420, 3587, 3994, 3875, 3858, 3940, 3708, 3373, 3087, 4921, 4217, 1749, 778].map(function(x) {return parseInt(x + x/2);}),
    // US - Usage Status
    usageStatus: [],
    // Total usage
    totalUsage: function() {
                        var totalusage = 0;
                        for(var i = 0; i < 24; i++) {
                            totalusage += this.loadProfile[i];
                            }
                        return totalusage;
                    }

            };


// Array of powerplants
shifting.powerPlants = {

    powerPlant0: {
        name: "Blackout",
        // The fixed property is just an unwanted remnant from the older program. Set fixed to false for all power plants. NOTE: Should remove this at a later stage.
        fixed: false,
        cost: { fuel: Infinity,
                co2: Infinity},
        // Minimum power that must be used for each hour
        min: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        // Maximum power that can be used for each hour
        max: [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity],
        color: colors[0],
        // The following array is used during optimization to store energy that has already been contributed by this powerplant for each hour 
        optimumUsage: [],
        // The following array is used during optimization to store the remaining energy that can been contributed by this powerplant for each hour
        residue: []
    } ,
    powerPlant1: {
        name: "nuclear",
        fixed: false,
        cost: { fuel: 0.01,
                co2: 0.066},
        min: [82, 82, 82, 82, 82, 82, 82, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 82, 82, 82, 82, 82],
        max: [82, 82, 82, 82, 82, 82, 82, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 165, 82, 82, 82, 82, 82],
        color: colors[1],
        optimumUsage: [],
        residue: []
    },
    powerPlant2: {
        name: "gas",
        fixed: false,
        cost: { fuel: 0.1,
                co2: 0.5},
        min: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        max: [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity],
        color: colors[2],
        optimumUsage: [],
        residue: []
    },
    powerPlant3: {
        name: "wind",
        fixed: false,
        cost: { fuel: 0,
                co2: 0.01},
        min: [34, 122, 146, 122, 107, 127, 122, 120, 128, 0, 79, 95, 95, 112, 143, 123, 120, 112, 97, 146, 115, 103, 146, 165],
        max: [34, 122, 146, 122, 107, 127, 122, 120, 128, 0, 79, 95, 95, 112, 143, 123, 120, 112, 97, 146, 115, 103, 146, 165],
        color: colors[3],
        optimumUsage: [],
        residue: []
    },

    powerPlant4: {
        name: "solar",
        fixed: false,
        cost: { fuel: 0,
                co2: 0.025},
        min: [0, 0, 0, 0, 0, 1, 1, 47, 69, 75, 0, 0, 148, 82, 74, 37, 16, 0, 0, 0, 0, 0, 0, 0],
        max: [0, 0, 0, 0, 0, 1, 1, 47, 69, 75, 0, 0, 148, 82, 74, 37, 16, 0, 0, 0, 0, 0, 0, 0],
        color: colors[4],
        optimumUsage: [],
        residue: []
    },

    powerPlant5: {
        name: "hydro",
        fixed: false,
        cost: { fuel: 0.031,
                co2: 0.01},
        min: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        max: [935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935, 935],
        color: colors[5],
        optimumUsage: [],
        residue: []
    },


    powerPlant6: {
        name: "coal1",
        fixed: false,
        cost: { fuel: 0.03,
                co2: 0.8},
        min: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        max: [825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825],
        color: colors[6],
        optimumUsage: [],
        residue: []
    },
    powerPlant7: {
        name: "coal2",
        fixed: false,
        cost: { fuel: 0.03,
                co2: 0.9},
        min: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        max: [825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825, 825],
        color: colors[7],
        optimumUsage: [],
        residue: []
    }
}

