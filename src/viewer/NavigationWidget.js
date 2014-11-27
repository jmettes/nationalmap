"use strict";

/*global require,ga*/

var Cartesian3 = require('../../third_party/cesium/Source/Core/Cartesian3');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var Matrix4 = require('../../third_party/cesium/Source/Core/Matrix4');
var createCommand = require('../../third_party/cesium/Source/Widgets/createCommand');
var Ellipsoid = require('../../third_party/cesium/Source/Core/Ellipsoid');
var getElement = require('../../third_party/cesium/Source/Widgets/getElement');
var Ray = require('../../third_party/cesium/Source/Core/Ray');
var IntersectionTests = require('../../third_party/cesium/Source/Core/IntersectionTests');
var defined = require('../../third_party/cesium/Source/Core/defined');
var Tween = require('../../third_party/cesium/Source/ThirdParty/Tween');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var cartesian3Scratch = new Cartesian3();

var NavigationWidget = function(viewer, container) {
    container = getElement(container);

    this._viewer = viewer;
    this._showTilt = true;

    var element = document.createElement('div');
    element.className = 'navigation-controls';
    container.appendChild(element);

    this._element = element;

    element.innerHTML = '\
        <div class="navigation-control" data-bind="click: zoomIn, cesiumSvgPath: { path: _zoomInPath, width: 32, height: 32 }" title="Zoom In"></div>\
        <div class="navigation-control" data-bind="click: zoomOut, cesiumSvgPath: { path: _zoomOutPath, width: 32, height: 32 }" title="Zoom Out"></div>\
        <div class="navigation-control" data-bind="click: tilt, visible: showTilt, cesiumSvgPath: { path: _tiltPath, width: 32, height: 32 }" title="Tilt"></div>\
    ';

    var that = this;
    this._viewModel = {
        zoomIn : createCommand(function() {
            ga('send', 'event', 'navigation', 'click', 'zoomIn');
            if (that._viewer.map) {
                // Leaflet
                that._viewer.map.zoomIn(1);
                return;
            } else {
                // Cesium
                var scene = that._viewer.scene;
                var camera = scene.camera;
                var focus = getCameraFocus(scene);
                var direction = Cartesian3.subtract(focus, camera.position, cartesian3Scratch);
                var movementVector = Cartesian3.multiplyByScalar(direction, 2.0 / 3.0, cartesian3Scratch);
                var endPosition = Cartesian3.add(camera.position, movementVector, cartesian3Scratch);

                flyToPosition(scene, endPosition);
            }
        }),
        zoomOut : createCommand(function() {
            ga('send', 'event', 'navigation', 'click', 'zoomOut');
            if (that._viewer.map) {
                // Leaflet
                that._viewer.map.zoomOut(1);
                return;
            } else {
                // Cesium
                var scene = that._viewer.scene;
                var camera = scene.camera;
                var focus = getCameraFocus(scene);
                var direction = Cartesian3.subtract(focus, camera.position, cartesian3Scratch);
                var movementVector = Cartesian3.multiplyByScalar(direction, -2.0, cartesian3Scratch);
                var endPosition = Cartesian3.add(camera.position, movementVector, cartesian3Scratch);

                flyToPosition(scene, endPosition);
            }
        }),
        tilt : createCommand(function() {
            ga('send', 'event', 'navigation', 'click', 'tilt');
            if (that._viewModel.isTiltNone) {
                that._viewModel.isTiltNone = false;
                that._viewModel.isTiltModerate = true;
                animateToTilt(that._viewer.scene, 40.0);
            } else if (that._viewModel.isTiltModerate) {
                that._viewModel.isTiltModerate = false;
                that._viewModel.isTiltExtreme = true;
                animateToTilt(that._viewer.scene, 80.0);
            } else if (that._viewModel.isTiltExtreme) {
                that._viewModel.isTiltExtreme = false;
                that._viewModel.isTiltNone = true;
                animateToTilt(that._viewer.scene, 0.0);
            }
        }),
        showTilt : true,
        isTiltNone : true,
        isTiltModerate : false,
        isTiltExtreme : false,
        _zoomInPath : 'M25.979,12.896 19.312,12.896 19.312,6.229 12.647,6.229 12.647,12.896 5.979,12.896 5.979,19.562 12.647,19.562 12.647,26.229 19.312,26.229 19.312,19.562 25.979,19.562z',
        _zoomOutPath : 'M25.979,12.896,5.979,12.896,5.979,19.562,25.979,19.562z',
        _tiltPath : 'm 24.369658,18.483707 c -0.07919,-0.08743 -3.345079,-3.906533 -8.714362,-3.906533 -4.254073,0 -7.875754,3.876287 -7.9549405,3.963722 L 5.8328745,16.797144 4.7330624,23.060575 11.089976,21.959662 9.3275276,20.190614 c 0.077536,-0.08029 3.4484614,-2.737982 6.3360174,-2.737982 4.191933,0 6.85238,2.691791 6.929916,2.772077 l -1.664565,1.734404 6.350865,1.100912 -1.099812,-6.263431 -1.810291,1.687113 z m -7.538113,-9.2340238 2.640099,0 -3.656325,-5.8499009 -3.657425,5.8499009 2.474028,0 0,4.3992488 2.199623,0 z m -2.199623,13.7476528 -2.472928,0 3.656875,5.8499 3.656875,-5.8499 -2.641199,0 0,-4.399249 -2.199623,0 z'
    };

    knockout.track(this._viewModel, ['showTilt', 'isTiltNone', 'isTiltModerate', 'isTiltExtreme']);

    knockout.applyBindings(this._viewModel, element);
};

