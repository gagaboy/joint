var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 2000,
    height: 1000,
    gridSize: 1,
    model: graph
});

var entityDefs = joint.shapes.moqui;
//实体模型
var entitiesModel = {} ;
//关系模型
var relations = [];

//缓存所有实体关系信息的数组
var entitiesRelationships = new Array();
//缓存实体主键信息的Map，主键为类型+全路径名，值为前端实体图元的id
var entitiesMap = new Map() ;

var entityIndex = 0 ;

//实体自动布局
function autoLayout(index){
    //设定一行排几个实体以及默认的实体区域大小
    var initCol =4, initWidth = 450, initHeight=300;
    var curRow = Math.ceil(index/initCol) ;
    var curCol = (index%initCol)?(index%initCol):initCol;
    return {'x': (curCol-1)*initWidth,'y': (curRow-1)*initHeight};
}

//关联连线自动智能路由 Smart Routing
function relationLinkSmartRouting(entities,relationLinks){
    graph.on('change:position', function(cell) {
        // has an obstacle been moved? Then reroute the link.
        if (_.contains(entities, cell)) {
            _.each(relationLinks, function(r) {
                paper.findViewByModel(r).update();
            });
        }
    });
}

//重新计算顶点的位置
function adjustVertices(graph, cell) {
    // If the cell is a view, find its model.
    cell = cell.model || cell;

    if (cell instanceof joint.dia.Element) {

        _.chain(graph.getConnectedLinks(cell)).groupBy(function(link) {
            // the key of the group is the model id of the link's source or target, but not our cell id.
            return _.omit([link.get('source').id, link.get('target').id], cell.id)[0];
        }).each(function(group, key) {
            // If the member of the group has both source and target model adjust vertices.
            if (key !== 'undefined') adjustVertices(graph, _.first(group));
        });

        return;
    }

    // The cell is a link. Let's find its source and target models.
    var srcId = cell.get('source').id || cell.previous('source').id;
    var trgId = cell.get('target').id || cell.previous('target').id;

    // If one of the ends is not a model, the link has no siblings.
    if (!srcId || !trgId) return;

    var siblings = _.filter(graph.getLinks(), function(sibling) {

        var _srcId = sibling.get('source').id;
        var _trgId = sibling.get('target').id;

        return (_srcId === srcId && _trgId === trgId) || (_srcId === trgId && _trgId === srcId);
    });

    switch (siblings.length) {

        case 0:
            // The link was removed and had no siblings.
            break;

        case 1:
            // There is only one link between the source and target. No vertices needed.
            cell.unset('vertices');
            break;

        default:

            // There is more than one siblings. We need to create vertices.

            // First of all we'll find the middle point of the link.
            var srcCenter = graph.getCell(srcId).getBBox().center();
            var trgCenter = graph.getCell(trgId).getBBox().center();
            var midPoint = g.line(srcCenter, trgCenter).midpoint();

            // Then find the angle it forms.
            var theta = srcCenter.theta(trgCenter);

            // This is the maximum distance between links
            var gap = 20;

            _.each(siblings, function(sibling, index) {

                // We want the offset values to be calculated as follows 0, 20, 20, 40, 40, 60, 60 ..
                var offset = gap * Math.ceil(index / 2);

                // Now we need the vertices to be placed at points which are 'offset' pixels distant
                // from the first link and forms a perpendicular angle to it. And as index goes up
                // alternate left and right.
                //
                //  ^  odd indexes
                //  |
                //  |---->  index 0 line (straight line between a source center and a target center.
                //  |
                //  v  even indexes
                var sign = index % 2 ? 1 : -1;
                var angle = g.toRad(theta + sign * 90);

                // We found the vertex.
                var vertex = g.point.fromPolar(offset, angle, midPoint);

                sibling.set('vertices', [{ x: vertex.x, y: vertex.y }]);
            });
    }
};

