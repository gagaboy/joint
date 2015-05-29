joint.shapes.moqui = {};

/**
 * 实体的定义
 * */
joint.shapes.moqui.entity = joint.shapes.basic.Generic.extend({

    markup: [
        '<g class="rotatable">',
            '<g class="scalable">','</g>',
             '<rect class="moqui-entity-name-rect"/><rect class="moqui-entity-fields-rect"/>',
            '<text class="moqui-entity-name-text"/><text class="moqui-entity-fields-pk-text"/><text class="moqui-entity-fields-text"/><text class="moqui-entity-fields-attr-text"/>',
        '</g>'
    ].join(''),

    defaults: joint.util.deepSupplement({

        type: 'moqui.entity',

        attrs: {
            rect: { 'width': 300 },

            '.moqui-entity-name-rect': { 'stroke': 'black', 'stroke-width': 1, 'fill': '#EBCAA6' },
            '.moqui-entity-fields-rect': { 'stroke': 'black',  'stroke-width': 1, 'fill': '#FBFFE0' },

            '.moqui-entity-name-text': {
                'ref': '.moqui-entity-name-rect', 'ref-y': .5, 'ref-x': .5, 'text-anchor': 'middle', 'y-alignment': 'middle', 'font-weight': 'bold',
                'fill': 'black', 'font-size': 16, 'font-family': 'Times New Roman'
            },
            '.moqui-entity-fields-text': {
                'ref': '.moqui-entity-fields-rect', 'ref-y': 2, 'ref-x': 40,
                'fill': 'black', 'font-size': 13, 'font-family': 'Verdana'
            },
            '.moqui-entity-fields-attr-text': {
                'ref': '.moqui-entity-fields-rect', 'ref-y': 2, 'ref-x':190, 'text-decoration': 'underline',
                'fill': '#A69A9A', 'font-size': 13, 'font-family': 'Verdana'
            },
            '.moqui-entity-fields-pk-text': {
                'ref': '.moqui-entity-fields-rect', 'ref-y': 2, 'ref-x':3, 'font-weight': 'bold',
                'fill': 'blue', 'font-size': 13, 'font-family': 'Courier New'
            }
        },
        entityDefinition: {}

    }, joint.shapes.basic.Generic.prototype.defaults),

    initialize: function() {

        this.on('change:entityDefinition', function() {
            this.updateRectangles();
            this.trigger('moqui-entity-update');
        }, this);

        this.updateRectangles();

        joint.shapes.basic.Generic.prototype.initialize.apply(this, arguments);
    },

    getEntityName: function() {
        return  ['<<'+this.getEntityDefinition()['package-name']+'>>',this.getEntityDefinition()['entity-name']];
    },

    getFields: function() {
        return  [this.getEntityDefinition()['field']];
    },

    getEntityDefinition: function() {
        return  this.get('entityDefinition');
    },

    setEntityName: function(name) {
       this.getEntityDefinition().set('entity-name',name)  ;
        this.updateRectangles();
        this.trigger('moqui-entity-update');
    },

    //重新绘制实体矩形
    updateRectangles: function() {

        var attrs = this.get('attrs');
        if( this.getEntityDefinition().hasOwnProperty('entity-name')){
                var rects = [
                    { type: 'name', text: this.getEntityName() },
                    { type: 'fields', text: this.getFields()}
                ];

                var offsetY = 0;
                //实体是否有主键的标识
                var hasKey = 0;
                _.each(rects, function(rect) {
                    var lines = _.isArray(rect.text) ? rect.text : [rect.text];
                    var rectHeight = lines.length * 15 + 10;

                    if ( rect.type == 'fields') {
                        rectHeight = lines[0].length * 14 + 10;
                        var  fileds ='' ;
                        var filedsType ='';
                        var fieldsPK = '';
                        for(var i=0; i<lines[0].length; i++ ){
                            var tempField = lines[0][i] ;
                            fileds+= tempField['name'];
                            filedsType += tempField['type'] ;
                            if(tempField.hasOwnProperty('is-pk') ){
                                if(tempField['is-pk']=='true'||tempField['is-pk']=='TRUE'){
                                    fieldsPK += '<PK>' ;
                                    hasKey = 1;
                                }
                                fieldsPK += '' ;
                            }
                            if( i != lines[0].length - 1){
                                fileds+=  '\n' ;
                                filedsType+=  '\n' ;
                                fieldsPK += '\n';
                            }

                        }
                        attrs['.moqui-entity-fields-text'].text =fileds   ;
                        attrs['.moqui-entity-fields-attr-text'].text =filedsType   ;
                        attrs['.moqui-entity-fields-pk-text'].text =fieldsPK   ;
                    }
                    else {
                        attrs['.moqui-entity-' + rect.type + '-text'].text = lines.join('\n');
                    }
                    attrs['.moqui-entity-' + rect.type + '-rect'].height = rectHeight;
                    attrs['.moqui-entity-' + rect.type + '-rect'].height = rectHeight;
                    attrs['.moqui-entity-' + rect.type + '-rect'].transform = 'translate(0,' + offsetY + ')';
                    offsetY += rectHeight;
                });
                //如果实体不存在主键，则字段属性重新横向左偏移
                if(!hasKey){
                    attrs['.moqui-entity-fields-text']['ref-x'] -= 35;
                    attrs['.moqui-entity-fields-attr-text']['ref-x'] -= 35;
                }
            }
        }

});

