/* Doodle Doggo world art, module E (v2.11 "Tokyo Trip", V211.md section 5.4). Loads AFTER worlds A, B and C.
   Wraps PawArt.scene, PawArt.prop and PawArt.item: names this module owns are drawn here, every other name goes to the previous function.
   Copy the pencil kit, paper, palette, sky and time/weather helpers from world C so every scene looks like one sketchbook (ids prefixed pwe). No filters. */
window.PawArt = window.PawArt || {};
(function(){
'use strict';
const PA=window.PawArt;
const MINE={}, PROPS={}, ITEMS={};
const prevScene=PA.scene, prevProp=PA.prop, prevItem=PA.item;
PA.scene=function(name,o){return MINE[name]?MINE[name](o||{}):(prevScene?prevScene.apply(this,arguments):'')};
PA.prop=function(name,o){return PROPS[name]?PROPS[name](o||{}):(prevProp?prevProp.apply(this,arguments):'')};
PA.item=function(name,o){return ITEMS[name]?ITEMS[name](o||{}):(prevItem?prevItem.apply(this,arguments):'')};
PA.WORLD_E_SCENES=Object.keys(MINE);PA.WORLD_E_PROPS=Object.keys(PROPS);PA.WORLD_E_ITEMS=Object.keys(ITEMS);
})();
