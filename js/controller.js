// Menu Item: Optimize
// Optimize checkbox controller
// No controller, only an event listener in plot.addStackedBarChart. Function called on click is the rescaleToOptimize reference in plot.js.


// Legend-related functions
    // update legends updates the progress-bar style legend values if called with arguments. 
    var updateLegends = function(costSelectorFuel, costSelectorCO2, loadSelector) {
       costSelectorFuel = costSelectorFuel || "#cost-fuel-current";
       costSelectorCO2 = costSelectorCO2 || "#cost-co2-current";
       loadSelector = loadSelector || "#load-current";

       d3.select(costSelectorFuel).text(numFmt.format(sharedElectricData.totalCost.fuel));
       d3.select(costSelectorCO2).text(numFmt.format(sharedElectricData.totalCost.co2));
       d3.select(loadSelector).text(numFmt.format(sharedElectricData.totalLoad));


          var savingsColorFn = function(x) {
             if ( x <= 0 ) {
                x = -x;
                return "rgb(0%," + (50*x + 50) + "%,0%)";
             }
             return "rgb(" + (50*x + 50) + "%,0%,0%)";
          };

          var loadOffsetColorFn = function(x) {
             var h = Math.min(Math.abs(x), 1.0);
             return "hsl(" + (120 * (1-h)) + ", 90%, 50%)";
          };

          var updateOffsetBar = function (selector, value, valueRange, colorFn) {
             var svg = d3.select(selector + " svg");
             var totalWidthPixelStr = window.getComputedStyle(svg.node()).width;
             var barHeight = window.getComputedStyle(svg.node()).height;
             barHeight = Number(barHeight.substr(0, barHeight.length-2));
             var totalWidth = Number(totalWidthPixelStr.substr(0, totalWidthPixelStr.length-2));
             var barWidthLeft = 0;
             var barWidthRight = 0;
             var barWidthMid = 10;
             var relativeValue = value / valueRange
             if ( value > 0 ) {
                barWidthRight = relativeValue * totalWidth/2;
             } else {
                barWidthLeft = -relativeValue * totalWidth/2;
             }
             var color = colorFn(relativeValue);

             svg.selectAll("rect")
                  .attr("height", barHeight)
           .style("stroke", "white");
             svg.select("rect.left-horizontal-bar")
                  .style("fill", color)
           .attr("width", barWidthLeft)
           .attr("x", totalWidth/2 - barWidthLeft);
             svg.select("rect.right-horizontal-bar")
                  .style("fill", color)
           .attr("width", barWidthRight)
           .attr("x", totalWidth/2);

             d3.select(selector + " .value-overlay")
                .text(numFmt.format(value));
          };

          var selector = "#fig-load-offset";
          updateOffsetBar("#fig-load-offset", (sharedElectricData.totalLoad - totalLoadInitial), plot.yMax, loadOffsetColorFn);
          updateOffsetBar("#fig-savings-fuel", (sharedElectricData.totalCost.fuel - totalCostInitial.fuel), 100, savingsColorFn);
          updateOffsetBar("#fig-savings-co2", (sharedElectricData.totalCost.co2 - totalCostInitial.co2), 1000, savingsColorFn);

     };

function updatePowerPlantLegend() {
     var arr = sharedElectricData.variableArray;
     // TODO: Make this update live
     d3.select("#color-legend tbody")
       .selectAll("tr.data")
       .data(arr.reverse())
       .enter()
       .append("tr")
       .attr("class", "data")
       .selectAll("td")
       .data(function(d) { return [
       ["color", d.color],
       ["type", d.name]
     ];})
       .enter()
       .append("td")
       .text(function(d) {
       if ( d[0] === "color" ) return "";
       return d[1];
     })
       .style("background-color", function(d) {
       if ( d[0] === "color" ) return d[1];
       return "";
     })
       .attr("class", function(d) {
       var c = "legend-column-"+d[0];
       if ( d[0] === "fuel" || d[0] === "co2" ) {
         return "numeric " + c;
       }
       return c;
     });
     // get the original ordering
     arr.reverse();
}


function resetLegendInitialValues() {

    totalLoadInitial = sharedElectricData.totalLoad;
    totalCostInitial = {
          fuel: sharedElectricData.totalCost.fuel,
          co2: sharedElectricData.totalCost.co2
       };  
       updateLegends("#cost-fuel-original", "#cost-co2-original", "#load-original"); 
       updateLegends();
    }



