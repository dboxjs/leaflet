/*
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
    if (colors && Array.isArray(colors)) {
      vm._scales.color.range(colors);
    } else if (typeof colors === 'function') {
      vm._scales.color = colors;
    }
    return vm;
  }

  //-------------------------------
  //Triggered by the chart.js;
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

    //vm._config.map.min = vm._minMax[0];
    //vm._config.map.max = vm._minMax[1];
    return vm
  }

  Leaflet.scales = function () {
    var vm = this;
    return vm
  }

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

    var map = new L.Map(vm._config.bindTo, {
        center: new L.LatLng(25.5629994, -100.6405644),
        zoom: 7,
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
          mouseover: enterLayer,
          mouseout: leaveLayer
        });
      }
    }

    function enterLayer() {
      console.log(layer, this);
    }

    function leaveLayer() {

    }

    /**
     * Draw Legend
     */
    console.log(vm._nodes, vm);
    if (typeof vm._config.legend === 'function') {
      vm._config.legend.call(this, vm._nodes);
    }

    
    return vm
  }

  Leaflet.init(config);

  return Leaflet;
}
