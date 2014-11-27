'use strict';

/*global require*/

var CzmlDataSource = require('../../third_party/cesium/Source/DataSources/CzmlDataSource');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var MetadataViewModel = require('./MetadataViewModel');
var ViewModelError = require('./ViewModelError');
var CatalogItemViewModel = require('./CatalogItemViewModel');
var inherit = require('../Core/inherit');
var readJson = require('../Core/readJson');

/**
 * A {@link CatalogItemViewModel} representing Cesium Language (CZML) data.
 *
 * @alias CzmlItemViewModel
 * @constructor
 * @extends CatalogItemViewModel
 * 
 * @param {ApplicationViewModel} application The application.
 * @param {String} [url] The URL from which to retrieve the CZML data.
 */
var CzmlItemViewModel = function(application, url) {
    CatalogItemViewModel.call(this, application);

    this._czmlDataSource = undefined;

    /**
     * Gets or sets the URL from which to retrieve CZML data.  This property is ignored if
     * {@link CzmlItemViewModel#data} is defined.  This property is observable.
     * @type {String}
     */
    this.url = url;

    /**
     * Gets or sets the CZML data, represented as a binary Blob, JSON object literal, or a Promise for one of those things.
     * This property is observable.
     * @type {Blob|Object|Promise}
     */
    this.data = undefined;

    /**
     * Gets or sets the URL from which the {@link CzmlItemViewModel#data} was obtained.  This will be used
     * to resolve any resources linked in the CZML file, if any.
     * @type {String}
     */
    this.dataSourceUrl = undefined;

    knockout.track(this, ['url', 'data', 'dataSourceUrl']);
};

inherit(CatalogItemViewModel, CzmlItemViewModel);

defineProperties(CzmlItemViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CzmlItemViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'czml';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Cesium Language (CZML)'.
     * @memberOf CzmlItemViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Cesium Language (CZML)';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf CzmlItemViewModel.prototype
     * @type {MetadataViewModel}
     */
    metadata : {
        get : function() {
            var result = new MetadataViewModel();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    }
});

CzmlItemViewModel.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.data];
};

CzmlItemViewModel.prototype._load = function() {
    var dataSource = new CzmlDataSource();
    this._czmlDataSource = dataSource;

    var that = this;

    if (defined(that.data)) {
        return when(that.data, function(data) {
            if (data instanceof Blob) {
                return readJson(data).then(function(data) {
                    dataSource.load(data, proxyUrl(that, that.dataSourceUrl));
                    doneLoading(that);
                }).otherwise(function() {
                    errorLoading(that);
                });
            } else {
                dataSource.load(data, proxyUrl(that, that.dataSourceUrl));
                doneLoading(that);
            }
        }).otherwise(function() {
            errorLoading(that);
        });
    } else {
        return dataSource.loadUrl(proxyUrl(that, that.url)).then(function() {
            doneLoading(that);
        }).otherwise(function() {
            errorLoading(that);
        });
    }
};

CzmlItemViewModel.prototype._enable = function() {
};

CzmlItemViewModel.prototype._disable = function() {
};

CzmlItemViewModel.prototype._show = function() {
    if (!defined(this._czmlDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.application.dataSources;
    if (dataSources.contains(this._czmlDataSource)) {
        throw new DeveloperError('This data source is already shown.');
    }

    dataSources.add(this._czmlDataSource);
};

CzmlItemViewModel.prototype._hide = function() {
    if (!defined(this._czmlDataSource)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var dataSources = this.application.dataSources;
    if (!dataSources.contains(this._czmlDataSource)) {
        throw new DeveloperError('This data source is not shown.');
    }

    dataSources.remove(this._czmlDataSource, false);
};

function proxyUrl(application, url) {
    if (defined(application.corsProxy) && application.corsProxy.shouldUseProxy(url)) {
        return application.corsProxy.getURL(url);
    }

    return url;
}

function doneLoading(viewModel) {
    viewModel.clock = viewModel._czmlDataSource.clock;
}

function errorLoading(viewModel) {
    throw new ViewModelError({
        sender: viewModel,
        title: 'Error loading CZML',
        message: '\
An error occurred while loading a CZML file.  This may indicate that the file is invalid or that it \
is not supported by National Map.  If you would like assistance or further information, please email us \
at <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.'
    });
}

module.exports = CzmlItemViewModel;
