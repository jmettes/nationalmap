"use strict";

/*global require*/

var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var getElement = require('../../third_party/cesium/Source/Widgets/getElement');

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var GeoDataBrowserViewModel = require('./GeoDataBrowserViewModel');

var GeoDataBrowser = function(options) {
    var container = getElement(options.container);

    this._viewModel = new GeoDataBrowserViewModel({
        viewer : options.viewer,
        map : options.map,
        //initUrl: options.initUrl,
        mode3d: options.mode3d,
        catalog: options.catalog
    });

    this._viewModel._checkboxChecked = 'M29.548,3.043c-1.081-0.859-2.651-0.679-3.513,0.401L16,16.066l-3.508-4.414c-0.859-1.081-2.431-1.26-3.513-0.401c-1.081,0.859-1.261,2.432-0.401,3.513l5.465,6.875c0.474,0.598,1.195,0.944,1.957,0.944c0.762,0,1.482-0.349,1.957-0.944L29.949,6.556C30.809,5.475,30.629,3.902,29.548,3.043zM24.5,24.5h-17v-17h12.756l2.385-3H6C5.171,4.5,4.5,5.171,4.5,6v20c0,0.828,0.671,1.5,1.5,1.5h20c0.828,0,1.5-0.672,1.5-1.5V12.851l-3,3.773V24.5z';
    this._viewModel._checkboxUnchecked = 'M26,27.5H6c-0.829,0-1.5-0.672-1.5-1.5V6c0-0.829,0.671-1.5,1.5-1.5h20c0.828,0,1.5,0.671,1.5,1.5v20C27.5,26.828,26.828,27.5,26,27.5zM7.5,24.5h17v-17h-17V24.5z';
    this._viewModel._arrowDown = 'M8.037,11.166L14.5,22.359c0.825,1.43,2.175,1.43,3,0l6.463-11.194c0.826-1.429,0.15-2.598-1.5-2.598H9.537C7.886,8.568,7.211,9.737,8.037,11.166z';
    this._viewModel._arrowRight = 'M11.166,23.963L22.359,17.5c1.43-0.824,1.43-2.175,0-3L11.166,8.037c-1.429-0.826-2.598-0.15-2.598,1.5v12.926C8.568,24.113,9.737,24.789,11.166,23.963z';

    var wrapper = document.createElement('div');
    container.appendChild(wrapper);

    var dataButton = document.createElement('div');
    dataButton.className = 'ausglobe-panel-button';
    dataButton.title = 'Data';
    dataButton.innerHTML = '<div class="ausglobe-panel-button-label">Data</div>';
    dataButton.setAttribute('data-bind', 'click: toggleShowingDataPanel, css { "ausglobe-panel-button-panel-visible": showingDataPanel }');
    wrapper.appendChild(dataButton);

    var mapButton = document.createElement('div');
    mapButton.className = 'ausglobe-panel-button';
    mapButton.title = 'Map';
    mapButton.innerHTML = '<div class="ausglobe-panel-button-label">Maps</div>';
    mapButton.setAttribute('data-bind', 'click: toggleShowingMapPanel, css { "ausglobe-panel-button-panel-visible": showingMapPanel }');
    wrapper.appendChild(mapButton);

    var legendButton = document.createElement('div');
    legendButton.className = 'ausglobe-panel-button';
    legendButton.title = 'Legend';
    legendButton.innerHTML = '<div class="ausglobe-panel-button-label">Legend</div>';
    legendButton.setAttribute('data-bind', 'click: toggleShowingLegendPanel, css { "ausglobe-panel-button-panel-visible": showingLegendPanel }');
    wrapper.appendChild(legendButton);

    var populateEnabledButton = document.createElement('div');
    populateEnabledButton.className = 'ausglobe-panel-button';
    populateEnabledButton.title = 'Populate cache for data sources that are enabled';
    populateEnabledButton.innerHTML = '<div class="ausglobe-panel-button-label">Enabled</div>';
    populateEnabledButton.setAttribute('data-bind', 'visible: showPopulateCache(), click: function() { populateCache("enabled"); }');
    wrapper.appendChild(populateEnabledButton);

    var populateOpenButton = document.createElement('div');
    populateOpenButton.className = 'ausglobe-panel-button';
    populateOpenButton.title = 'Populate cache for data sources that are in open data panel categories';
    populateOpenButton.innerHTML = '<div class="ausglobe-panel-button-label">Opened</div>';
    populateOpenButton.setAttribute('data-bind', 'visible: showPopulateCache(), click: function() { populateCache("opened"); }');
    wrapper.appendChild(populateOpenButton);

    var maxLevel = document.createElement('div');
    maxLevel.className = 'ausglobe-panel-button';
    maxLevel.title = 'Maximum tile level';
    maxLevel.innerHTML = '<input class="ausglobe-wfs-url-input" type="text" data-bind="value: maxLevel" />';
    maxLevel.setAttribute('data-bind', 'visible: showPopulateCache()');
    wrapper.appendChild(maxLevel);

    var dataPanel = document.createElement('div');
    dataPanel.id = 'ausglobe-data-panel';
    dataPanel.className = 'ausglobe-panel';
    dataPanel.setAttribute('data-bind', 'css: { "ausglobe-panel-visible" : showingDataPanel }');

    dataPanel.innerHTML = '\
        <div class="ausglobe-now-viewing ausglobe-accordion-item" data-bind="with: nowViewing">\
            <div class="ausglobe-accordion-item-header" data-bind="click: toggleOpen">\
                <div class="ausglobe-accordion-item-header-label">Now Viewing</div>\
                <div class="ausglobe-now-viewing-clear-all" data-bind="click: removeAll, clickBubble: false">Clear all</div>\
            </div>\
            <div class="ausglobe-accordion-item-content" data-bind="css: { \'ausglobe-accordion-item-content-visible\': isOpen }">\
                <div class="ausglobe-accordion-category">\
                    <div class="ausglobe-accordion-category-content ausglobe-accordion-category-content-visible" data-bind="visible: hasItems, foreach: items">\
                        <div class="ausglobe-accordion-category-item" data-bind="attr : { draggable: supportsReordering, title : name, nowViewingIndex : $index }, css: { \'ausglobe-accordion-category-item-enabled\': isShown }, event : { dragstart: $root.nowViewingDragStart.bind($root), dragenter: $root.nowViewingDragEnter.bind($root), dragend: $root.nowViewingDragEnd.bind($root) }">\
                            <img class="ausglobe-nowViewing-dragHandle" data-bind="visible: supportsReordering" draggable="false" src="images/Reorder.svg" width="12" height="24" alt="Drag to reorder data sources." title="Drag to reorder data sources." />\
                            <div class="ausglobe-accordion-category-item-checkbox" data-bind="click: toggleShown, cesiumSvgPath: { path: isShown ? $root._checkboxChecked : $root._checkboxUnchecked, width: 32, height: 32 }"></div>\
                            <div class="ausglobe-accordion-category-item-label" data-bind="text: name, click: zoomToAndUseClock"></div>\
                            <div class="ausglobe-accordion-category-item-infoButton" data-bind="click: $root.showInfoForItem">info</div>\
                        </div>\
                    </div>\
                    <div class="ausglobe-accordion-category-content ausglobe-accordion-category-content-visible" data-bind="visible: !hasItems">\
                        <div class="ausglobe-now-viewing-no-data">\
                            Add data from the collections below.\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </div>\
        <div class="ausglobe-data-panel-bottom">\
            <div data-bind="foreach: catalog.group.items">\
                <div class="ausglobe-accordion-item">\
                    <div class="ausglobe-accordion-item-header" data-bind="click: toggleOpen">\
                        <div class="ausglobe-accordion-item-header-label" data-bind="text: name"></div>\
                    </div>\
                    <div class="ausglobe-accordion-item-content ausglobe-accordion-item-content-visible ausglobe-accordion-category-item-label" data-bind="visible: isOpen && isLoading">Loading...</div>\
                    <div class="ausglobe-accordion-item-content" data-bind="foreach: items, css: { \'ausglobe-accordion-item-content-visible\': isOpen }">\
                        <div class="ausglobe-accordion-category">\
                            <div class="ausglobe-accordion-category-header" data-bind="click: toggleOpen">\
                                <div class="ausglobe-accordion-category-header-arrow" data-bind="cesiumSvgPath: { path: isOpen ? $root._arrowDown : $root._arrowRight, width: 32, height: 32 }"></div>\
                                <div class="ausglobe-accordion-category-header-label" data-bind="text: name"></div>\
                            </div>\
                            <div class="ausglobe-accordion-category-loading" data-bind="visible: isOpen && isLoading">Loading...</div>\
                            <div class="ausglobe-accordion-category-loading" data-bind="visible: isOpen && !isLoading && items.length === 0">This group does not contain any data sources.</div>\
                            <div class="ausglobe-accordion-category-content" data-bind="foreach: items, css: { \'ausglobe-accordion-category-content-visible\': isOpen }">\
                                <div class="ausglobe-accordion-category-item" data-bind="css: { \'ausglobe-accordion-category-item-enabled\': isEnabled }">\
                                    <div class="ausglobe-accordion-category-item-checkbox" data-bind="click: toggleEnabled, cesiumSvgPath: { path: isEnabled ? $root._checkboxChecked : $root._checkboxUnchecked, width: 32, height: 32 }"></div>\
                                    <div class="ausglobe-accordion-category-item-label" data-bind="text: name, click: zoomToAndUseClock"></div>\
                                    <div class="ausglobe-accordion-category-item-infoButton" data-bind="click: $root.showInfoForItem">info</div>\
                                </div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
            <div class="ausglobe-accordion-item">\
                <div class="ausglobe-accordion-item-header" data-bind="click: openAddData">\
                    <div class="ausglobe-accordion-item-header-label">Add Data</div>\
                </div>\
                <div class="ausglobe-accordion-item-content" data-bind="css: { \'ausglobe-accordion-item-content-visible\': addDataIsOpen }">\
                    <div class="ausglobe-accordion-category">\
                        <div class="ausglobe-add-data-message">\
                            Add data by dragging and dropping it onto the map, or\
                            <span class="ausglobe-upload-file-button" data-bind="click: selectFileToUpload">browse to select</span> a file to upload.\
                            <input type="file" style="display: none;" id="uploadFile" data-bind="event: { change: addUploadedFile }"/>\
                        </div>\
                        <form class="ausglobe-user-service-form" data-bind="submit: addDataOrService">\
                            <label>\
                                <div>Enter a web link to add a data file or WMS/WFS service (advanced):</div>\
                                <input class="ausglobe-wfs-url-input" type="text" data-bind="value: addDataUrl" />\
                            </label>\
                            <div>\
                                <label class="ausglobe-addData-type">\
                                    <select class="ausglobe-addData-typeSelect" data-bind="value: addType">\
                                        <option value="NotSpecified">Select file or service type</option>\
                                        <option value="File">Single data file</option>\
                                        <option value="wms-getCapabilities">WMS Server</option>\
                                        <option value="wfs-getCapabilities">WFS Server</option>\
                                    </select>\
                                </label>\
                                <input class="ausglobe-button" type="submit" value="Add" />\
                            </div>\
                        </form>\
                    </div>\
                </div>\
            </div>\
        </div>';

    wrapper.appendChild(dataPanel);

    var mapPanel = document.createElement('div');
    mapPanel.className = 'ausglobe-panel';
    mapPanel.setAttribute('data-bind', 'css: { "ausglobe-panel-visible" : showingMapPanel }');

    mapPanel.innerHTML = '\
        <div class="ausglobe-accordion-item">\
            <div class="ausglobe-accordion-item-header" data-bind="click: openImagery">\
                <div class="ausglobe-accordion-item-header-label">Imagery</div>\
            </div>\
            <div class="ausglobe-accordion-item-content" data-bind="css: { \'ausglobe-accordion-item-content-visible\': imageryIsOpen }">\
                <img class="ausglobe-imagery-option" src="images/AustralianTopography.png" width="73" height="74" data-bind="click: activateAustralianTopography" />\
                <img class="ausglobe-imagery-option" src="images/BingMapsAerialWithLabels.png" width="73" height="74" data-bind="click: activateBingMapsAerialWithLabels" />\
                <img class="ausglobe-imagery-option" src="images/BingMapsAerial.png" width="73" height="74" data-bind="click: activateBingMapsAerial" />\
                <img class="ausglobe-imagery-option" src="images/BingMapsRoads.png" width="73" height="74" data-bind="click: activateBingMapsRoads" />\
                <img class="ausglobe-imagery-option" src="images/AustralianHydrography.png" width="73" height="74" data-bind="click: activateAustralianHydrography" />\
                <img class="ausglobe-imagery-option" src="images/NASABlackMarble.png" width="73" height="74" data-bind="click: activateNasaBlackMarble" />\
                <img class="ausglobe-imagery-option" src="images/NaturalEarthII.png" width="73" height="74" data-bind="click: activateNaturalEarthII" />\
            </div>\
        </div>\
        <div class="ausglobe-accordion-item">\
            <div class="ausglobe-accordion-item-header" data-bind="click: openViewerSelection">\
                <div class="ausglobe-accordion-item-header-label">2D/3D</div>\
            </div>\
            <div class="ausglobe-accordion-item-content" data-bind="css: { \'ausglobe-accordion-item-content-visible\': viewerSelectionIsOpen }">\
                <label class="ausglobe-viewer-radio-button"><input type="radio" name="viewer" value="2" data-bind="checkedValue: 2, checked: catalog.application.viewerMode" /> 2D</label>\
                <label class="ausglobe-viewer-radio-button"><input type="radio" name="viewer" value="1" data-bind="checkedValue: 1, checked: catalog.application.viewerMode" /> 3D Smooth Globe</label>\
                <label class="ausglobe-viewer-radio-button"><input type="radio" name="viewer" value="0" data-bind="checkedValue: 0, checked: catalog.application.viewerMode" /> 3D Terrain</label>\
            </div>\
        </div>';

    wrapper.appendChild(mapPanel);

    var legendPanel = document.createElement('div');
    legendPanel.className = 'ausglobe-panel';
    legendPanel.setAttribute('data-bind', 'css: { "ausglobe-panel-visible" : showingLegendPanel }');

    legendPanel.innerHTML = '\
        <div data-bind="foreach: nowViewing.items">\
            <!-- ko if: isShown -->\
            <div class="ausglobe-accordion-item">\
                <div class="ausglobe-accordion-item-header" data-bind="click: toggleLegendVisible">\
                    <div class="ausglobe-accordion-item-header-label" data-bind="text: name"></div>\
                </div>\
                <div class="ausglobe-accordion-item-content" data-bind="css: { \'ausglobe-accordion-item-content-visible\': isLegendVisible }">\
                    <div class="ausglobe-legend-opacity" data-bind="if: supportsOpacity">\
                        <label>Opacity: <input class="ausglobe-legend-opacitySlider" type="range" min="0" max="1" step="0.01" data-bind="value: opacity, valueUpdate: \'input\'" /></label>\
                    </div>\
                    <!-- ko if: legendIsImage -->\
                    <img data-bind="attr: { src: legendUrl }" />\
                    <!-- /ko -->\
                    <!-- ko if: hasLegend && !legendIsImage -->\
                    <a class="ausglobe-accordion-category-item-label" data-bind="attr: { href: legendUrl }" target="_blank">Open legend in a separate tab</a>\
                    <!-- /ko -->\
                    <!-- ko if: !hasLegend -->\
                    <div class="ausglobe-accordion-category-item-label">No legend available for this data source.</div>\
                    <!-- /ko -->\
                </div>\
            </div>\
            <!-- /ko -->\
        </div>\
        <div data-bind="visible: !nowViewing.hasShownItems">\
            <div class="ausglobe-accordion-category-content ausglobe-accordion-category-content-visible">\
                <div class="ausglobe-now-viewing-no-data">\
                    There are no legends to show because no data sources are currently shown.\
                </div>\
            </div>\
        </div>';

    wrapper.appendChild(legendPanel);

    knockout.applyBindings(this._viewModel, wrapper);
};

defineProperties(GeoDataBrowser.prototype, {
    viewModel : {
        get : function() {
            return this._viewModel;
        }
    }
});

module.exports = GeoDataBrowser;