// Menu Item: flexbility profile
// fp checkbox controller

function showFlexibilityProfile() 
{
    if($('#fpcheckbox').is(':checked')) {
        plot.addLineChart(plotLineChart(shifting.day.maxhr), 'red');
        plot.addLineChart(plotLineChart(shifting.day.minhr),'blue');
        document.getElementById("flexibility-profile-legend").style.display = "block";
    }
    else {
        $('circle').filter(function() {
        return $(this).css('stroke') == 'rgb(255, 0, 0)';
        }).remove();
        $('path').filter(function() {
        return $(this).css('stroke') == 'rgb(255, 0, 0)';
        }).remove();

        $('circle').filter(function() {
        return $(this).css('stroke') == 'rgb(0, 0, 255)';
        }).remove();
        $('path').filter(function() {
        return $(this).css('stroke') == 'rgb(0, 0, 255)';
        }).remove();
        document.getElementById("flexibility-profile-legend").style.display = "none";
    }

}

// Menu Item: Enter Data and Add Power Source
// Display Popup for Entering Data

function open_dataform(id)
{
    for(i=0; i<24; i++) {
        $("#df-"+ i).val(shifting.day.df[i]);
        $("#uf-"+ i).val(shifting.day.uf[i]);
        $("#lp-"+ i).val(shifting.day.loadProfile[i]);
    }
    document.getElementById(id).style.display = "block";
}

// Hide Popup for Entering Data

function close_dataform(id) {
    document.getElementById(id).style.display = "none";
}

// Data Validation of Flexibility and Load Profiles after Enter Data submission

function validateData() {

    var df =[];
    var uf =[];
    var lp = [];
    var inputfields = $("#enter-data").find("input");
    var empty = inputfields.filter(function() {
        return $.trim(this.value) === "";
    });
    if(empty.length) {
            $("#enter-data-success").html("");
            $("#enter-data-alert").html("Error: Atleast one field is empty");
            }
    else { 
            // No field is empty & check positive integer condition
            var positivenumber = inputfields.filter(function() {
                    return $.isNumeric(this.value) && this.value >= 0 && this.value % 1 === 0});
                    if(positivenumber.length === (inputfields.length)) {
            // All are positive integers check positive
                        

                        for (i=0; i < 24; i++) {
                            // check if downward flexibility is lesser than load profile
                            if(parseFloat($("#df-" + i).val()) > parseFloat($("#lp-" + i).val())) {
                                $("#enter-data-success").html("");
                                $("#enter-data-alert").html("Error: Downward flexibility is higher than the load profile for " + i + ":00.");
                                return; 
                            }

                            else {
                                df[i] =  parseFloat($("#df-" + i).val());
                                lp[i] =  parseFloat($("#lp-" + i).val());
                                uf[i] =  parseFloat($("#uf-" + i).val()); 
                            }

                        // check if load profile is greater than sum of minimum of all powerplants for the hour.    
                        var sumOfMinimums = 0;    
                        for (var pps in shifting.powerPlants) {
                            sumOfMinimums += shifting.powerPlants[pps].min[i];
                        }
                        if (lp[i] < sumOfMinimums) {
                            $("#enter-data-success").html("");
                            $("#enter-data-alert").html("The load profile value for " + i + ":00 is lesser than the sum of minimums of all powerplants for that hour.");
                            return;
                        } 
                        }


                        $("#enter-data-alert").html("");
                        $("#enter-data-success").html("Your data has been entered successfully!");
                        shifting.day.df = df;
                        shifting.day.uf = uf;
                        // To prevent referencing, and prevent shifting.day.load from changing on dragging (sharedElectricData.loadProfile does), we use the valueAssigner function
                        valueAssigner(shifting.day.loadProfile, lp, numTimeSteps);
                        valueAssigner(sharedElectricData.load, lp, numTimeSteps);
                        shifting.day.minhr = shifting.day.sumdf();
                        shifting.day.maxhr = shifting.day.sumuf();
                        $("#dragsimulate").trigger("resetLoadProfile");
                        resetLegendInitialValues();
                        if($('#fpcheckbox').is(':checked')) {
                            // clear FP
                            $('#fpcheckbox').attr('checked',false);
                            showFlexibilityProfile();
                        }
                    }
                    else {
                            $("#enter-data-success").html("");
                            $("#enter-data-alert").html("Error: One or more entries is not a positive integer value.");
                    }

        }


    return false;
}

// Add Power Source controller


