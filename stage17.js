/* Pawplay stage 17: "შერეული" mode - questions from all normal categories in one game.
   Additive; loaded after stage16.js. The duel category is not included. */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var DUEL=6,MIX=categories.length,MAXN=50;
categories.push({name:'შერეული',icon:'🎲',desc:'ყველა ჩვეულებრივი კატეგორიიდან შემთხვევითი კითხვები ერთ თამაშში.',questions:[]});

/* pool of the mix = every category except the duel one (custom questions included) */
var _pool=pool;
pool=function(c){
  if(c!==MIX)return _pool(c);
  var seen={},out=[];
  for(var i=0;i<MIX;i++){if(i===DUEL)continue;_pool(i).forEach(function(q){if(!seen[q.t]){seen[q.t]=1;out.push(q)}})}
  return out;
};

/* mix is not a place for adding custom questions: those belong to a real category */
var cc=$('#customCategory');
function dropMixFromCustom(){if(!cc)return;[].slice.call(cc.options).forEach(function(o){if(+o.value===MIX)o.remove()})}

/* do not offer "all 500+ questions" as a game length */
var _fc=fillCounts;
fillCounts=function(){
  _fc();
  var sel=$('#questionCount');if(!sel||+$('#gameCategory').value!==MIX)return;
  [].slice.call(sel.options).forEach(function(o){if(+o.value>MAXN)o.remove()});
  if(![].some.call(sel.options,function(o){return o.selected&&true})&&sel.options.length)sel.selectedIndex=0;
  var ten=[].filter.call(sel.options,function(o){return o.value==='10'})[0];if(ten)ten.selected=true;
};
$('#gameCategory').onchange=fillCounts;

/* rebuild the cards and the selects so the new entry shows up */
fillSelects();dropMixFromCustom();renderCategories();
})();