//从服务端获取模型并解析渲染
function renderModelsFromServer(modelUrl){
    $.getJSON(modelUrl,function(data){
        //解析扩展实体
        if(data["entities"].hasOwnProperty('extend-entity')){
            for(var i in data["entities"]['extend-entity']){
                entityIndex ++ ;
                var posInfo = autoLayout(entityIndex) ;
                //console.log('第',entityIndex,'个实体位置为：',posInfo);
                var tempEntity = data["entities"]['extend-entity'][i];
                //初始化扩展实体模型
                entitiesModel['extend-entity:'+tempEntity['entity-name']] = new entityDefs.extendEntity({
                    position:  posInfo ,
                    size: { width: 300, height: 150 },
                    entityDefinition : tempEntity
                });
                //初始化扩展实体的关系
                if(tempEntity.hasOwnProperty('relationship')){
                    if( tempEntity['relationship'].length>0 ){
                        entitiesRelationships.push({
                            'id' : entitiesModel['extend-entity:'+tempEntity['entity-name']].id,
                            'type' : 'extend-entity',
                            'entityName' : tempEntity['entity-name'],
                            'entityFullName' : tempEntity['package-name']+'.'+tempEntity['entity-name'],
                            'relationship' : tempEntity['relationship']
                        }) ;
                    }
                }
                entitiesMap.set('extend-entity:'+tempEntity['package-name']+'.'+tempEntity['entity-name'],entitiesModel['extend-entity:'+tempEntity['entity-name']].id);
            }
        }

        //解析实体
        if(data["entities"].hasOwnProperty('entity')){
            for(var i in data["entities"]['entity']){
                entityIndex ++ ;
                var posInfo = autoLayout(entityIndex) ;
                //console.log('第',entityIndex,'个实体位置为：',posInfo);
                var tempEntity = data["entities"]['entity'][i] ;
                //初始化实体模型
                entitiesModel['entity:'+tempEntity['entity-name']] = new entityDefs.entity({
                    position: posInfo ,
                    size: { width: 300, height: 150 },
                    entityDefinition : tempEntity
                });
                //初始化扩展实体的关系
                if(tempEntity.hasOwnProperty('relationship')){
                    if( tempEntity['relationship'].length>0 ){
                        entitiesRelationships.push({
                            'id' : entitiesModel['entity:'+tempEntity['entity-name']].id,
                            'type' : 'entity',
                            'entityName' : tempEntity['entity-name'],
                            'entityFullName' : tempEntity['package-name']+'.'+tempEntity['entity-name'],
                            'relationship' :  tempEntity['relationship']
                        }) ;
                    }
                }
                entitiesMap.set('entity:'+tempEntity['package-name']+'.'+tempEntity['entity-name'],entitiesModel['entity:'+tempEntity['entity-name']].id);
            }
        }

        //解析包外部的实体
        var outEntitiesMap = new Map() ;
        //console.log(entitiesRelationships);
        for(var i=0; i<entitiesRelationships.length; i++){
            for(var j=0; j<entitiesRelationships[i]['relationship'].length; j++){
                outEntitiesMap.set(entitiesRelationships[i]['relationship'][j]['related-entity-name'],entitiesRelationships[i]['relationship'][j]['related-entity-name']);
            }
        }

        //排除包内已存在的实体
        for(var i=0; i<entitiesRelationships.length; i++){
            if( outEntitiesMap.get(entitiesRelationships[i]['entityFullName']) ){
                outEntitiesMap.delete(entitiesRelationships[i]['entityFullName']);
            }
        }

        for(var value of  outEntitiesMap.values()){
            entityIndex ++ ;
            var posInfo = autoLayout(entityIndex) ;
            var entityFullName = value ;
            var entityName = entityFullName.substring(entityFullName.lastIndexOf('.')+1,entityFullName.length);
            var pkgName = entityFullName.substring(0,entityFullName.lastIndexOf('.'));
            var tempEntity ={
                "entity-name": entityName,
                "package-name": pkgName,
                "field": []
            };
            entitiesModel['entity:'+tempEntity['entity-name']] = new entityDefs.outerPkgEntity({
                position: posInfo ,
                size: { width: 300, height: 150 },
                entityDefinition :tempEntity
            });
            entitiesMap.set('entity:'+tempEntity['package-name']+'.'+tempEntity['entity-name'],entitiesModel['entity:'+tempEntity['entity-name']].id);
        }

        var myAdjustVertices = _.partial(adjustVertices, graph);
        // adjust vertices when a cell is removed or its source/target was changed
        graph.on('add remove change:source change:target', myAdjustVertices);
        // also when an user stops interacting with an element.
        paper.on('cell:pointerup', myAdjustVertices);

        //绘制所有的实体
        _.each(entitiesModel, function(c) { graph.addCell(c); });

        //遍历实体的关联关系模型
        for(var i=0; i<entitiesRelationships.length; i++){
            //找到有关联关系的实体
            if(entitiesRelationships[i]['relationship'].length>0){
                var curEntity = entitiesRelationships[i] ;
                //遍历该实体的信息来绘制关联的连线
                for(var j=0; j<curEntity['relationship'].length; j++) {
                    var sourceId = {'id': curEntity.id};
                    var tagetEntityFullName = curEntity.relationship[j]['related-entity-name'];
                    var targetId = null;
                    if (entitiesMap.get('entity:' + tagetEntityFullName)) {
                        targetId = {'id': entitiesMap.get('entity:' + tagetEntityFullName)};
                        relations.push(new entityDefs.relationShipLink({
                            source: sourceId ,
                            target: targetId,
                            relationShip: curEntity.relationship[j]
                        }));
                    }
                }
            }
        }

        //绘制所有的关联关系
        _.each(relations, function(r) {
            graph.addCell(r);
        });
    });

    //关联关系智能路由
    //relationLinkSmartRouting(entitiesModel,relations);
}

//从服务端获取界面配置JSON进行渲染
function renderPageJSONFromServer(confUrl){
    $.getJSON(confUrl,function(data){
        graph.fromJSON(data);
    });
}