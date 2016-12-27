// Plots the base and the axes
function SvgPlotBase(parentSelector, width, height, margin,  axisLabels)
{
  this.axisLabels = axisLabels || { x: "", y: ""};
  this.parentSelector = parentSelector || "body";
  this.margin = margin || { top: 20, right: 20, bottom: 30, left: 80 };
  this.width = width || 600;
  this.height = height || 500;

  this.nextPlotId = 0;

  // init body
  this.svg = d3.select(this.parentSelector).append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
  .append("g")
    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

  // init axes
  this.xMin = 0;
  this.xMax = 1;

  this.yMin = 0;
  this.yMax = 1;

  this.xAxis = d3.svg.axis().scale(this.xScale).orient("bottom");
  this.yAxis = d3.svg.axis().scale(this.yScale).orient("left");

  this.redrawAxes();
  
  this.svg.append("g")
    .attr("class", "x axis")
  .append("text")
    .attr("class", "label")
    .attr("y", 3*this.margin.bottom/4)
    .attr("x", this.xWidth/2)
    .text(this.axisLabels.x);
  
  this.svg.append("g")
    .attr("class", "y axis")
  .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text(this.axisLabels.y);
  
  // y kWh
  // x hour of day
  
  this.dataObjects = [];


}

// Rescales axes: sets the maximum of energy usage. 
SvgPlotBase.prototype.rescaleAxes = function(data) {
  for ( var i = 0; i < data.length; ++i ) {
    this.xMin = Math.min(this.xMin, data[i].x);
    this.xMax = Math.max(this.xMax, data[i].x);

    this.yMin = Math.min(this.yMin, data[i].y);
    // Vertical maximum is set as the maximum among the values in data set, upward flexibility profile and current maximum
    this.yMax = Math.max(this.yMax, data[i].y, shifting.day.maxhr[i]);

    data[i].index = i; // augment the data with an index attribute for lookup purposes
  }
};

// Redraws the axes after rescaling
SvgPlotBase.prototype.redrawAxes = function() {
  this.xWidth  = this.width - this.margin.left - this.margin.right;
  this.yHeight = this.height - this.margin.top - this.margin.bottom;

  this.xScale = d3.scale.linear()
    .domain([this.xMin-1, this.xMax+1])
    .range([0, this.xWidth]);

  this.yScale = d3.scale.linear()
    .domain([this.yMin, this.yMax])
    .range([this.yHeight, 0]);

  this.xAxis.scale(this.xScale);
  this.yAxis.scale(this.yScale);

  this.xPos = this.height - this.margin.top - this.margin.bottom;
  this.yPos = 0;

  this.svg.select("g .x.axis")
    .attr("transform", "translate(0," + this.xPos + ")")
    .call(this.xAxis);

  this.svg.select("g .y.axis")
    .attr("transform", "translate(" + this.yPos + ",0)")
    .call(this.yAxis);
};

// Plotting line charts. If interactive is true, line chart can be moved around
SvgPlotBase.prototype.addLineChart = function(data, color, interactive) {
  var self = this;
  color = color || "steelblue";
  //hoverColor = hoverColor || color;

  var pathIdString = "fn-path-" + this.nextPlotId;
  ++this.nextPlotId;

  var line = d3.svg.line()
        .x(function(d) { return self.xScale(d.x); })
        .y(function(d) { return self.yScale(d.y); });

  this.rescaleAxes(data);
  this.redrawAxes();

  var pathSelection = this.svg.append("g").append("path")
    .datum(data)
    .attr("class", pathIdString + " line")
    .attr("d", line);

  var pointTransformFn = function(d) {
    return "translate(" + self.xScale(d.x) + "," + self.yScale(d.y) + ")";
  };

  var pointSelections = this.svg.selectAll(".point")
    .data(data)
  .enter().append("circle")
    .attr("r", 4)
    .attr("class", function(d) { return pathIdString + " point-" + d.index; })
    .attr("transform", pointTransformFn);

  if ( interactive ) {
    pointSelections
      .on("mouseover", function() {
        setCursorState("grab");
      })
      .on("mouseout", function() {
        setCursorState();
      });
  }

  var selection = this.svg.selectAll("." + pathIdString);
  selection.style("stroke", color);

  var dragCircleBehavior = (function() {
    return d3.behavior.drag()
      .on("dragstart", function() {
        setCursorState("grabbing");
      })
      .on("drag", function() {
        if ( d3.event.y >= self.yHeight || d3.event.y < 0 ) {
          // don't let the user leave the designated area
          return;
        }
        var yNext = (1-(d3.event.y / self.yHeight)) * (self.yMax - self.yMin) + self.yMin;
        var currentPointSelection = d3.select(this);
        var i = currentPointSelection.data()[0].index;
        data[i].y = yNext;
        
        data.callback();

        pathSelection.data([data]).attr("d", line);

        currentPointSelection.attr("transform", pointTransformFn);

        setCursorState("grabbing");
      })
      .on("dragend", function() {
        setCursorState("");
      });
  })();

  if ( interactive ) {
    this.svg.selectAll("circle." + pathIdString).call(dragCircleBehavior);
  }

};

