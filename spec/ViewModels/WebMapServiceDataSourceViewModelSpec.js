'use strict';

/*global require,describe,it,expect*/

var GeoDataCatalogContext = require('../../src/ViewModels/GeoDataCatalogContext');
var ImageryLayerDataSourceViewModel = require('../../src/ViewModels/ImageryLayerDataSourceViewModel');
var WebMapServiceDataSourceViewModel = require('../../src/ViewModels/WebMapServiceDataSourceViewModel');

var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');

var context;
var wmsViewModel;

beforeEach(function() {
    context = new GeoDataCatalogContext();
    wmsViewModel = new WebMapServiceDataSourceViewModel(context);
});

describe('WebMapServiceDataSourceViewModel', function() {
    it('has sensible type and typeName', function() {
        expect(wmsViewModel.type).toBe('wms');
        expect(wmsViewModel.typeName).toBe('Web Map Service (WMS)');
    });

    it('throws if constructed without a context', function() {
        expect(function() {
            var viewModel = new WebMapServiceDataSourceViewModel();
        }).toThrow();
    });

    it('can be constructed', function() {
        expect(wmsViewModel).toBeDefined();
    });

    it('is derived from ImageryLayerDataSourceViewModel', function() {
        expect(wmsViewModel instanceof ImageryLayerDataSourceViewModel).toBe(true);
    });

    it('derives legendUrl from url if legendUrl is not explicitly provided', function() {
        wmsViewModel.url = 'http://foo.com/bar';
        expect(wmsViewModel.legendUrl.indexOf(wmsViewModel.url)).toBe(0);
    });

    it('uses explicitly-provided legendUrl', function() {
        wmsViewModel.legendUrl = 'http://foo.com/legend.png';
        wmsViewModel.url = 'http://foo.com/somethingElse';
        expect(wmsViewModel.legendUrl).toBe('http://foo.com/legend.png');
    });

    it('derives metadataUrl from url if metadataUrl is not explicitly provided', function() {
        wmsViewModel.url = 'http://foo.com/bar';
        expect(wmsViewModel.metadataUrl.indexOf(wmsViewModel.url)).toBe(0);
    });

    it('uses explicitly-provided metadataUrl', function() {
        wmsViewModel.metadataUrl = 'http://foo.com/metadata';
        wmsViewModel.url = 'http://foo.com/somethingElse';
        expect(wmsViewModel.metadataUrl).toBe('http://foo.com/metadata');
    });

    it('derives dataUrl from url if dataUrl and assumes type is "wfs" if dataUrl is not explicitly provided', function() {
        wmsViewModel.url = 'http://foo.com/bar';
        expect(wmsViewModel.dataUrl.indexOf(wmsViewModel.url)).toBe(0);
        expect(wmsViewModel.dataUrlType).toBe('wfs');
    });

    it('uses explicitly-provided dataUrl and dataUrlType', function() {
        wmsViewModel.dataUrl = 'http://foo.com/data';
        wmsViewModel.dataUrlType = 'wfs-complete';
        wmsViewModel.url = 'http://foo.com/somethingElse';
        expect(wmsViewModel.dataUrl).toBe('http://foo.com/data');
        expect(wmsViewModel.dataUrlType).toBe('wfs-complete');
    });

    it('can update from json', function() {
        wmsViewModel.updateFromJson({
            name: 'Name',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            legendUrl: 'http://legend.com',
            dataUrlType: 'wfs',
            dataUrl: 'http://my.wfs.com/wfs',
            dataCustodian: 'Data Custodian',
            metadataUrl: 'http://my.metadata.com',
            url: 'http://my.wms.com',
            layers: 'mylayer',
            parameters: {
                custom: true,
                awesome: 'maybe'
            },
            getFeatureInfoAsGeoJson: false,
            getFeatureInfoAsXml: false
        });

        expect(wmsViewModel.name).toBe('Name');
        expect(wmsViewModel.description).toBe('Description');
        expect(wmsViewModel.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
        expect(wmsViewModel.legendUrl).toBe('http://legend.com');
        expect(wmsViewModel.dataUrlType).toBe('wfs');
        expect(wmsViewModel.dataUrl.indexOf('http://my.wfs.com/wfs')).toBe(0);
        expect(wmsViewModel.dataCustodian).toBe('Data Custodian');
        expect(wmsViewModel.metadataUrl).toBe('http://my.metadata.com');
        expect(wmsViewModel.url).toBe('http://my.wms.com');
        expect(wmsViewModel.layers).toBe('mylayer');
        expect(wmsViewModel.parameters).toEqual({
            custom: true,
            awesome: 'maybe'
        });
        expect(wmsViewModel.getFeatureInfoAsGeoJson).toBe(false);
        expect(wmsViewModel.getFeatureInfoAsXml).toBe(false);
    });

    it('uses reasonable defaults for updateFromJson', function() {
        wmsViewModel.updateFromJson({});

        expect(wmsViewModel.name).toBe('Unnamed Item');
        expect(wmsViewModel.description).toBe('');
        expect(wmsViewModel.rectangle).toEqual(Rectangle.MAX_VALUE);
        expect(wmsViewModel.legendUrl.indexOf('?')).toBe(0);
        expect(wmsViewModel.dataUrlType).toBe('wfs');
        expect(wmsViewModel.dataUrl.indexOf('?')).toBe(0);
        expect(wmsViewModel.dataCustodian).toBeUndefined();
        expect(wmsViewModel.metadataUrl.indexOf('?')).toBe(0);
        expect(wmsViewModel.url).toBe('');
        expect(wmsViewModel.layers).toBe('');
        expect(wmsViewModel.parameters.transparent).toBe(true);
        expect(wmsViewModel.getFeatureInfoAsGeoJson).toBe(true);
        expect(wmsViewModel.getFeatureInfoAsXml).toBe(true);
    });
});