defineProperties(NavigationWidget.prototype, {
    showTilt : {
        get : function() {
            return this._viewModel.showTilt;
        },
        set : function(value) {
            this._viewModel.showTilt = value;
        }
    }
});

function animateToTilt(scene, targetTiltDegrees, durationMilliseconds) {
    durationMilliseconds = defaultValue(durationMilliseconds, 500);

        //get focus and camera position
    var focus = getCameraFocus(scene);
    var campos = Cartesian3.subtract(scene.camera.position, focus, cartesian3Scratch);

        //get Tilt
    var startTilt = Cartesian3.angleBetween(campos, focus);
    var endTilt = CesiumMath.toRadians(targetTiltDegrees);
    var curTilt = 0;

        //translate camera reference to focus
    var trans = Matrix4.fromTranslation(focus);
    var oldTrans = scene.camera.transform;
    scene.camera.transform = trans;
        //translate camera in reference to current pos
    scene.camera.position = campos;

    var controller = scene.screenSpaceCameraController;
    controller.enableInputs = false;

    scene.tweens.add({
        duration : durationMilliseconds / 1000.0,
        easingFunction : Tween.Easing.Sinusoidal.InOut,
        startObject : {
            time: 0.0
        },
        stopObject : {
            time : 1.0
        },
        update : function(value) {
            if (scene.isDestroyed()) {
                return;
            }
            var amount = CesiumMath.lerp(startTilt, endTilt, value.time) - (startTilt + curTilt);
            scene.camera.rotate(scene.camera.right, -amount);
            curTilt += amount;
       },
        complete : function() {
            if (controller.isDestroyed()) {
                return;
            }
            controller.enableInputs = true;
            scene.camera.position = Cartesian3.add(scene.camera.position, focus, cartesian3Scratch);
            scene.camera.transform = oldTrans;
        },
        cancel: function() {
            if (controller.isDestroyed()) {
                return;
            }
            controller.enableInputs = true;
            scene.camera.position = Cartesian3.add(scene.camera.position, focus, cartesian3Scratch);
            scene.camera.transform = oldTrans;
        }
    });
}

function getCameraFocus(scene) {
    var ray = new Ray(scene.camera.positionWC, scene.camera.directionWC);
    var intersections = IntersectionTests.rayEllipsoid(ray, Ellipsoid.WGS84);
    if (defined(intersections)) {
        return Ray.getPoint(ray, intersections.start);
    } else {
        // Camera direction is not pointing at the globe, so use the ellipsoid horizon point as
        // the focal point.
        return IntersectionTests.grazingAltitudeLocation(ray, Ellipsoid.WGS84);
    }
}

function flyToPosition(scene, position, durationMilliseconds) {
    var camera = scene.camera;
    var startPosition = camera.position;
    var endPosition = position;

    durationMilliseconds = defaultValue(durationMilliseconds, 200);

    var controller = scene.screenSpaceCameraController;
    controller.enableInputs = false;

    scene.tweens.add({
        duration : durationMilliseconds / 1000.0,
        easingFunction : Tween.Easing.Sinusoidal.InOut,
        startObject : {
            time: 0.0
        },
        stopObject : {
            time : 1.0
        },
        update : function(value) {
            if (scene.isDestroyed()) {
                return;
            }
            scene.camera.position.x = CesiumMath.lerp(startPosition.x, endPosition.x, value.time);
            scene.camera.position.y = CesiumMath.lerp(startPosition.y, endPosition.y, value.time);
            scene.camera.position.z = CesiumMath.lerp(startPosition.z, endPosition.z, value.time);
        },
        complete : function() {
            if (controller.isDestroyed()) {
                return;
            }
            controller.enableInputs = true;
        },
        cancel: function() {
            if (controller.isDestroyed()) {
                return;
            }
            controller.enableInputs = true;
        }
    });
}

module.exports = NavigationWidget;
