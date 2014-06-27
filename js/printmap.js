dojo.require("esri.map");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.tasks.geometry");
dojo.require("esri.utils");

var window_opener = window.opener;
var tempPushPinLayer = 'tempPushPinLayer';
var tempBuffer = 'tempBuffer';
var tempRouteLayer = 'tempRouteLayer';
var tempHighlightedLayer = 'tempHighlightedLayer';
var printmap;
var routeLayer;
var initialExtent;
var graphicsLayer;
var directions;
var directionsHeader;
var highlightedLayer;
var symbol;

function Init() {
	
	graphicsLayer = window_opener.GetGraphicsLayer();
	
	routeLayer = window_opener.GetRouteLayer();
	directions = window_opener.GetDrivingDirections();
	directionsHeader = window_opener.GetDirectionsHeader();
	highlightedLayer = window_opener.GetHighlightedPollLayer();
	headerstr = window_opener.GetHeader();
	printmap = new esri.Map("mapPrint", { slider: false });
	
	/*Code for adding basemap layers to print*/
	//var layerUrl = window_opener.GetLayerUrl();
	//var baseMapLayer = new esri.layers.ArcGISTiledMapServiceLayer(layerUrl);
	//
	// Hardcoded the topomap  just to get it to work
	var baseMapLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");
	printmap.addLayer(baseMapLayer);

	/*Code for getting feature layer*/
	parksLayer = window_opener.GetParksLayer();
	var parksFeatureLayer = new esri.layers.FeatureLayer(parksLayer, {
		mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
		outFields: ["*"]
	});
	printmap.addLayer(parksFeatureLayer);

	dojo.connect(parksFeatureLayer, "onUpdateEnd", MapRenderComplete);
	dojo.connect(printmap, "onLoad", function () {
		printmap.disablePan();
		printmap.disableDoubleClickZoom();
		printmap.disableKeyboardNavigation();
		printmap.disableScrollWheelZoom();
		printmap.disableMapNavigation();

		var extent = null;
		var gLayer = new esri.layers.GraphicsLayer();
		gLayer.id = tempRouteLayer;
		printmap.addLayer(gLayer);
		var symbol;
		for (var i = 0; i < routeLayer.graphics.length; i++) {
			symbol = new esri.symbol.SimpleLineSymbol().setColor(routeLayer.graphics[i].symbol.color).setWidth(routeLayer.graphics[i].symbol.width);

			var polyLine = new esri.geometry.Polyline(routeLayer.graphics[i].geometry.toJson());
			AddGraphic(gLayer, symbol, polyLine);
			if (extent) {
				extent = extent.union(polyLine.getExtent());
			}
			else {
				extent = polyLine.getExtent();
			}
		}

		printmap.setExtent(extent.expand(2));

		var gLayer = new esri.layers.GraphicsLayer();
		gLayer.id = tempPushPinLayer;
		printmap.addLayer(gLayer);
		for (var k = 0; k < graphicsLayer.graphics.length; k++) {
			var mapPoint = new esri.geometry.Point(graphicsLayer.graphics[k].geometry.x, graphicsLayer.graphics[k].geometry.y, printmap.spatialReference);
			symbol = new esri.symbol.PictureMarkerSymbol(graphicsLayer.graphics[k].symbol.url, 25, 25);
			AddGraphic(gLayer, symbol, mapPoint);
		}

		var gLayer = new esri.layers.GraphicsLayer();
		gLayer.id = tempHighlightedLayer;
		printmap.addLayer(gLayer);
		for (var j = 0; j < highlightedLayer.graphics.length; j++) {
			var mapPoint = new esri.geometry.Point(highlightedLayer.graphics[j].geometry.x, highlightedLayer.graphics[j].geometry.y, printmap.spatialReference);
			symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, highlightedLayer.graphics[j].symbol.size, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color(highlightedLayer.graphics[j].symbol.outline.color), 4), new dojo.Color([0, 0, 0, 0]));
			AddGraphic(gLayer, symbol, mapPoint);
		}

		//dojo.byId("tdParkName").innerHTML = window_opener.document.getElementById("spanDirectionNameFireStation").getAttribute("parkName");
		dojo.byId("tdParkName").innerHTML = headerstr;
		RemoveChildren(dojo.byId("tblDirections"));
		var tbody = dojo.create("tbody", {}, dojo.byId("tblDirections"));

		var trHeader = dojo.create("tr", {}, tbody);
		trHeader.style.height = "30px";
		for (var i = 0; i < directionsHeader.length; i++) {
			var tdHeader = dojo.create("td", {}, trHeader);
			if (i == 1) {
				tdHeader.align = "right";
			}
			tdHeader.innerHTML = directionsHeader[i];
		}
		
		for (var i in directions) {
			
			var tr = dojo.create("tr", {}, tbody);
			tr.style.height = "30px";
			if (i % 2 == 0) {
				tr.style.backgroundColor = "gray";
			}
			var td = dojo.create("td", {}, tr);
			td.align = "left";
			var tdMiles = dojo.create("td", {}, tr);
			tdMiles.align = "right";
			td.innerHTML = (Number(i) + 1) + ". " + directions[i].text;
			tdMiles.innerHTML = (directions[i].distance) ? directions[i].distance : "";
		}
	});


}

function MapRenderComplete() {
	setTimeout(function () {
		window.print();
	}, 500);
}

dojo.addOnLoad(Init);
