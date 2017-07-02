(function (window, angular, undefined) {

    angular.module( 'coderControllers' ).controller( 'sageJourneyEditCtrl', [
        '$scope', '$location', '$routeParams', '$log', '$timeout', '$mdDialog', '$mdSidenav', '$compile', '$document', 'Sage',
        function( $scope, $location, $routeParams, $log, $timeout, $mdDialog, $mdSidenav, $compile, $document, Sage ) {

            $log.log( "loaded sageJourneyEditCtrl ..." );
            $scope.isLoading = false; // used for showing circular progress

            jsPlumb.ready(function () {
                
                var STATES = {};
                var EDGES  = {};
                var outerWindowNumber = 0;

                //--- On load, get state diagram if it exists ---//
                Sage.getStateDiagram(
                    function( response ) {
                        if ('states' in response.data) {
                            STATES = response.data.states;
                        }
                        if ('edges' in response.data) {
                            EDGES  = response.data.edges;
                        }
                        $scope.restoreStateDiagram(STATES, EDGES);
                    },
                    function( data ) {
                        $log.log( "Error retrieving state diagram", data );
                    }
                );

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
                    var outerWindowElemId = "outerflowchartWindow_" + outerWindowNumber;
                    var numBoxes = 2;
                    var child_nodes = [];
                    for (var i = 0; i < numBoxes; i++) {
                        var innerWindowElemId = "innerflowchartWindow_" + outerWindowNumber + "_" + i;
                        child_nodes[i] = { id: outerWindowNumber + "_" + i, text: "Insert condition", dom_id: innerWindowElemId };
                    }
                    STATES[outerWindowNumber] = { type: 'Condition', child_nodes: child_nodes, text: "Insert Condition",
                                                  dom_id: outerWindowElemId };
                    
                    //--- create outerWindow + innerWindow[numBoxes] ---///
                    var html         = Sage.getConditionTemplate(outerWindowElemId, STATES[outerWindowNumber], numBoxes);
                    var compiledHtml = $compile(html)($scope);
                    var canvas       = angular.element($document[0].querySelector('#canvas'));
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
                    var child_nodes = [];
                    var outerWindowElemId = "outerflowchartWindow_" + outerWindowNumber;
                    var innerWindowElemId = "innerflowchartWindow_" + outerWindowNumber + "_" + 0 ;
                    child_nodes[0] = { id: "" + outerWindowNumber + "_" + 0, text: "Insert Action", dom_id: innerWindowElemId };
                    STATES[outerWindowNumber] = { type: 'Action', child_nodes: child_nodes, text: "Insert Action",
                                                  dom_id: outerWindowElemId, color: color };

                    //--- create outerWindow + innerWindow[numBoxes] ---//
                    var html         = Sage.getActionTemplate(outerWindowElemId, STATES[outerWindowNumber], color);
                    var compiledHtml = $compile(html)($scope); 
                    var canvas       = angular.element($document[0].querySelector('#canvas'));
                    canvas.append(compiledHtml);
                    
                    //--- add endpoints for outerWindow and innerWindows ---//
                    _addEndpoints("outerflowchartWindow_" + outerWindowNumber, [], ["TopCenter"]);
                    var child_node = STATES[outerWindowNumber].child_nodes[0];
                    _addEndpoints("innerflowchartWindow_" + child_node.id, ["BottomCenter"], []);

                    //--- force outer-windows to be draggable ---//
                    instance.draggable(jsPlumb.getSelector(".flowchart-demo .outer-window"), { grid: [20, 20] });
                    outerWindowNumber++;
                };

                $scope.confirmDeleteState = function(ev, elem) {
                    // Appending dialog to document.body to cover sidenav in docs app
                    var elemid   = elem.attr('data-id');
                    var confirm  = $mdDialog.confirm()
                        .title('Delete this state?')
                        .textContent('Deleting this states gets rid of all its connections as well. Are you sure?')
                        .ariaLabel('Delete State')
                        .targetEvent(ev)
                        .ok('DELETE!')
                        .cancel('Cancel');
                    
                    $mdDialog.show(confirm).then(function() {
                        $log.log("Deleting " + elemid);
                        // Detach connection from node
                        instance.detachAllConnections(elemid);
                        instance.removeAllEndpoints(elemid);
                        // Detach connection from child_node(s) as well
                        var matches     = Sage.getInnerAndOuterMatches(elemid);
                        var numid       = null;
                        if (matches.innerMatch) {
                            numid       = matches.innerMatch[1];
                        } else if (matches.outerMatch) {
                            numid       = matches.outerMatch[1];
                        }
                        if (numid in STATES) {
                            angular.forEach(STATES[numid].child_nodes, function(child_node, child_id) {
                                instance.detachAllConnections(child_node.dom_id);
                                instance.removeAllEndpoints(child_node.dom_id);
                            });
                        }
                        instance.detach(elemid);
                        angular.element($document[0].querySelector('#' + elemid)).remove();

                        // Delete data from STATES and EDGES (TBD)

                        instance.repaintEverything();
                    }, function() {
                        $log.log("Delete cancelled");
                    });
                };
                
                $scope.confirmLabelChange = function(ev, elem) {
                    // Appending dialog to document.body to cover sidenav in docs app
                    var confirm = $mdDialog.prompt()
                        .title('Update Label')
                        .placeholder('Label')
                        .ariaLabel('Label')
                        .initialValue(elem.html())
                        .targetEvent(ev)
                        .ok('Update!')
                        .cancel('Cancel');

                    $mdDialog.show(confirm).then(
                        function(result) {
                            elem.html(result);
                            // Update text value in STATES
                            elemid = elem.attr('data-id');
                            var state;
                            var matches = Sage.getInnerAndOuterMatches(elemid);
                            if (matches.innerMatch) {
                                // update inner (child) node
                                var outerState = matches.innerMatch[1], innerState = matches.innerMatch[2];
                                if (outerState in STATES && innerState in STATES[outerState].child_nodes) {
                                    STATES[outerState].child_nodes[innerState].text = result;
                                }
                            } else if (matches.outerMatch) {
                                // update outer node
                                state = matches.outerMatch[1];
                                if (state && state in STATES) {
                                    STATES[state].text = result;
                                }
                            }
                            instance.repaintEverything();
                        },
                        function() {
                            $log.log('No change');
                        }
                    );
                };

                $scope.updateLabel = function(ev) {
                    $scope.confirmLabelChange(ev, angular.element(ev.target));
                };

                $scope.deleteState = function(ev) {
                    $scope.confirmDeleteState(ev, angular.element(ev.target));
                };

                $scope.restoreStateDiagram = function(states, edges) {
                    angular.forEach(states, function(state, winNumber) {
                        var outerWindowElemId = "outerflowchartWindow_" + winNumber;
                        var html;
                        if (state.type == 'Condition') {
                            var numBoxes = state.child_nodes.length;
                            html = Sage.getConditionTemplate(outerWindowElemId, states[winNumber], numBoxes);
                        } else if (state.type == 'Action') {
                            html = Sage.getActionTemplate(outerWindowElemId, states[winNumber], state.color);
                        }
                        var compiledHtml = $compile(html)($scope); 
                        var canvas       = angular.element($document[0].querySelector('#canvas'));
                        canvas.append(compiledHtml);
                        
                        //--- add endpoints for outerWindow and innerWindows ---//
                        _addEndpoints("outerflowchartWindow_" + winNumber, [], ["TopCenter"]);
                        if (state.type == 'Condition') {
                            for (var i = 0; i < numBoxes; i++) {
                                var child_node = states[winNumber].child_nodes[i];
                                _addEndpoints("innerflowchartWindow_" + child_node.id, ["BottomCenter"], []);
                            }
                        } else if (state.type == 'Action') {
                            var child_node = states[winNumber].child_nodes[0]; 
                            _addEndpoints("innerflowchartWindow_" + child_node.id, ["BottomCenter"], []);
                        }
                        //--- force outer-windows to be draggable ---//
                        instance.draggable(jsPlumb.getSelector(".flowchart-demo .outer-window"), { grid: [20, 20] });
                    });
                    angular.forEach(edges, function(outerBlob, sourceNodeId) {
                        angular.forEach(outerBlob, function(edge, targetNodeId) {
                            var srcEndpt = edge.dom_source_id + "BottomCenter";
                            var tgtEndpt = edge.dom_target_id + "TopCenter";
                            instance.connect({uuids:[srcEndpt, tgtEndpt]});
                        });
                    });
                };
                
                $scope.saveStateDiagram = function() {
                    $scope.isLoading = true;
                    angular.forEach(STATES, function(state, index) {
                        var elem = angular.element($document[0].querySelector('#' + state.dom_id));
                        state.x = elem.prop('offsetLeft') || 0;
                        state.y = elem.prop('offsetTop') || 0;
                    });
                    Sage.updateStateDiagram( 
                        STATES, EDGES, 
                        function( data ) {
                            $log.log( "Updated: ", data );
                            $timeout(function() {
                                $scope.isLoading = false;
                            }, 1000);
                        },
                        function( data ) {
                            $log.log( "Error updating state diagram: ", data );
                            $scope.isLoading = false;
                        }
                    );
                };

                //--- end handlers ---//

                var basicType = {
                    connector: "StateMachine",
                    paintStyle: { stroke: "red", strokeWidth: 4 },
                    hoverPaintStyle: { stroke: "blue" },
                    overlays: [
                        "Arrow"
                    ]
                };
                instance.registerConnectionType("basic", basicType);

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
                        instance.addEndpoint(toId, sourceEndpoint, { anchor: sourceAnchors[i], uuid: sourceUUID });
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
                        var matches = Sage.getInnerAndOuterMatches(connInfo.sourceId);
                        if (matches.innerMatch) {
                            sourceNode = { id: matches.innerMatch[1] + '_' + matches.innerMatch[2], dom_id: connInfo.sourceId };
                        } else if (matches.outerMatch) {
                            sourceNode = { id: matches.outerMatch[1], dom_id: connInfo.sourceId };
                        }

                        matches = Sage.getInnerAndOuterMatches(connInfo.targetId);
                        if (matches.innerMatch) {
                            targetNode = { id: matches.innerMatch[1] + '_' + matches.innerMatch[2], dom_id: connInfo.targetId };
                        } else if (matches.outerMatch) {
                            targetNode = { id: matches.outerMatch[1], dom_id: connInfo.targetId };
                        }

                        //--- create an edge ---//
                        if (sourceNode && targetNode) {
                            if (!EDGES[sourceNode.id]) EDGES[sourceNode.id] = {};
                            if (!EDGES[sourceNode.id][targetNode.id]) EDGES[sourceNode.id][targetNode.id] = {};
                            EDGES[sourceNode.id][targetNode.id] = {dom_source_id: sourceNode.dom_id, dom_target_id: targetNode.dom_id};
                        }
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
                        } else if (matches.outerMatch) {
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
                        // $log.log("connection " + connection.id + " being dragged. suspendedElement is ", connection.suspendedElement,
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
