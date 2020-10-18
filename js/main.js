//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = .00005;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area / Math.PI);
    return radius;
    
}
var map = null
function createMap() {
    var map = L.map('map', {
        center: [13.7563, 100.5018],
        zoom: 5,
        minZoom: 5
    });
    
    L.tileLayer(
        'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        }).addTo(map);
    
    
    getData(map);
    
}

var layer = null
var geojsonMarkerOptions = null
function pointToLayer(feature, latlng, attributes) {
    var rangeIndex = $('.range-slider').val();
    var NumberIndex = Number(rangeIndex)
    var attribute = attributes[NumberIndex];
//create marker options
    var geojsonMarkerOptions = {
        radius: 2,
        fillColor: "#ff0000",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    
    var attributeValue = feature.properties[attribute];
    var replacedString = attributeValue.replace(/[,]/g, '');
    attributeValue = Number(replacedString)

    geojsonMarkerOptions.radius = calcPropRadius(attributeValue);

    var layer = L.circleMarker(latlng, geojsonMarkerOptions);

    //1-2 Lesson has more examples of popup formatting here
    var popupContent = "<p><b>City:</b> " + feature.properties.CityName + "</p><p><b>" + attribute + ":</b> " + feature.properties[attribute] + "</p>";

    layer.bindPopup(popupContent, {
        offset: new L.Point(0, -geojsonMarkerOptions.radius)
    });

    layer.on({
        mouseover: function () {
            this.openPopup();
        },
        mouseout: function() {
            this.closePopup();
        },
        click: function() {
            var index = $('.range-slider').val();
        }

    });

    return layer;
}

function createSymbols(data, map, attributes) {
    globalData = L.geoJSON(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);   
        }
    }).addTo(map)

}

function processData(data){
    var attributes=[];
    
    var properties = data.features[0].properties;
    
    for (var attribute in properties){
        if (attribute.indexOf("Pop") > -1){
            attributes.push(attribute);
        }
    }
    
    return attributes;
    
}


function createSequenceControls(map,attributes,data) {
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        
        onAdd: function(map){
            var container = L.DomUtil.create('div', 'sequence-control-container')
            
            $(container).append('<input class="range-slider" type ="range">')
            
            $(container).append('<button class="skip" id="reverse">Reverse</button');
            $(container).append('<button class="skip" id="forward">Forward</button');
            $(container).append('<button class="filter" id="filter">Filter</button');
            $(container).append('<input type="number" id="myNumber" value="0">')
            $(container).append('<button class="clear" id="clear">Reset Filters</button');
            
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            })
            
            
            return container;
        }
    })
    
    map.addControl( new SequenceControl())
    
    //create slider
//    $('#slider').append('<input class="range-slider" type="range">');
    
    $('.range-slider').attr({
        max: 10,
        min: 0,
        value: 3,
        step: 1
    });
    
//    $('#slider').append('<button class="skip" id="reverse">Forward</button');
//    $('#slider').append('<button class="skip" id="forward">Reverse</button');
//    $('#slider').append('<button class="filter" id="filter">Filter</button');
//    $('#slider').append('<button class="clear" id="clear">Reset</button');
    
    $('.skip').click(function(){
        var index = $('.range-slider').val();
        
        if ($(this).attr('id') == 'forward'){
            index++
            
        index = index > 10 ? 0 : index
        } else if ($(this).attr('id') == 'reverse'){
            index--
            
            index = index , 0 ? 10 : index;
        }
        $('.range-slider').val(index);
        updateSymbols(map,attributes[index]);
        updateLegend(map, attributes[index])
    })
    
    $('.range-slider').on('input', function(){
        var index = $(this).val();
        
        updateSymbols(map,attributes[index]);
        updateLegend(map, attributes[index])
    })
    
    $('.filter').click(function(){
        var userNumber = Number(document.getElementById("myNumber").value);
        var rangeIndex = $('.range-slider').val();
        var NumberIndex = Number(rangeIndex)
        map.removeLayer(globalData)
        $.getJSON("data/map.geojson", function(data){
            globalData = L.geoJSON(data,{
                onEachFeature: function (feature, layer){
                    layer.bindPopup(feature.properties.CityName)
                },
                filter: function(feature,layer){
                    populationAttributes = processData(data)
                    var searchAttribute = populationAttributes[NumberIndex]
                    console.log("search Attribute:" + searchAttribute)
                    //this needs to be the name of the attribute corresponding to the searchattribute
                    var rawString = feature.properties[searchAttribute]
                    console.log(rawString + ":" + searchAttribute)
                    var replacedString = rawString.replace(/[,]/g, '');
                    console.log(replacedString)
                    var convertedValue = Number(replacedString)
                    console.log(convertedValue)
                    if (convertedValue > userNumber){
                        console.log("success")
                        return feature
                    } else{
                        console.log("feature not added")
                    }
                },
                pointToLayer: function(feature, latlng){
                    return pointToLayer(feature, latlng, attributes);   
                }
            }).addTo(map)
            var index = $('.range-slider').val();
            updateSymbols(map,attributes[index])
        })
            
    })
    //end of filter button
    
    $('.clear').click(function(){
     location.reload()   
    })  
    
}

