'use strict';

function ModelController(ModelRepo, GraphicsSvc, ObjectDataService, $scope) {
    /***********************************************
    * Private
    ***********************************************/

    var ctrl = this,        // Sometimes needed to 'escape' the current 'this' scope
        repo = ModelRepo,
        gfx = GraphicsSvc,
        ods = ObjectDataService;
    
    //
    // Private util methods
    //
    
    function replaceIDsWithNames() {
        var objects = gfx.getObjectHierarchy();
        
        for (var i = 0; i < objects.length; i++) {
            var o = objects[i];
            o.traverse(function (node) {
                if (ods.isValidID(node.name)) {
                    var id = node.name;
                    
                    node.userData.id = id;
                    
                    ods.getObjectField(id, 'name').then(function(result) {
                        if (result.data.fields) {
                            var displayName = result.data.fields[0].value;
                            if (displayName != null && displayName.length > 0) {
                                node.name = displayName;
                            }
                        }
                    });
                    
                }
            });
        }
    }
    
    /*
    * transfromCoordinates
    * Accepts a 3D coordinates object and applies coordinatesTransform object (scale & offset).
    */
    function transformCoordinates(coords, transform) {
        if (!transform) {
            return coords;
        }
        
        var newCoords = {x: 0, y: 0, z: 0};
        
        // Scale
        if (transform.scale) {
            newCoords.x = coords.x * transform.scale.x;
            newCoords.y = coords.y * transform.scale.y;
            newCoords.z = coords.z * transform.scale.z;
        }
        
        // Offset
        newCoords.x = coords.x + transform.offset.x;
        newCoords.y = coords.y + transform.offset.y;
        newCoords.z = coords.z + transform.offset.z;
        
        return newCoords;
    }
    
    /***********************************************
    * Public
    ***********************************************/
    
    // Refactoring - to keep
    this.movementEnabled = true;
    this.coordinatesEnabled = false;
    this.model = null;

    
    // Temporary variables
    this.currentModelID;
    
    // Display variables
    this.mouseCoordinates = {x: 0, y: 0, z: 0};
    this.coordinatesUnit = "";
    this.objectHierarchy;
    
    // Refactor: To cross-section
    this.csMode;    // Cross-section Horizontal/Vertical/undefined
    this.csFlipped; // "Flip" or undefined
    this.csShowPlane = 'Show';   // Show or hide the red plane
    this.crossSection = gfx.crossSection;   // Binds to distance
	
    //
    // Functions
    //
    
    this.toggleCrossSection = function (newMode, oldMode) {
        if (newMode) {
            gfx.enableCrossSection(newMode, ctrl.crossSection.distance);
        } else {
            gfx.disableCrossSection();
        }
    };
    
    this.toggleCrossSectionPlane = function () {
        gfx.showCrossSectionPlane(ctrl.csShowPlane === 'Show');
    };
    
    this.moveCrossSection = function () {
        gfx.moveCrossSection(ctrl.crossSection.distance);
    };
    
    this.rotateCrossSection = function (axis, newAngle, oldAngle) {
        var deltaAngle = newAngle - oldAngle;
        gfx.rotateCrossSection(axis, deltaAngle);
    };
    
    this.flipCrossSection = function () {
        gfx.flipCrossSection();
    };
	
    //
    // Data access
    //
    
    this.getModelName = function () {
        if (ctrl.model) {
            return ctrl.model.name;
        }
    };
    
    //
    // Event Handlers
    //
    this.canvasMouseMoved = function ($event) {
        var isMouseClicked = ($event.buttons !== 0);
        
        // Don't proceed if coordinates are disabled or user is moving model (results in bad performance)
        if (!this.coordinatesEnabled || isMouseClicked) {
            return;
        }
        
        var coords = gfx.getMouseWorldCoordinates($event);
        if (coords) {
            this.mouseCoordinates = transformCoordinates(coords, ctrl.model.params.coordinatesTransform);
        }
        
    };
    
    
    /*************************
    * Main/Init
    *************************/
    
    function init() {
        $scope.$watchCollection('ctrl.csMode', ctrl.toggleCrossSection);     // TODO Replace with ngChange in view
        
        // Event handling
        $scope.$on('MODEL_LOADED', function (event, model) {
            replaceIDsWithNames();
			if (model.params.transform) {
				gfx.translateObject(model.name, model.params.transform.offset);
				gfx.scaleObject(model.name, model.params.transform.scale);
			}
			gfx.zoomToObject(model.name);
            $scope.$broadcast('UPDATE');  // Forward event to child directives
        });
    }
    
    init();
}

/*****************************
* Modal Dialog Controller
******************************/
function ModalInfoController($uibModalInstance, objectName, objectData, ObjectDataService, GraphicsService) {
    var modal = this;
    
    this.loading = false;
    this.error = null;
    
    this.name = objectName;
    this.isolated = ('isolated' in objectData);
    this.info = null;
    
    if ('id' in objectData) {
        var objectID = objectData.id;
        modal.loading = true;
        ObjectDataService.getObjectData(objectID).then(
            function success(response) {
                var data = response.data;
                if (data.error) {
                    modal.error = data.error;
                } else {
                    modal.info = data;
                }
                modal.loading = false;
            },
            function error(response) {
                modal.error = 'Data could not be retrieved (HTTP ' + response.status + ')';
                modal.loading = false;
            }
        );
    }
    
    this.isolateObject = function () {
        GraphicsService.isolateObject(objectName);
        modal.isolated = true;
    }
    
    this.deisolateObject = function () {
        GraphicsService.deisolateObject(objectName);
        modal.isolated = false;
    }
    
    this.keyHandler = function ($event) {
        // ENTER or ESCAPE pressed?
        if ($event.keyCode == 13 || $event.keyCode == 27) {
            $uibModalInstance.close();
        }
    };

    this.ok = function () {
        $uibModalInstance.close();
    };
}