joint.shapes.moqui.entityView = joint.dia.ElementView.extend({

    initialize: function() {

        joint.dia.ElementView.prototype.initialize.apply(this, arguments);

        this.listenTo(this.model, 'moqui-entity-update', function() {
            this.update();
            this.resize();
        });
    }
});

/**
 * 扩展实体的定义
 * */
joint.shapes.moqui.extendEntity = joint.shapes.moqui.entity.extend({


    defaults: joint.util.deepSupplement({
        type: 'moqui.extendEntity',
        attrs: {
            '.moqui-entity-name-rect': { 'stroke': 'black', 'stroke-width': 2, 'fill':  '#3498db' },
            '.moqui-entity-fields-rect': { 'stroke': 'black', 'stroke-width': 2, 'fill': '#2980b9' },
            '.moqui-entity-fields-attr-text': {
                'ref': '.moqui-entity-fields-rect', 'ref-y': 2, 'ref-x':200, 'text-decoration': 'underline',
                'fill': 'black', 'font-size': 13, 'font-family': 'Verdana'
            }
        }
    }, joint.shapes.moqui.entity.prototype.defaults)

});
joint.shapes.moqui.extendEntityView = joint.shapes.moqui.EntityView;

/**
 * 包外部关联的实体的定义
 * */
joint.shapes.moqui.outerPkgEntity = joint.shapes.moqui.entity.extend({

    defaults: joint.util.deepSupplement({
        type: 'moqui.outerPkgEntity',
        attrs: {
            '.moqui-entity-name-rect': { 'stroke': 'black', 'stroke-width': 2, 'fill':  '#CCCCCC' },
            '.moqui-entity-fields-rect': { 'stroke': 'black', 'stroke-width': 2, 'fill': '#E6E6E6' }
        }
    }, joint.shapes.moqui.entity.prototype.defaults)

});
joint.shapes.moqui.outerPkgEntityView = joint.shapes.moqui.EntityView;


/**
* 关联关系的定义
* */
//继承、扩展关系
joint.shapes.moqui.relationShipLink = joint.dia.Link.extend({
    defaults: joint.util.deepSupplement({
        type: 'moqui.relationShipLink',
        //router: { name: 'manhattan' },
        //connector: { name: 'rounded' },
        attrs: {
            '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z', fill: 'yellow'}
        },
        relationShip:{}
    },  joint.dia.Link.prototype.defaults),

    initialize: function(options) {

        this.on('change:curEntity', function() {
            this.updateLinks();
            this.trigger('moqui-relationShip-update');
        }, this);
       this.updateLinks();
        // Call the `initialize()` of the parent.
       // this.constructor.__super__.constructor.__super__.initialize.apply(this, arguments);
        joint.dia.Link.prototype.initialize.apply(this, arguments);
    },

    getRelationShip: function() {
        return  this.get('relationShip');
    },


    //重绘连接线
    updateLinks:function(){
        var attrs = this.get('attrs');
        //添加关系连接线上面的关系的文字
        this.label(0, {
            position: 15,
            attrs: {
                text: { fill: 'green', 'font-family': 'Verdana' , 'font-size': 12, 'font-weight': 'bold',  text: this.getRelationShip()['type']=='many'?'1':'*' }
            }
        });
        this.label(1, {
            position: -15,
            attrs: {
                text: { fill: 'green', 'font-family': 'Verdana' , 'font-size': 12, 'font-weight': 'bold',  text: this.getRelationShip()['type']=='many'?'*':'1' }
            }
        });
        //
        if(this.getRelationShip().hasOwnProperty('key-map')){
            this.label(2, {
                position:.5,
                attrs: {
                    text: { fill: 'blue', 'font-family': 'Verdana' , 'font-size': 12, 'font-weight': 'bold',  text: this.getRelationShip()['key-map']['field-name'] }
                }
            });
        }
    }
});

joint.shapes.moqui.relationShipLinkView = joint.dia.LinkView.extend({
    initialize: function() {
        joint.dia.LinkView.prototype.initialize.apply(this, arguments);

        this.listenTo(this.model, 'moqui-relationShip-update', function() {
            this.update();
            this.resize();
        });
    }
});



