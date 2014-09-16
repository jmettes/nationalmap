"use strict";

/*global require,$*/
var defined = require('../../third_party/cesium/Source/Core/defined');
var getElement = require('../../third_party/cesium/Source/Widgets/getElement');
var when = require('../../third_party/cesium/Source/ThirdParty/when');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');

var corsProxy = require('../corsProxy');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var komapping = require('../../public/third_party/knockout.mapping');

var GeoDataInfoPopup = function(options) {
    var container = getElement(options.container);

    var wrapper = document.createElement('div');
    wrapper.className = 'ausglobe-info-container';
    wrapper.setAttribute('data-bind', 'click: closeIfClickOnBackground');
    container.appendChild(wrapper);

    var template = document.createElement('script');
    template.setAttribute('type', 'text/html');
    template.setAttribute('id', 'ausglobe-info-item-template');
    template.innerHTML = '\
            <tr>\
                <td class="ausglobe-info-properties-name-cell" data-bind="click: $root.toggleOpen, css: cssClass">\
                    <!-- ko if: isParent && value.isOpen() -->\
                    <div class="ausglobe-info-properties-arrow" data-bind="cesiumSvgPath: { path: $root._arrowDownPath, width: 32, height: 32 }"></div>\
                    <!-- /ko -->\
                    <!-- ko if: isParent && !value.isOpen() -->\
                    <div class="ausglobe-info-properties-arrow" data-bind="cesiumSvgPath: { path: $root._arrowRightPath, width: 32, height: 32 }"></div>\
                    <!-- /ko -->\
                    <!-- ko if: !isParent -->\
                    <div class="ausglobe-info-properties-arrow"></div>\
                    <!-- /ko -->\
                    <div class="ausglobe-info-properties-name" data-bind="text: name"></div>\
                </td>\
                <!-- ko if: isParent -->\
                    <td></td>\
                <!-- /ko -->\
                <!-- ko if: isArray -->\
                    <td data-bind="foreach: value">\
                        <span data-bind="if: $index() !== 0">; </span>\
                        <span data-bind="text: $data"></span>\
                    </td>\
                <!-- /ko -->\
                <!-- ko ifnot: isParent || isArray -->\
                    <td data-bind="text: value"></td>\
                <!-- /ko -->\
            </tr>\
            <!-- ko if: isParent && value.isOpen() -->\
                <!-- ko template: { name: \'ausglobe-info-item-template\', foreach: value.data } -->\
                <!-- /ko -->\
            <!-- /ko -->';
    container.appendChild(template);

    var info = document.createElement('div');
    info.className = 'ausglobe-info';
    info.setAttribute('data-bind', 'css : { loadingIndicator : isLoading }');
    info.innerHTML = '\
        <div class="ausglobe-info-header">\
            <div class="ausglobe-info-close-button" data-bind="click: close">&times;</div>\
            <h1 data-bind="text: info.Title"></h1>\
        </div>\
        <div class="ausglobe-info-content">\
            <div class="ausglobe-info-section">\
                <div class="ausglobe-info-description" data-bind="html: description"></div>\
            </div>\
            <div class="ausglobe-info-section">\
                <h2>Data Custodian</h2>\
                <div class="ausglobe-info-description" data-bind="html: dataCustodianInformation"></div>\
            </div>\
            <div class="ausglobe-info-section" data-bind="if: info.base_url">\
                <h2><span data-bind="text: serviceType"></span> Base URL</h2>\
                <input class="ausglobe-info-baseUrl" readonly type="text" data-bind="value: info.base_url" size="80" onclick="this.select();" />\
            </div>\
            <div class="ausglobe-info-section" data-bind="if: getMetadataUrl">\
                <h2>Metadata URL</h2>\
                <a class="ausglobe-info-description" data-bind="attr: { href: getMetadataUrl }, text: getMetadataUrl" target="_blank"></a>\
            </div>\
            <div class="ausglobe-info-section" data-bind="if: info.wfsAvailable">\
                <h2>Data URL</h2>\
                <div class="ausglobe-info-description">\
                    Use the link below to download GeoJSON data.  See the\
                    <a href="http://docs.geoserver.org/latest/en/user/services/wfs/reference.html" target="_blank">Web Feature Service (WFS) documentation</a>\
                    for more information on customising URL query parameters.\
                    <div><a data-bind="attr: { href: getDataUrl }, text: getDataUrl" target="_blank"></a></div>\
                </div>\
            </div>\
            <div class="ausglobe-info-section" data-bind="if: layerProperties.data().length > 0">\
                <h2>Data Details</h2>\
                <div class="ausglobe-info-table">\
                    <table data-bind="template: { name: \'ausglobe-info-item-template\', foreach: layerProperties.data }">\
                    </table>\
                </div>\
            </div>\
            <div class="ausglobe-info-section" data-bind="if: serviceProperties.data().length > 0">\
                <h2>Service Details</h2>\
                <div class="ausglobe-info-table">\
                    <table data-bind="template: { name: \'ausglobe-info-item-template\', foreach: serviceProperties.data }">\
                    </table>\
                </div>\
            </div>\
        </div>\
    ';
    wrapper.appendChild(info);

    var viewModel = this._viewModel = {
        _arrowDownPath : 'M8.037,11.166L14.5,22.359c0.825,1.43,2.175,1.43,3,0l6.463-11.194c0.826-1.429,0.15-2.598-1.5-2.598H9.537C7.886,8.568,7.211,9.737,8.037,11.166z',
        _arrowRightPath : 'M11.166,23.963L22.359,17.5c1.43-0.824,1.43-2.175,0-3L11.166,8.037c-1.429-0.826-2.598-0.15-2.598,1.5v12.926C8.568,24.113,9.737,24.789,11.166,23.963z'
    };

    viewModel.isLoading = knockout.observable(true);
    viewModel.info = options.viewModel;

    function formatText(text) {
        // Escape HTML in the description.
        var div = document.createElement('div');
        
        if (defined(div.textContent)) {
            div.textContent = text;
        } else {
            div.innerText = text;
        }

        // Replace Markdown style links (such as: [Link Text](http://link.url.com) ) with actual links.
        var escaped = div.innerHTML;
        var fixedLinks = escaped.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, function(match, name, href) {
            return '<a href="' + href + '" target="_blank">' + name + '</a>';
        });

        // Replace '<br/>' with actual an <br/> tag.
        return fixedLinks.replace(/&lt;br\/&gt;/g, '<br/>');
    }

    viewModel.description = knockout.computed(function() {
        var text;
        if (viewModel.info.description) {
            text = viewModel.info.description();
        } else {
            text = 'Please contact the provider of this data for more information, including information about usage rights and constraints.';
        }

        return formatText(text);
    });

    viewModel.dataCustodianInformation = knockout.computed(function() {
        if (!defined(viewModel.info.dataCustodian) || !defined(viewModel.info.dataCustodian())) {
            viewModel.info.dataCustodian = knockout.observable('Unknown');
        }

        return formatText(viewModel.info.dataCustodian());
    });

    viewModel.layer = {};

    function addBindingProperties(o, level) {
        o = knockout.utils.unwrapObservable(o);

        if (typeof o !== 'object' || o instanceof Array) {
            return;
        }

        var array = o.data;
        if (!defined(array)) {
            array = o.data = knockout.observableArray();
            o.isOpen = knockout.observable(true);
        }

        array.removeAll();

        for (var property in o) {
            if (o.hasOwnProperty(property) && property !== '__ko_mapping__' && property !== 'data' && property !== 'isOpen') {
                var value = knockout.utils.unwrapObservable(o[property]);

                var cssClass = 'ausglobe-info-properties-level' + level;
                var isParent;

                if (property === 'BoundingBox' && value instanceof Array) {
                    for (var i = 0; i < value.length; ++i) {
                        var subValue = knockout.utils.unwrapObservable(value[i]);
                        addBindingProperties(subValue, level + 1);

                        isParent = typeof subValue === 'object' && !(subValue instanceof Array);

                        array.push({
                            name : property + ' (' + knockout.utils.unwrapObservable(subValue.CRS) + ')',
                            value : subValue,
                            isParent : isParent,
                            isArray : subValue instanceof Array,
                            cssClass : isParent ? cssClass + ' ausglobe-info-properties-parent' : cssClass
                        });
                    }
                } else {
                    addBindingProperties(value, level + 1);

                    isParent = typeof value === 'object' && !(value instanceof Array);

                    array.push({
                        name : property,
                        value : value,
                        isParent : typeof value === 'object' && !(value instanceof Array),
                        isArray : value instanceof Array,
                        cssClass : isParent ? cssClass + ' ausglobe-info-properties-parent' : cssClass
                    });
                }
            }
        }
    }

    viewModel.layerProperties = komapping.fromJS({});
    viewModel.serviceProperties = komapping.fromJS({});

    addBindingProperties(viewModel.layerProperties, 1);
    addBindingProperties(viewModel.serviceProperties, 1);

    viewModel.close = function() {
        container.removeChild(wrapper);
    };
    viewModel.closeIfClickOnBackground = function(viewModel, e) {
        if (e.target === wrapper) {
            viewModel.close();
        }
        return true;
    };

    viewModel.toggleOpen = function(item) {
        if (defined(item.value) && defined(item.value.isOpen)) {
            item.value.isOpen(!item.value.isOpen());
        }
    };

    viewModel.serviceType = knockout.computed(function() {
        var type = viewModel.info.type();
        if (type === 'WFS') {
            return 'Web Feature Service (WFS)';
        } else if (type === 'WMS') {
            return 'Web Map Service (WMS)';
        } else if (type === 'REST') {
            return 'Esri REST';
        } else {
            return '';
        }
    });

    viewModel.getMetadataUrl = knockout.computed(function() {
        var type = viewModel.info.type();
        if (type === 'WMS') {
            return viewModel.info.base_url() + '?service=WMS&version=1.3.0&request=GetCapabilities';
        } else if (type === 'WFS') {
            return viewModel.info.base_url() + '?service=WFS&version=1.1.0&request=GetCapabilities';
        } else if (type === 'REST') {
            return 'Esri REST service information not yet supported.';
        } else {
            return 'N/A';
        }
    });

    viewModel.getDataUrl = knockout.computed(function() {
        var baseUrl;
        if (viewModel.info.completeWfsUrl && viewModel.info.completeWfsUrl()) {
            return viewModel.info.completeWfsUrl();
        } else if (viewModel.info.wfsUrl && viewModel.info.wfsUrl()) {
            baseUrl = viewModel.info.wfsUrl();
        } else if (viewModel.info.base_url && viewModel.info.base_url()) {
            baseUrl = viewModel.info.base_url();
        } else {
            return '';
        }
        
        return baseUrl + '?service=WFS&version=1.1.0&request=GetFeature&typeName=' + viewModel.info.Name() + '&srsName=EPSG%3A4326&maxFeatures=1000';
    });

    var getMetadataUrl = viewModel.getMetadataUrl();
    if (corsProxy.shouldUseProxy(getMetadataUrl)) {
        getMetadataUrl = corsProxy.getURL(getMetadataUrl);
    }
    
    var layerName = viewModel.info.Name ? viewModel.info.Name() : viewModel.info.name ? viewModel.info.name() : viewModel.info.Title();

    if (viewModel.info.type() === 'WMS') {
        when(loadXML(getMetadataUrl), function(capabilities) {
            function findLayer(startLayer, name) {
                if (startLayer.Name === name || startLayer.Title === name) {
                    return startLayer;
                }

                var layers = startLayer.Layer;
                if (!defined(layers)) {
                    return undefined;
                }

                var found = findLayer(layers, name);
                for (var i = 0; !found && i < layers.length; ++i) {
                    var layer = layers[i];
                    found = findLayer(layer, name);
                }

                return found;
            }

            var json = $.xml2json(capabilities);
            if (json.Service) {
                komapping.fromJS(json.Service, viewModel.serviceProperties);
            } else {
                komapping.fromJS({
                    'Service information not found in GetCapabilities operation response.' : ''
                }, viewModel.serviceProperties);
            }

            var layer;
            if (defined(json.Capability)) {
                layer = findLayer(json.Capability.Layer, layerName);
            }
            if (layer) {
                komapping.fromJS(layer, viewModel.layerProperties);
            } else {
                komapping.fromJS({
                    'Layer information not found in GetCapabilities operation response.' : ''
                }, viewModel.layerProperties);
            }

            addBindingProperties(viewModel.layerProperties, 1);
            addBindingProperties(viewModel.serviceProperties, 1);

            if (viewModel.info.dataCustodian() === 'Unknown' && defined(json.Service.ContactInformation)) {
                // Fill in the data custodian from the WMS metadata.
                var contactInfo = json.Service.ContactInformation;

                var text = '';

                var primary = contactInfo.ContactPersonPrimary;
                if (defined(primary)) {
                    if (defined(primary.ContactOrganization) && primary.ContactOrganization.length > 0) {
                        text += primary.ContactOrganization + '<br/>';
                    }
                }

                if (defined(contactInfo.ContactElectronicMailAddress) && contactInfo.ContactElectronicMailAddress.length > 0) {
                    text += '[' + contactInfo.ContactElectronicMailAddress + '](mailto:' + contactInfo.ContactElectronicMailAddress + ')<br/>'; 
                }

                viewModel.info.dataCustodian(text);
            }

            viewModel.isLoading(false);
        }, function(e) {
            komapping.fromJS({
                'An error occurred while invoking the GetCapabilities service.' : ''
            }, viewModel.serviceProperties);

            komapping.fromJS({
                'An error occurred while invoking the GetCapabilities service.' : ''
            }, viewModel.layerProperties);

            viewModel.isLoading(false);
        });
    } else if (viewModel.info.type() === 'WFS') {
        when(loadXML(getMetadataUrl), function(capabilities) {
            function findLayer(startLayer, name) {
                if (startLayer.Name === name || startLayer.Title === name) {
                    return startLayer;
                }

                var layers = startLayer.FeatureType;
                if (!defined(layers)) {
                    return undefined;
                }

                var found = findLayer(layers, name);
                for (var i = 0; !found && i < layers.length; ++i) {
                    var layer = layers[i];
                    found = findLayer(layer, name);
                }

                return found;
            }

            var json = $.xml2json(capabilities);
            if (json.ServiceIdentification || json.ServiceProvider) {
                if (json.ServiceIdentification) {
                    komapping.fromJS(json.ServiceIdentification, viewModel.serviceProperties);
                }
                if (json.ServiceProvider) {
                    komapping.fromJS(json.ServiceProvider, viewModel.serviceProperties);
                }
            } else {
                komapping.fromJS({
                    'Service information not found in GetCapabilities operation response.' : ''
                }, viewModel.serviceProperties);
            }

            var layer = findLayer(json.FeatureTypeList, layerName);
            if (layer) {
                komapping.fromJS(layer, viewModel.layerProperties);
            } else {
                komapping.fromJS({
                    'Layer information not found in GetCapabilities operation response.' : ''
                }, viewModel.layerProperties);
            }

            addBindingProperties(viewModel.layerProperties, 1);
            addBindingProperties(viewModel.serviceProperties, 1);

            viewModel.isLoading(false);
        }, function(e) {
            komapping.fromJS({
                'An error occurred while invoking the GetCapabilities service.' : ''
            }, viewModel.serviceProperties);

            komapping.fromJS({
                'An error occurred while invoking the GetCapabilities service.' : ''
            }, viewModel.layerProperties);

            viewModel.isLoading(false);
        });
    } else {
        komapping.fromJS({
            'N/A' : ''
        }, viewModel.serviceProperties);

        komapping.fromJS({
            'N/A' : ''
        }, viewModel.layerProperties);

        viewModel.isLoading(false);
    }

    knockout.applyBindings(this._viewModel, wrapper);
};

module.exports = GeoDataInfoPopup;