// Plots the bar graph. If interactive is true, listeners for dragging, clicking optimize and triggering two custom events  are initialized.
SvgPlotBase.prototype.addStackedBarChart = function(data, interactive) {
  interactive = !!interactive;

  var self = this;
  this.rescaleAxes(data);
  this.redrawAxes();

  var draggingSomething = false;
  var setOpacityFn = function(val) {
    return function(index) {
      if ( draggingSomething ) return;
      var selection = d3.select(this);
      var i;
      if ( index !== undefined ) {
        i = index;
      } else {
        i = Number(selection.attr("data-index"));
      }
      self.svg.selectAll("rect.bar.index-"+i)
        .style("opacity", val);
    };
  };
  

  var i,j, d, x, y, ySum, barWidth, barPosX, barPosY, barHeight;
  barWidth = self.xScale(1) - self.xScale(0);
  for ( i = 0; i < data.length; ++i ) {
    d = data[i];
    ySum = 0; // sum of y-values below current point
    barPosX = self.xScale(d.x) - barWidth/2;
    for ( j = 0; j < d.ys.length; ++j ) {
      y = d.ys[j];
      ySum += y;
      barPosY = self.yScale(ySum);
      
      this.svg.append("rect")
        .attr("class", "bar" + " index-" + i + " subindex-" + j)
        .attr("data-index", i)
        .attr("data-subindex", j)
        .attr("width", barWidth)
        .attr("height", self.yScale(0) - self.yScale(y))
        .attr("transform", "translate(" + barPosX + "," + barPosY + ")")
        .style("fill", d.colors[j]);
    }
  }

// On dragging bars: Re-calculating power usage distribution among the power plants and redrawing rectangles 
  var dragBarBehavior = (function(){
    var index;

    return d3.behavior.drag()
      .on("dragstart", function() {
        setCursorState("grabbing");
        var selection = d3.select(this);
        index = Number(selection.attr("data-index"));
        draggingSomething = true;
      })
      .on("drag", function() {
        var selection = d3.select(this);
        var i = index = Number(selection.attr("data-index"));
        var j = Number(selection.attr("data-subindex"));

        var dy = (d3.event.dy / self.yHeight) * (self.yMax - self.yMin);
        var y = data[i].y - dy;

        // cannot drag beyond limits
        if ( y >= self.yMax || y <= self.yMin ) {
          return;
        }
        data[i].y = y;
        if ( data.callback ) {
          data.callback();

          // rescale rectangles
          for ( i = 0; i < data.length; ++i ) {
            ySum = 0;
            barPosX = self.xScale(data[i].x) - barWidth / 2;
            for ( j = 0; j < data[i].ys.length; ++j ) {
              y = data[i].ys[j];
              ySum += y;
              barPosY = self.yScale(ySum);
              self.svg.select("rect.bar.index-" + i + ".subindex-" + j)
                .attr("height", self.yScale(0) - self.yScale(y))
                .attr("transform", "translate(" + barPosX + "," + barPosY + ")")
                .style("fill", d.colors[j]);
            }
          }
        }
      })
      .on("dragend", function() {
        setCursorState("");
        draggingSomething = false;
        setOpacityFn(0.9)(index);
      });
  })();
  
  // On clicking optimize: Redrawing rectangles after optimization
  var rescaleToOptimized = (function(){
    var index;
        

        shifting.output.updateVariableArray();
        optimize();
        
        
        for (i=0; i < data.length; i++) { 
          data[i].y = shifting.output.result[i].y; 

          // Rescale and redraw axes if any value exceeds current maximum
          if ( data[i].y >= self.yMax || data[i].y <= self.yMin ) { self.rescaleAxes(shifting.output.result); self.redrawAxes();        }
        }

        if ( data.callback ) {
          data.callback();

          // rescale rectangles
          for ( i = 0; i < data.length; ++i ) {
            ySum = 0;
            barPosX = self.xScale(data[i].x) - barWidth / 2;
            for ( j = 0; j < shifting.output.result[i].ys.length; ++j ) {
              y = shifting.output.result[i].ys[j];
              ySum += y;
              barPosY = self.yScale(ySum);
              self.svg.select("rect.bar.index-" + i + ".subindex-" + j)
                .transition()
                .duration(1000)
                .attr("height", self.yScale(0) - self.yScale(y))
                .attr("transform", "translate(" + barPosX + "," + barPosY + ")");

            }
          }
        }
    
  });
// Simulates a drag event with 0 change in order to refresh rectangles. Triggered by code, via event customDragEvent.
  var dragSimulator = (function(){
    var index;

      
        var selection = d3.select(this);
        var i = 0;
        

        var dy = 0;
        var y = data[i].y - dy;
        if ( y >= self.yMax || y <= self.yMin ) {
          self.rescaleAxes(data); self.redrawAxes();
        }
        data[i].y = y;
        if ( data.callback ) {
          data.callback();

          // rescale rectangles
          for ( i = 0; i < data.length; ++i ) {
            ySum = 0;
            barPosX = self.xScale(data[i].x) - barWidth / 2;
            for ( j = 0; j < data[i].ys.length; ++j ) {
              y = data[i].ys[j];
              ySum += y;
              barPosY = self.yScale(ySum);
              self.svg.select("rect.bar.index-" + i + ".subindex-" + j)
                .attr("height", self.yScale(0) - self.yScale(y))
                .attr("transform", "translate(" + barPosX + "," + barPosY + ")")
                .style("fill", d.colors[j]);
            }
          }
        }
      
     
  });

  // Redraws the load profile irrespective of current state of graphs. Triggered by code, via event resetLoadProfile
  var resetLoadProfile = (function(){
    var index;

      
        var selection = d3.select(this);
        var i = 0;
        

        var dy = 0;
        var y = data[i].y - dy;
        if ( y >= self.yMax || y <= self.yMin ) {
          self.rescaleAxes(data); self.redrawAxes();
        }
        for (i=0; i < data.length; i++) { data[i].y = sharedElectricData.load[i];}
        if ( data.callback ) {
          data.callback();

          // rescale rectangles
          for ( i = 0; i < data.length; ++i ) {
            ySum = 0;
            barPosX = self.xScale(data[i].x) - barWidth / 2;
            for ( j = 0; j < data[i].ys.length; ++j ) {
              y = data[i].ys[j];
              ySum += y;
              barPosY = self.yScale(ySum);
              self.svg.select("rect.bar.index-" + i + ".subindex-" + j)
                .attr("height", self.yScale(0) - self.yScale(y))
                .attr("transform", "translate(" + barPosX + "," + barPosY + ")")
                .style("fill", d.colors[j]);
            }
          }
        }
      
     
  });
  
  // Event listeners: for dragging, optimization, code triggered rescaling
  if ( interactive ) {
    self.svg.selectAll("rect.bar").call(dragBarBehavior);
    d3.select("#optimizelink").on("click",rescaleToOptimized);
    $("#dragsimulate").on("customDragEvent",dragSimulator);
    $("#dragsimulate").on("resetLoadProfile", resetLoadProfile);
    
  }
  
  self.svg.selectAll("rect.bar")
    .on("mouseover", function() {
      var i = Number(d3.select(this).attr("data-index"));
      setOpacityFn(1.0)(i);
      if ( !draggingSomething ) {
        setCursorState("grab");
      }
    })
    .on("mouseout", function() {
      var i = Number(d3.select(this).attr("data-index"));
      setOpacityFn(0.9)(i);
      if ( !draggingSomething ) {
        setCursorState();
      }
    });


};

//
// Some utility functions
//


function pathFromArray(arr, callback) {
  var result = [];
  var N = arr.length;
  for ( var i = 0; i < N; ++i ) {
    result[i] = {x: i, y: arr[i]};
  }
  result.callback = function() {
    for ( var i = 0; i < N; ++i ) {
      arr[i] = result[i].y;
    }
    if ( callback ) {
      callback();
    }
  };
  return result;
}

// Cursor state for dragging UX
function setCursorState(state) {
  if ( !state ) {
    d3.select("html")
      .style("cursor", "");
  } else {
    d3.select("html")
      .style("cursor", "-moz-" + state)
      .style("cursor", "-webkit-" + state)
      .style("cursor", state);
  }
}

