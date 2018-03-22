/*
 * Leaflet Chart
 */

export default function(config,helper) {

  var Leaflet = Object.create(helper);

  Leaflet.init = function (config){
    var vm = this;
    vm._config = config ? config : {};
    vm._scales ={};
    vm._axes = {};    
    vm._data = [];
  }

  Leaflet.id = function(col) {
    var vm = this;
    vm._config.id = col;
    return vm;
  }


  //-------------------------------
  //Triggered by the chart.js;
  Leaflet.data = function(data){
    var vm = this; 

    vm._topojson = data[1]? data[1] : false ; //Topojson
    data = data[0]; //User data

    if(vm._config.data.filter){
      data = data.filter(vm._config.data.filter);
    }
  
    vm._data = data;
    //vm._quantiles = vm._setQuantile(data);
    //vm._minMax = d3.extent(data, function(d) { return +d[vm._config.color]; })

    //vm._config.map.min = vm._minMax[0];
    //vm._config.map.max = vm._minMax[1];
    return vm
  }

  Leaflet.scales = function(){
    var vm = this; 
    return vm
  }
  
  Leaflet.draw = function(){
    var vm = this; 

    var urlTopojson = vm._config.map.topojson.url;
    var objects = vm._config.map.topojson.objects; //'states'
    var tran = vm._config.map.topojson.translate; //var tran = [2580, 700];
    var scale = vm._config.map.topojson.scale; //1300
    var parser = vm._config.map.topojson.parser;
    var id = vm._config.map.topojson.id;
                
    L.TopoJSON = L.GeoJSON.extend({  
      addData: function(jsonData) {     
        var geojson, key;
        if (jsonData.type === 'Topology') {
          if(objects){
              geojson = topojson.feature(jsonData, jsonData.objects[objects]);
              L.GeoJSON.prototype.addData.call(this, geojson);
          }else{
            for (key in jsonData.objects) {
              geojson = topojson.feature(jsonData, jsonData.objects[key]);
              L.GeoJSON.prototype.addData.call(this, geojson);
            }
          }
         
        }    
        else {
          L.GeoJSON.prototype.addData.call(this, jsonData);
        }
      }  
    });

    var map = new L.Map(vm._config.bindTo, {center: new L.LatLng(22.2970632,-101.8634038),zoom:5,maxZoom:10,minZoom:3}),
        OpenStreetMap_BlackAndWhite = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', 
                                                      { 
                                                        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                      }
                                                    ),
        topoLayer = new L.TopoJSON(),
        $countryName = $('.country-name');
    
    OpenStreetMap_BlackAndWhite.addTo(map);
    addTopoData(vm._topojson)

    function addTopoData(topoData){
      topoLayer.addData(topoData);
      topoLayer.addTo(map);
      topoLayer.eachLayer(handleLayer);
    }

    function handleLayer(layer){
        var randomValue = Math.random(),
          fillColor = '#ff0000'; //colorScale(randomValue).hex();
          
        layer.setStyle({
          fillColor : fillColor,
          fillOpacity: 1,
          color:'#555',
          weight:1,
          opacity:.5
        });

        layer.on({
          mouseover : enterLayer,
          mouseout: leaveLayer
        });
    }

    function enterLayer(){
      
    }

    function leaveLayer(){
      
    }

    return vm
  }



  Leaflet.init(config);

  return Leaflet;
}
  