// show Min Max form for each power plant
function showMinMax() {
          document.getElementById('min').style.display = "block";
          document.getElementById('max').style.display = "block";
          document.getElementById('addps-submit').style.display = "block";
          document.getElementById('addps-button').style.display = "none"; }

// In the add-power source dialog, add a list item on addition of power plant and create a n ew text box

function addListItem(ppNumber) {
        
            document.getElementById('min').style.display = "none";
            document.getElementById('max').style.display = "none";
            document.getElementById('addps-submit').style.display = "none";
            document.getElementById('addps-button').style.display = "block";
            $("#added").append('<tr id=ps-list-item-'+ ppNumber + '><td>' + $("#pp-1-name").val() + '</td><td>' + $("#pp-1-cost").val() + '</td><td>' + $("#pp-1-co2").val()  +'</td><td><a href="javascript:%20deletePowerSource(%22powerPlant'+ ppNumber +'%22);"><img src="images/deleteButton.png"></a></td></tr>');
            $("#new-ps").html('<tr><td>&nbsp</td><td>&nbsp</td><td>&nbsp</td></tr><tr><td><input type="text" id="pp-1-name" placeholder="New Power Plant Name" class="pp-name"></td><td><input type="text" id="pp-1-cost" placeholder="Cost" class="pp-cost"></td><td><input type="text" id="pp-1-co2" placeholder="CO2" class="pp-co2"></td></tr>');
            $("#color-legend tbody tr.data").remove();
            sharedElectricData.updateVariableArray();
            shifting.output.updateVariableArray();
            updatePowerPlantLegend();
            $("#dragsimulate").trigger("customDragEvent");
        }

// List pre-defined power sources in the add power sources dialog on page load.
function addPreloadedListItem() {
            document.getElementById('min').style.display = "none";
            document.getElementById('max').style.display = "none";
            document.getElementById('addps-submit').style.display = "none";
            document.getElementById('addps-button').style.display = "block";
            for (var powerplant in shifting.powerPlants) {
                var pp = powerplant;
                if(pp.slice(-1) != 0) {
                    $("#added").append('<tr id=ps-list-item-' + pp.slice(-1) + '><td> ' + shifting.powerPlants[pp].name + '</td><td> ' + shifting.powerPlants[pp].cost.fuel + '</td><td>' + shifting.powerPlants[pp].cost.co2  +'</td><td><a href="javascript:%20deletePowerSource(%22'+pp+'%22);"><img src="images/deleteButton.png"></a></td></tr>');
                }
            }

        }


// Set powerplant min and max to 0 for all hours, remove its color and name.

function deletePowerSource(powerplant)
{
    var pp = powerplant;
    shifting.powerPlants[powerplant].color = "white";
    sharedElectricData.variables[powerplant].color = "white";
    shifting.powerPlants[powerplant].name = "";
    sharedElectricData.variables[powerplant].name = "";

    for (i=0, n=shifting.powerPlants[powerplant].min.length; i < n; i++) {
        shifting.powerPlants[powerplant].min[i]=0;
        sharedElectricData.variables[powerplant].min[i]=0;
        
    }
    for (i=0, n=shifting.powerPlants[powerplant].max.length; i < n; i++) {
        shifting.powerPlants[powerplant].max[i]=0;
        sharedElectricData.variables[powerplant].max[i]=0;
    }
    $("#ps-list-item-"+pp.slice(-1)).remove();
    $("#dragsimulate").trigger("customDragEvent");
    $("#color-legend tbody tr.data").remove();
    updatePowerPlantLegend();
    resetLegendInitialValues();
}



function deleteAllPowerSources()
{
    for (var i in shifting.powerPlants)     {
        if(shifting.powerPlants[i].name != "Blackout") {
        deletePowerSource(i);
        }
    }
}