function convertStringToNumber(string)  {
    var replacedString = string.replace(/[,]/g, '');
    var convertedValue = Number(replacedString)
    return convertedValue
}

function updateSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            var props = layer.feature.properties;
            
            var convertedValue = convertStringToNumber(props[attribute])
            
            var radius = calcPropRadius(convertedValue)
            
            var convertedRadius = Number(radius)
            
            layer.setRadius(convertedRadius)
            var popupContent = "<p><b>City:</b> " + props.CityName + "</p>";
            
            var year = attribute.split("n")[1];
        
            popupContent += "</p><p><b>Population in " + year + ":</b> " + props[attribute] + "</p>";
            
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,3)
            })
            
        }
        
    })
    
    updateLegend(map, attribute)
}

function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        
        onAdd: function(map){
            var container = L.DomUtil.create('div', 'legend-control-container')
            
            $(container).append('<div id="temporal-legend">')
            $(container).append('<div id="attribute-legend">')
            
            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="180px" height="80px">'
            
            var circles = {
                max: 20,
                mean: 40,
                min: 60
            }
            
            for (var circle in circles){
                //circle string
                svg += '<circle class="legend-circle" id="' + circle + '" fill="#ff0000" fill-opacity="0.8" stroke="#000000" cx="30"/>'
                
                svg+= '<text id="' + circle + '-text" x="60" y="' + circles[circle] + '"></text>'
            };
            
            svg += "</svg>";

            //add attribute legend svg to container
            $(container).append(svg);
            return container;
        }
    })
    
    map.addControl(new LegendControl());
    
    updateLegend(map, attributes[3])
}

function updateLegend(map, attribute){
    //create content for legend
    var year = attribute.split("n")[1];
    var content = "Population in " + year;

    //replace legend content
    $('#temporal-legend').html(content);
    
    var circleValues = getCircleValues(map, attribute)
    
    for (var key in circleValues){
        var radius = calcPropRadius(circleValues[key])
        
        $('#'+key).attr({
            cy: 60 - radius,
            r: radius
        })
        $('#'+key+'-text').text(Math.round(circleValues[key]) + " people")
    }
};

function getCircleValues(map, attribute){
    var min = Infinity
    var max = -Infinity
    
    map.eachLayer(function(layer){
        if (layer.feature){
            var attributeValue = layer.feature.properties[attribute]
            attributeValue = convertStringToNumber(attributeValue)
            
            if (attributeValue < min){
                min = attributeValue
            }
            
            if (attributeValue > max){
                max = attributeValue
            }
        }
    })
    
    var mean = (max + min) / 2;
    return {
        max: max,
        mean: mean,
        min: min
    }
}

var globalJSON = null
var globalData = null 
function getData(map) {
    globalJSON = $.ajax("data/map.geojson",{
        dataType: "json",
        success: function (response) {
            var attributes = processData(response);
            
            createSequenceControls(map, attributes,response);
            createLegend(map, attributes)
            createSymbols(response, map, attributes);
            updateLegend(map, attributes[3])
            
        }
    });
}

$(document).ready(createMap)