import * as d3 from 'd3';
/**
 * Leaflet Chart
 */

export default function (config, helper) {

  var Leaflet = Object.create(helper);

  Leaflet.init = function (config) {
    const vm = this;
    vm._config = config ? config : {};
    vm._scales = {};
    vm._axes = {};
    vm._data = [];

    vm._scales.color = d3.scaleQuantize().range(["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"
    ]);
  }

  Leaflet.id = function (col) {
    var vm = this;
    vm._config.id = col;
    return vm;
  }

  Leaflet.fill = function (col) {
    var vm = this;
    vm._config.fill = col;
    return vm
  }

  Leaflet.opacity = function (value) {
    var vm = this;
    vm._config.opacity = value;
    return vm;
  }

  Leaflet.colors = function (colors) {
    var vm = this;
    vm._config.colors = colors;
    if (colors && Array.isArray(colors)) {
      vm._scales.color.range(colors);
    } else if (typeof colors === 'function') {
      vm._scales.color = colors;
    }
    return vm;
  }

  Leaflet.colorLegend = function (legendTitle) {
    var vm = this;
    vm._config.legendTitle = legendTitle;
    return vm;
  };

  // -------------------------------
  // Triggered by chart.js;
  Leaflet.data = function (data) {
    var vm = this;

    vm._topojson = data[1] ? data[1] : false; //Topojson
    data = data[0]; //User data

    console.log(vm._topojson);
    if (vm._config.data.filter) {
      data = data.filter(vm._config.data.filter);
    }

    vm._data = data;
    //vm._quantiles = vm._setQuantile(data);
    vm._minMax = d3.extent(data, function(d) { return +d[vm._config.fill]; })

    vm._scales.color.domain(vm._minMax);

    var objects = vm._config.map.topojson.objects;

    vm._nodes = [];
    if (Array.isArray(objects)) {
      for (let idx = 0; idx < objects.length; idx++) {
        const obj = objects[idx];
        vm._topojson.objects[obj].geometries.forEach(function (geom) {
          geom.id = vm._config.map.topojson.parser(geom);
          var found = vm._data.filter(o => o[vm._config.id] == geom.id)[0];
          if (found) {
            geom.properties[vm._config.fill] = found[vm._config.fill];
          }
          vm._nodes.push(geom);
        });
      }
    } else if (objects) {
      vm._topojson.objects[objects].geometries.forEach(function (geom) {
        geom.id = vm._config.map.topojson.parser(geom);
        var found = vm._data.filter(o => o[vm._config.id] == geom.id)[0];
        if (found) {
          geom.properties[vm._config.fill] = found[vm._config.fill];
        }
        vm._nodes.push(geom);
      });
    }

    // vm._config.map.min = vm._minMax[0];
    // vm._config.map.max = vm._minMax[1];
    return vm
  }

  Leaflet.scales = function () {
    var vm = this;
    return vm
  }

  Leaflet.drawColorLegend = function () {
    var vm = this;
    
    var range = vm._scales.color.range().length;
    var step = (vm._minMax[1] - vm._minMax[0]) / (range - 1);
    var domain = vm._config.colors;

    var quantilePosition = d3.scaleBand().rangeRound([vm._config.size.height * 0.8, 0]).domain(domain);
    //Add gradient legend 
    //defaults to right position
    var legend = d3.select('#' + vm._config.bindTo)
      .append('svg')
        .attr('width', 100)
        .attr('height', vm._config.size.height)
        .style('z-index', 401)
        .style('position', 'absolute')
        .style('top', '4px')
        .style('right', '2px')
      .append('g')
      .attr('class', 'legend quantized')
      .attr('transform', 'translate(50,25)');
    
    // legend background
    legend.append('rect')
      .attr('x', -50)
      .attr('y', -35)
      .attr('width', 100)
      .attr('height', vm._config.size.height - 10)
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('class', 'legend-background')
      .attr('fill', 'rgba(255,255,255,0.6)');
    
      // legend title
    legend.append('text')
      .attr('x', 0)
      .attr('y', -12)
      .attr('class', 'legend-title')
      .attr('text-anchor', 'middle')
      .text(vm._config.legendTitle);

    console.log(domain);

    var quantiles = legend.selectAll('.quantile')
      .data(vm._config.colors)
      .enter()
      .append('g')
      .attr('class', 'quantile')
      .attr('transform', function(d) {
        return 'translate(-20, ' + quantilePosition(d)
         + ')';
      })

    // Rect
    quantiles.append('rect')
      .attr('x', -10)
      .attr('y', 0)
      .attr('width', 18)
      .attr('height', quantilePosition.bandwidth())
      .attr('fill', function (d) {
        return d;
      });
    

    //top text is the max value
    quantiles.append('text')
      .attr('x', 17)
      .attr('y', 5)
      .attr('class', 'top-label')
      .attr('text-anchor', 'left')
      .text(function(d){
        let max = (vm._scales.color.invertExtent(d)[1]);
        if (vm._config.legendTitle === 'Porcentaje' && max > 100) {
          max = 100;
        }
        return vm.utils.format(max);
      });

    //bottom text is the min value
    quantiles.append('text')
      .attr('x', 17)
      .attr('y', vm._config.size.height / 5 - 11)
      .attr('class', 'bottom-label')
      .attr('text-anchor', 'left')
      .text(function(d, i){
        if (i === 0) {
          let min = (vm._scales.color.invertExtent(d)[0]);
          return vm.utils.format(min);
        } else {
          return '';
        }
      });
  };

  Leaflet.draw = function () {
    var vm = this;

    var urlTopojson = vm._config.map.topojson.url;
    var objects = vm._config.map.topojson.objects; //'states'
    var tran = vm._config.map.topojson.translate; //var tran = [2580, 700];
    var scale = vm._config.map.topojson.scale; //1300
    var parser = vm._config.map.topojson.parser;
    var id = vm._config.map.topojson.id;

    L.TopoJSON = L.GeoJSON.extend({
      addData: function (jsonData) {
        var geojson, key;
        if (jsonData.type === 'Topology') {
          if (objects) {
            if (Array.isArray(objects)) {
              for (let idx = 0; idx < objects.length; idx++) {
                const obj = objects[idx];
                geojson = topojson.feature(jsonData, jsonData.objects[obj]);
                L.GeoJSON.prototype.addData.call(this, geojson);
              }
            } else {
              geojson = topojson.feature(jsonData, jsonData.objects[objects]);
              L.GeoJSON.prototype.addData.call(this, geojson);
            }
          } else {
            for (key in jsonData.objects) {
              geojson = topojson.feature(jsonData, jsonData.objects[key]);
              L.GeoJSON.prototype.addData.call(this, geojson);
            }
          }
        } else {
          L.GeoJSON.prototype.addData.call(this, jsonData);
        }
      }
    });

    var LatLng = {
      lat: 25.5629994, 
      lon: -100.6405644
    }
    if (vm._config.map.topojson.center && vm._config.map.topojson.center.length === 2) {
      LatLng.lat = vm._config.map.topojson.center[0]
      LatLng.lon = vm._config.map.topojson.center[1]
    }

    var bounds = new L.LatLngBounds(new L.LatLng(LatLng.lat + 5, LatLng.lon - 5), new L.LatLng(LatLng.lat - 5, LatLng.lon + 5));

    vm._map = new L.Map(vm._config.bindTo, {
        center: bounds.getCenter(),
        zoom: vm._config.map.topojson.zoom || 7,
        maxZoom: vm._config.map.topojson.maxZoom || 10,
        minZoom: vm._config.map.topojson.minZoom || 3,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0
      }),
      OpenStreetMap_BlackAndWhite = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }),
      topoLayer = new L.TopoJSON();
    
    OpenStreetMap_BlackAndWhite.addTo(vm._map);
    addTopoData(vm._topojson)

    function addTopoData(topoData) {
      topoLayer.addData(topoData);
      topoLayer.addTo(vm._map);
      topoLayer.eachLayer(handleLayer);
    }

    var tip = vm.utils.d3.tip().html(vm._config.tip || function(d) {
      let html = '<div class="d3-tip" style="z-index: 99999;"><span>' + (d.feature.properties.NOM_ENT || d.feature.properties.NOM_MUN) + '</span><br/><span>' +
        vm.utils.format(d.feature.properties[vm._config.fill]) + '</span></div>';
      return html;
    })
    d3.select('#' + vm._config.bindTo).select('svg.leaflet-zoom-animated').call(tip);
    function handleLayer(layer) {
      
      var value = layer.feature.properties[vm._config.fill];
      if (!value) {
        // Remove polygons without data
        /** @todo validate what to do with NA's */
        d3.select(layer._path).remove();
      } else {
        var fillColor = vm._scales.color(value);
        
        layer.setStyle({
          fillColor: fillColor,
          fillOpacity: vm._config.opacity || 0.7,
          color: '#555',
          weight: 1,
          opacity: .5
        });

        layer.on({
          mouseover: function() {
            enterLayer(layer)
          },
          mouseout: function() {
            leaveLayer(layer);
          }
        });
      }
    }

    function enterLayer(layer) {
      tip.show(layer, d3.select(layer._path).node());
    }

    function leaveLayer(layer) {
      tip.hide(layer);
    }

    /**
     * Draw Legend
     */
    if (typeof vm._config.legend === 'function') {
      vm._config.legend.call(this, vm._nodes);
    }

    Leaflet.drawColorLegend();
    
    return vm
  }
  

  Leaflet.init(config);

  return Leaflet;
}
