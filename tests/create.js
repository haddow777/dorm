var rhi = require('rhizomorph')
  , e = require('../lib/domain/Entities');
 

var node = e.Node.create()
  , nodeType = e.NodeType.create()
  , nodeName_ti = e.TranslatedItem.create()
  , nodeName_trans = e.Translation.create()
  , nodeDesc_ti = e.TranslatedItem.create()
  , nodeDesc_trans = e.Translation.create();

nodeName_ti.history_id = 0;
rhi.save(nodeName_ti, function (e1,r1){

    nodeName_trans.lang = 'ENG';
    nodeName_trans.history_id=0;
    nodeName_trans.text='SomeNode';
    nodeName_trans.translated_item_id = r1.id;
    rhi.save(nodeName_trans, function (e2,r2){
        
        nodeDesc_ti.history_id = 0;
        rhi.save(nodeDesc_ti, function(e3,r3){
            
            nodeDesc_trans.lang = 'ENG';
            nodeDesc_trans.history_id=0;
            nodeDesc_trans.text='description here';
            nodeDesc_trans.translated_item_id = r3.id;
            rhi.save(nodeDesc_trans, function(e4,r4){
                
                nodeType.history_id = 0;
                nodeType.name_trans_id = nodeName_ti.id;
                nodeType.description_trans_id =nodeDesc_ti.id; 
                nodeType.heirarchy_level = 1;
                rhi.save(nodeType, function(e5,r5){
                
                    console.log('NodeType saved.', r5);
                    node.history_id = 0;
                    node.name_trans_id = nodeName_ti.id;
                    node.description_trans_id = nodeDesc_ti.id;
                    node.abbreviation = 'N';
                    node.active = true;
                    node.node_type_id = nodeType.id;
                    node.parent_id=null;
                    rhi.save(node, function(e,r){
                        console.log('Node saved', r, e);
                    });
                });
            })
        })
    });
});

