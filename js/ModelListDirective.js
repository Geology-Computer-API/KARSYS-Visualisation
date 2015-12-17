'use strict';

function ModelListDirective(ModelRepo, Graphics) {
    return {
        scope: {
            model: '='
        },
        
        controller: function ($scope) {
            var model;
            
            // TODO Move this logic to ModelController & pass a reference
            function loadCompleted() {                
                $scope.model = model;
                $scope.$emit("MODEL_LOADED", model);   // Notify controller to update other directives
            }
            
            $scope.currentModelID;  // Is assigned via dropdown. Must not have a value.
            
            $scope.models = ModelRepo.getAll();
            
            $scope.loadModel = function (modelID) {
                model = ModelRepo.getByID(modelID);
                Graphics.resetScene();
                
                switch (model.fileFormat) {
                case ModelFormat.OBJMTL:
                    Graphics.loadObjMtl(model.name, model.filePath, model.params.mtlPath, loadCompleted);
                    break;

                case ModelFormat.DAE:
                    Graphics.loadDae(model.name, model.filePath, loadCompleted);
                    break;

                default:
                    break;
                }
            };
  
        },
        
        templateUrl: 'partials/modelList.html'
    };
}