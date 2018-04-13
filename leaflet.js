import * as d3 from 'd3';
/**
 * Leaflet Chart
 */

export default function (config, helper) {

  var Leaflet = Object.create(helper);

  Leaflet.init = function (config) {
    var vm = this;
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
          var found = vm._data.filter(o => o[vm._config.id] == geom.id)[0]
          if (found) 
            geom.properties[vm._config.fill] = found[vm._config.fill];
          vm._nodes.push(geom);
        });
      }
    } else if (objects) {
      vm._topojson.objects[objects].geometries.forEach(function (geom) {
        var found = vm._data.filter(o => o[vm._config.id] == geom.id)[0]
        if (found)
          geom.properties[vm._config.fill] = found[vm._config.fill];
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

  Leaflet.colors = function (colors) {
    var vm = this;
    vm._config.colors = colors;
    if (colors) {
      if (Array.isArray(colors)) {
        vm._scales.color = d3.scaleOrdinal().range(colors);
      } else if (typeof colors === 'function') {
        vm._scales.color = colors;
      }
    }
    return vm;
  }

  Leaflet.drawColorLegend = function () {
    var vm = this;
   
    //Define legend gradient
    var defs = d3.select('#' + vm._config.bindTo).select('svg.leaflet-zoom-animated').append('defs');

    var linearGradient = defs.append('linearGradient')
      .attr('id', 'linear-gradient-label');

    //Define direction for gradient. Default is vertical top-bottom.
    linearGradient
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    //Define color scheme as linear gradient
    var colorScale = d3.scaleLinear()
      .range(vm._config.colors);

    linearGradient.selectAll('stop') 
      .data(colorScale.range())                  
      .enter().append('stop')
      .attr('offset', function(d,i) { return i/(colorScale.range().length-1); })
      .attr('stop-color', function(d) { return d; });

    //Add gradient legend 
    //defaults to right position
    var legend = d3.select('#' + vm._config.bindTo).select('svg.leaflet-zoom-animated')
      .append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(' + (vm._config.size.width - 300 ) +',' + vm._config.size.height * .1 + ')');

    //legend title
    legend.append('text')
      .attr('x', 0)
      .attr('class', 'legend-title')
      .attr('text-anchor', 'middle')
      .text(vm._config.legendTitle);

    //top text is the max value
    legend.append('text')
      .attr('x', 0)
      .attr('y', '1.5em')
      .attr('class', 'top-label')
      .attr('text-anchor', 'middle')
      .text(function(){
        let max = Math.ceil(vm._minMax[1]);
        return max.toLocaleString();
      })

    //draw gradient
    legend.append('rect')
      .attr('x', -9)
      .attr('y', '2.3em')
      .attr('width', 18)
      .attr('height', vm._config.size.height * 0.6)
      .attr('fill', 'url(#linear-gradient-label)');

    //bottom text is the min value
    legend.append('text')
      .attr('x', 0)
      .attr('y', vm._config.size.height * 0.6 + 40)
      .attr('class', 'bottom-label')
      .attr('text-anchor', 'middle')
      .text(function(){ 
        let min = Math.floor(Math.min(vm._minMax[0]))
        return min.toLocaleString();
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

    var map = new L.Map(vm._config.bindTo, {
        center: new L.LatLng(LatLng.lat, LatLng.lon),
        zoom: vm._config.map.topojson.zoom || 7,
        maxZoom: 10,
        minZoom: 3
      }),
      OpenStreetMap_BlackAndWhite = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }),
      topoLayer = new L.TopoJSON(),
      $countryName = $('.country-name');

    OpenStreetMap_BlackAndWhite.addTo(map);
    addTopoData(vm._topojson)

    function addTopoData(topoData) {
      topoLayer.addData(topoData);
      topoLayer.addTo(map);
      topoLayer.eachLayer(handleLayer);
    }

    var tip = d3.tip().html(function(d) {
      let html = '<div class="d3-tip" style="z-index: 99999;"><span>' + (d.feature.properties.NOM_ENT || d.feature.properties.NOM_MUN) + '</span><br/><span>' +
        d3.format(',.1f')(d.feature.properties[vm._config.fill]) + '</span></div>';
      console.log(html);
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
      console.log(layer, d3.select(layer._path));
      tip.show(layer, d3.select(layer._path).node());
    }

    function leaveLayer(layer) {
      tip.hide(layer);
    }

    /**
     * Draw Legend
     */
    console.log(vm._nodes, vm);
    if (typeof vm._config.legend === 'function') {
      vm._config.legend.call(this, vm._nodes);
    }

    Leaflet.drawColorLegend();
    
    return vm
  }
  

  Leaflet.init(config);

  return Leaflet;
}
