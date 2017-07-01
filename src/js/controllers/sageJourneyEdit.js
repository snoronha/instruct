(function (window, angular, undefined) {

    angular.module( 'coderControllers' ).controller( 'sageJourneyEditCtrl', [
        '$scope', '$location', '$routeParams', '$log', '$timeout', '$mdDialog', '$mdSidenav', '$compile', '$document', 'Sage',
        function( $scope, $location, $routeParams, $log, $timeout, $mdDialog, $mdSidenav, $compile, $document, Sage ) {

            $log.log( "loaded sageJourneyEditCtrl ..." );

            $scope.leftClose = function () {
                // Component lookup should always be available since we are not using `ng-if`
                $mdSidenav('left').close()
                    .then(function () {
                        $log.debug("close LEFT is done");
                    });
            };
            
            jsPlumb.ready(function () {
                
                var STATES = {};
                var EDGES  = {};
                var outerWindowNumber = 0;

                var instance = window.jsp = jsPlumb.getInstance({
                    // default drag options
                    DragOptions: { cursor: 'pointer', zIndex: 2000 },
                    // the overlays to decorate each connection with.  note that the label overlay uses a function to
                    // generate the label text; in this case it returns the 'labelText' member that we set on each
                    // connection in the 'init' method below.
                    ConnectionOverlays: [
                        [ "Arrow", {
                            location: 1,
                            visible:true,
                            width:11,
                            length:11,
                            id:"ARROW",
                            events:{
                                click:function() { alert("you clicked on the arrow overlay")}
                            }
                        } ],
                        [ "Label", {
                            location: 0.1,
                            visible: false,
                            id: "label",
                            cssClass: "aLabel",
                            events:{
                                tap:function() { alert("hey"); }
                            }
                        }]
                    ],
                    Container: "canvas"
                });


                $scope.createCondition = function () {
                    //--- create new node with children for conditions ---//
                    var numBoxes = 2;
                    var child_nodes = {};
                    for (var i = 0; i < numBoxes; i++) {
                        child_nodes[i] = { id: outerWindowNumber + "_" + i, text: "Insert condition here" };
                    }
                    STATES[outerWindowNumber] = { type: 'Condition', child_nodes: child_nodes };
                    
                    //--- create outerWindow + innerWindow[numBoxes] ---///
                    var outerWindowElemId = "outerflowchartWindow_" + outerWindowNumber;
                    var html = "<div class=\"outer-window\" id=\"" + outerWindowElemId + "\">" +
                        "<div class=\"outer-window-header\"> Window " + outerWindowNumber + "</div>";
                    for (var i = 0; i < numBoxes; i++) {
                        var child_node = STATES[outerWindowNumber].child_nodes[i];
                        html += "<div class=\"inner-window col-md-1\" id=\"innerflowchartWindow_" + child_node.id + "\" layout=\"row\" layout-align=\"center center\"><span ng-click=\"updateText($event)\">" + child_node.text + "</span></div>";
                    }
                    html += "</div>";
                    var compiledHtml = $compile(html)($scope); 
                    var canvas = angular.element($document[0].querySelector('#canvas'));
                    canvas.append(compiledHtml);

                    //--- add endpoints for outerWindow and innerWindows ---//
                    _addEndpoints("outerflowchartWindow_" + outerWindowNumber, [], ["TopCenter"]);
                    for (var i = 0; i < numBoxes; i++) {
                        var child_node = STATES[outerWindowNumber].child_nodes[i];
                        _addEndpoints("innerflowchartWindow_" + child_node.id, ["BottomCenter"], []);
                    }
                            
                    //--- force outer-windows to be draggable ---//
                    instance.draggable(jsPlumb.getSelector(".flowchart-demo .outer-window"), { grid: [20, 20] }); 
                    outerWindowNumber++;
                };

                $scope.createAction = function(color) {
                    //--- create new action node ---//
                    var child_nodes = {};
                    child_nodes[0] = { id: "" + outerWindowNumber + "_" + 0, text: "Insert Action" };
                    STATES[outerWindowNumber] = { type: 'Action', child_nodes: child_nodes };

                    //--- create outerWindow + innerWindow[numBoxes] ---///
                    var outerWindowElemId = "outerflowchartWindow_" + outerWindowNumber;
                    var html = "<div class=\"outer-window\" id=\"" + outerWindowElemId + "\">";
                    var child_node = STATES[outerWindowNumber].child_nodes[0];
                    html += "<div class=\"inner-window-action col-md-12\" id=\"innerflowchartWindow_" + child_node.id + "\" style=\"background-color: " + color + ";\" layout=\"row\" layout-align=\"center center\"><span ng-click=\"updateText($event)\">" + child_node.text + "</span></div>";
                    html += "</div>";
                    var compiledHtml = $compile(html)($scope); 
                    var canvas = angular.element($document[0].querySelector('#canvas'));
                    canvas.append(compiledHtml);
                    
                    //--- add endpoints for outerWindow and innerWindows ---//
                    _addEndpoints("outerflowchartWindow_" + outerWindowNumber, [], ["TopCenter"]);
                    var child_node = STATES[outerWindowNumber].child_nodes[0];
                    _addEndpoints("innerflowchartWindow_" + child_node.id, ["BottomCenter"], []);

                    //--- force outer-windows to be draggable ---//
                    instance.draggable(jsPlumb.getSelector(".flowchart-demo .outer-window"), { grid: [20, 20] });
                    outerWindowNumber++;
                };

                $scope.showTextPrompt = function(ev, elem) {
                    // Appending dialog to document.body to cover sidenav in docs app
                    var confirm = $mdDialog.prompt()
                        .title('Update Label')
                        // .textContent('Bowser is a common name.')
                        .placeholder('Label')
                        .ariaLabel('Label')
                        .initialValue('')
                        .targetEvent(ev)
                        .ok('Update!')
                        .cancel('Cancel');

                    $mdDialog.show(confirm).then(function(result) {
                        elem.html(result);
                        instance.repaintEverything();
                    }, function() {
                        $log.log('No change');
                    });
                };

                $scope.updateText = function(ev) {
                    $scope.showTextPrompt(ev, angular.element(ev.target));
                };

                //--- end handlers ---//

                /*
                var basicType = {
                    connector: "StateMachine",
                    paintStyle: { stroke: "red", strokeWidth: 4 },
                    hoverPaintStyle: { stroke: "blue" },
                    overlays: [
                        "Arrow"
                    ]
                };
                instance.registerConnectionType("basic", basicType);
                */

                // this is the paint style for the connecting lines..
                var connectorPaintStyle =
                    {
                        strokeWidth: 2,
                        stroke: "#61B7CF",
                        joinstyle: "round",
                        outlineStroke: "white",
                        outlineWidth: 2
                    },
                    // .. and this is the hover style.
                    connectorHoverStyle = {
                        strokeWidth: 3,
                        stroke: "#216477",
                        outlineWidth: 5,
                        outlineStroke: "white"
                    },
                    endpointHoverStyle = {
                        fill: "#216477",
                        stroke: "#216477"
                    },
                    // the definition of source endpoints (the small blue ones)
                    sourceEndpoint = {
                        endpoint: "Dot",
                        paintStyle: {
                            stroke: "#7AB02C",
                            fill: "transparent",
                            radius: 7,
                            strokeWidth: 1
                        },
                        isSource: true,
                        connector: [ "Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ],
                        connectorStyle: connectorPaintStyle,
                        hoverPaintStyle: endpointHoverStyle,
                        connectorHoverStyle: connectorHoverStyle,
                        dragOptions: {},
                        overlays: [
                            [ "Label", {
                                location: [0.5, 1.5],
                                label: "Drag",
                                cssClass: "endpointSourceLabel",
                                visible:false
                            } ]
                        ]
                    },
                    // the definition of target endpoints (will appear when the user drags a connection)
                    targetEndpoint = {
                        endpoint: "Dot",
                        paintStyle: { fill: "#7AB02C", radius: 7 },
                        hoverPaintStyle: endpointHoverStyle,
                        maxConnections: -1,
                        dropOptions: { hoverClass: "hover", activeClass: "active" },
                        isTarget: true,
                        overlays: [
                            [ "Label", { location: [0.5, -0.5], label: "Drop", cssClass: "endpointTargetLabel", visible:false } ]
                        ]
                    },
                    init = function (connection) {
                        connection.getOverlay("label").setLabel(connection.sourceId.substring(15) + "-" + connection.targetId.substring(15));
                    };
                    
                var _addEndpoints = function (toId, sourceAnchors, targetAnchors) {
                    for (var i = 0; i < sourceAnchors.length; i++) {
                        var sourceUUID = toId + sourceAnchors[i];
                        instance.addEndpoint(toId, sourceEndpoint, {
                            anchor: sourceAnchors[i], uuid: sourceUUID
                        });
                    }
                    for (var j = 0; j < targetAnchors.length; j++) {
                        var targetUUID = toId + targetAnchors[j];
                        instance.addEndpoint(toId, targetEndpoint, { anchor: targetAnchors[j], uuid: targetUUID });
                    }
                };

                // suspend drawing and initialise.
                instance.batch(function () {

                    //--- listen for new connections; initialise them as at startup, create an edge if necessary ---//
                    instance.bind("connection", function (connInfo, originalEvent) {
                        init(connInfo.connection);
                        var sourceNode, targetNode, innerMatch, outerMatch;
                        innerMatch = connInfo.sourceId.match(/Window_(\d+)_(\d+)$/);
                        outerMatch = connInfo.sourceId.match(/Window_(\d+)$/);
                        if (innerMatch) {
                            sourceNode = { id: innerMatch[1] + '_' + innerMatch[2], dom_id: connInfo.sourceId };
                        } else if (outerMatch) {
                            sourceNode = { id: outerMatch[1], dom_id: connInfo.sourceId };
                        }

                        innerMatch = connInfo.targetId.match(/Window_(\d+)_(\d+)$/);
                        outerMatch = connInfo.targetId.match(/Window_(\d+)$/);
                        if (innerMatch) {
                            targetNode = { id: innerMatch[1] + '_' + innerMatch[2], dom_id: connInfo.targetId };
                        } else if (outerMatch) {
                            targetNode = { id: outerMatch[1], dom_id: connInfo.targetId };
                        }

                        //--- create an edge ---//
                        if (sourceNode && targetNode) {
                            if (!EDGES[sourceNode.id]) EDGES[sourceNode.id] = {};
                            if (!EDGES[sourceNode.id][targetNode.id]) EDGES[sourceNode.id][targetNode.id] = {};
                            EDGES[sourceNode.id][targetNode.id] = {dom_source_id: sourceNode.dom_id, dom_target_id: targetNode.dom_id};
                        }
                        $log.log("connection - edges: ", EDGES);
                    });

                    //--- listen for detached connections; delete the edge ---//
                    instance.bind("connectionDetached", function (connInfo, originalEvent) {
                        var sourceNode, targetNode, innerMatch, outerMatch;
                        innerMatch = connInfo.sourceId.match(/Window_(\d+)_(\d+)$/);
                        outerMatch = connInfo.sourceId.match(/Window_(\d+)$/);
                        if (innerMatch) {
                            sourceNode = { id: innerMatch[1] + '_' + innerMatch[2] };
                        } else if (outerMatch) {
                            sourceNode = { id: outerMatch[1] };
                        }

                        innerMatch = connInfo.targetId.match(/Window_(\d+)_(\d+)$/);
                        outerMatch = connInfo.targetId.match(/Window_(\d+)$/);
                        if (innerMatch) {
                            targetNode = { id: innerMatch[1] + '_' + innerMatch[2] };
                        } else if (outerMatch) {
                            targetNode = { id: outerMatch[1] };
                        }

                        //--- delete edge ---//
                        if (sourceNode && targetNode) {
                            if (EDGES[sourceNode.id][targetNode.id]) {
                                delete EDGES[sourceNode.id][targetNode.id];
                                if (Object.keys(EDGES[sourceNode.id]).length == 0) {
                                    delete EDGES[sourceNode.id];
                                }
                            }
                        }
                        $log.log("detached - edges: ", EDGES);
                    });

                    //--- listen for moved connections; delete edge from originalSourceId ---//
                    instance.bind("connectionMoved", function (connInfo, originalEvent) {
                        var sourceId, targetId, sourceNode, targetNode, innerMatch, outerMatch;
                        innerMatch = connInfo.originalSourceId.match(/Window_(\d+)_(\d+)$/); // delete edge from original source/target
                        outerMatch = connInfo.originalSourceId.match(/Window_(\d+)$/);
                        if (innerMatch) {
                            sourceNode = { id: innerMatch[1] + '_' + innerMatch[2] };
                        } else if (outerMatch) {
                            sourceNode = { id: outerMatch[1] };
                        }

                        innerMatch = connInfo.originalTargetId.match(/Window_(\d+)_(\d+)$/);
                        outerMatch = connInfo.originalTargetId.match(/Window_(\d+)$/);
                        if (innerMatch) {
                            targetNode = { id: innerMatch[1] + '_' + innerMatch[2] };
                        } else if (outerMatch) {
                            targetNode = { id: outerMatch[1] };
                        }

                        if (sourceNode && targetNode) {
                            if (EDGES[sourceNode.id][targetNode.id]) {
                                delete EDGES[sourceNode.id][targetNode.id];
                                if (Object.keys(EDGES[sourceNode.id]).length == 0) {
                                    delete EDGES[sourceNode.id];
                                }
                            }
                        }
                        $log.log("moved - edges: ", EDGES);
                    });
                    
                    // make all the window divs draggable
                    instance.draggable(jsPlumb.getSelector(".flowchart-demo .outer-window"), { grid: [20, 20] });

                    //--- listen for clicks on connections ---//
                    instance.bind("click", function (conn, originalEvent) {
                        // if (confirm("Delete connection from " + conn.sourceId + " to " + conn.targetId + "?"))
                        //   instance.detach(conn);
                        conn.toggleType("basic");
                    });

                    instance.bind("connectionDrag", function (connection) {
                        // $log.log("connection " + connection.id + " is being dragged. suspendedElement is ", connection.suspendedElement,
                        // " of type ", connection.suspendedElementType);
                    });

                    instance.bind("connectionDragStop", function (connection) {
                        // $log.log("connection " + connection.id + " was dragged");
                    });
                    
                });

                jsPlumb.fire("jsPlumbDemoLoaded", instance);

            });
            
	    }
    ]);


    angular.module( 'coderControllers' ).controller('JourneyFABCtrl', function() {
        this.isOpen = false;
        this.selectedMode = 'md-fling';
    });

})(window, window.angular);