// Validating Power Source data on submitting add power source min and max form data.
function validatePowerSource() {

    var min = [];
    var max = [];
    var inputfields = $("#add-power-source").find("input");
    var empty = inputfields.filter(function() {
        return $.trim(this.value) === "";
    });

    if(empty.length) {
            $("#addps-alert").html("Error: Atleast one field is empty");
            }
    else
         {
            // No field is empty check positive
            var positivenumber = $("#add-power-source").find("input").filter(function() {
                    return $.isNumeric(this.value) && this.value >= 0});
            var integervalues = $("#add-power-source").find("input").filter(function() {return this.placeholder === "kWh" && this.value % 1 === 0});
                    // Check if all numbers are 0 or positive
                    if(positivenumber.length === (inputfields.length - 1) && integervalues.length === (inputfields.length - 3)) { 
                        
                        
                        // CHeck if all minimums are greater than the maximum
                        var allMaxGreaterThanMin = false;
                        for(i=0; i<24; i++) {
                            if(parseFloat($("#min-" + i).val()) > parseFloat($("#max-" + i).val())) {
                                $("#addps-alert").html("Error: The maximum is lesser than the minimum for " + i +":00");
                                allMaxGreaterThanMin = false;
                                break;
                            }
                            else {
                                allMaxGreaterThanMin = true;
                            }
                        }

                        if(allMaxGreaterThanMin) {
                            // check if sum of minimums for each hour is less than load profile.
                            var sumMinGreaterThanTotal = false;
                            for(i=0; i<24; i++) {
                                    var sumOfMinimums = 0;
                                    for (var pps in shifting.powerPlants) {
                                    sumOfMinimums += shifting.powerPlants[pps].min[i];
                                    }

                                    if((parseFloat($("#min-" + i).val()) + sumOfMinimums) > shifting.day.loadProfile[i]) {
                                        $("#addps-alert").html("Error: The sum of minimums of all powerplants is greater than your load profile for " + i + ":00.");
                                        sumMinGreaterThanTotal = false;
                                        break;
                                    }
                                    else {
                                        sumMinGreaterThanTotal = true;
                                    }
                                }

                                    if(sumMinGreaterThanTotal) {
                                        

                                            for (k=0; k < 24; k++) {
                                                min[k] =  parseFloat($("#min-" + k).val());
                                                max[k] =  parseFloat($("#max-" + k).val());
                                            }

                                            // Variable holds number of powerplants added by user
                                            var userppCount = Object.keys(shifting.powerPlants).length;
                                            // Set powerplant values for optimization (shifting.js)
                                            shifting.powerPlants["powerPlant" + userppCount] = {};
                                            shifting.powerPlants["powerPlant" + userppCount].name = $("#pp-1-name").val();
                                            shifting.powerPlants["powerPlant" + userppCount].cost = {};
                                            shifting.powerPlants["powerPlant" + userppCount].cost.fuel = parseFloat($("#pp-1-cost").val());
                                            shifting.powerPlants["powerPlant" + userppCount].cost.co2 = parseFloat($("#pp-1-co2").val());
                                            shifting.powerPlants["powerPlant" + userppCount].min = min;
                                            shifting.powerPlants["powerPlant" + userppCount].max = max;
                                            shifting.powerPlants["powerPlant" + userppCount].optimumUsage = [];
                                            shifting.powerPlants["powerPlant" + userppCount].residue = [];
                                            shifting.powerPlants["powerPlant" + userppCount].fixed = false;
                                            shifting.powerPlants["powerPlant" + userppCount].color = colors[userppCount];

                                            // Set powerplant values for old program (data.js)
                                            sharedElectricData.variables["powerPlant" + userppCount] = {};
                                            sharedElectricData.variables["powerPlant" + userppCount].name = $("#pp-1-name").val();
                                            sharedElectricData.variables["powerPlant" + userppCount].cost = {};
                                            sharedElectricData.variables["powerPlant" + userppCount].cost.fuel = parseFloat($("#pp-1-cost").val());
                                            sharedElectricData.variables["powerPlant" + userppCount].cost.co2 = parseFloat($("#pp-1-co2").val());
                                            sharedElectricData.variables["powerPlant" + userppCount].min = min;
                                            sharedElectricData.variables["powerPlant" + userppCount].max = max;
                                            sharedElectricData.variables["powerPlant" + userppCount].optimumUsage = [];
                                            sharedElectricData.variables["powerPlant" + userppCount].residue = [];
                                            sharedElectricData.variables["powerPlant" + userppCount].fixed = false;
                                            sharedElectricData.variables["powerPlant" + userppCount].color = colors[userppCount];

                                            // Add the new powerplant to the list and recompute hourly bars
                                            addListItem(userppCount);
                                            $("#dragsimulate").trigger("resetLoadProfile");
                                            $("#addps-alert").html("");

                                            resetLegendInitialValues();
                                            
                                            
                                        
                                    }

                                  }
                                
                            }

                           
                        
                        
                    
                    else {
                            $("#addps-alert").html("Error: Atleast one of the values entered is a negative, a non-integer or a non-numeric value.");
                    }

        }


    return false;
}
