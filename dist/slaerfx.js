(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.slaer = global.slaer || {})));
}(this, (function (exports) { 'use strict';

var settings = {
  autorun: true
};

function configure(name, value) {
    settings[name] = value;
}

function config(name) {
    if (name) {
      return settings[name];
    }
    
    return settings;
}

/*!
Extends {out} from one or more other objects (L <-- R).
This function preserves any existing keys.

@returns out
*/
function extend(out) {
  var i = arguments.length;

  while (0 <-- i) {
    for (var key in arguments[i]) {
      // Preserve exxisting keys
      if (typeof out[key] === 'undefined') {
        out[key] = arguments[i][key];
      }
    }
  }

  return out;
}

/*!
Merges one or more objects over {out} (L --> R)
This function overwrites any existing properties.

@returns out
*/
function merge(out) {
  for (var i = 1, N = arguments.length; i < N; i++) {
    for (var key in arguments[i]) {
      out[key] = arguments[i][key];
    }
  }

  return out;
}

/*!
Extends an object based on the results from a merge operation.
*/
function mergeExtend(out) {
  // FIXME: Use ES2015 spread syntax
  return extend(out, merge.apply(null, [{}].concat(Array.prototype.slice.call(arguments, 1))));
}

var annonymous$1 = 0;

function object(name, components) {
  if (name && typeof name !== 'string') {
    components = name;
    name = "obj#" + annonymous$1++;
  }

  var inst = SlaerObject.instances[name] || new SlaerObject(name, components);

  if (components && inst.components !== components) {
    merge(inst.components, components);
  }

  return inst;
}

function objects() {
  return SlaerObject.instances;
}
objects._reset = function() {
   SlaerObject.instances = {};
};

//----------------------------------------------------------
// INTERNALS
//----------------------------------------------------------


function SlaerObject(name, components) {
  this.name = name;
  this.components = components || {};

  SlaerObject.instances[name] = this;
}

SlaerObject.instances = {};

SlaerObject.prototype.clone = function(name, components) {
  return new SlaerObject(name, extend({}, this.components, components));
};

/*!
Entities represents the the types of things that can exist in the virtual world.
Rather thaan being the actual things themselves, they more describe what things can be.

For example, a "bullet" could be an entity with some inital default velocity and position.
But object "bullet#18765" is a specific instance of a bullet.

Entities allow you to define an object template, consisting of a set of inital, default components, flags and/or behaviours.
*/

var annonymous = 0;

function entity(name, components) {
  if (name && typeof name !== 'string') {
    components = name;
    name = "ent#" + annonymous++;
  }

  var inst = SlaerEntity.instances[name] || new SlaerEntity(name, components);

  if (components && inst.components !== components) {
    merge(inst.components, components);
  }

  return inst;
}

function entities() {
  return SlaerEntity.instances;
}
entities._reset = function() {
   SlaerEntity.instances = {};
};


//----------------------------------------------------------
// INTERNALS
//----------------------------------------------------------

function SlaerEntity(name, components) {
  this.name = name;
  this.components = components || {};

  SlaerEntity.instances[name] = this;
}

SlaerEntity.instances = {};

SlaerEntity.prototype.create = function(name, components) {
  return object(name, extend({}, this.components, components || {}));
};

var instances = {};

function behaviour(name, inst) {
  
  inst._name = name;
  
  return instances[name] = inst;
}
function behaviours() {
  return instances;
}
behaviours._reset = function() {
   instances = {};
};

var runToken = null;

/*!
Starts the engine.
*/
function start() {
  var _objects = objects();
  var _behaviours = behaviours();

  var now = new Date().getTime(), then = now, dt = 0;

  (function loop() {
    then = now;
    now = new Date().getTime();
    dt = Math.min((now - then) / 1000.0, 0.1);

    for (var key in _objects) {
      for (var component in _objects[key].components) {
        if (component[0] === '_') {
          continue;
        }

        if (_behaviours[component]) {
          _behaviours[component].call(_objects[key], dt, _objects[key].components[component]);
        }
        else if (typeof _objects[key].components[component] === 'function') {
          _objects[key].components[component].call(_objects[key].components, dt);
        }
      }
    }
    
    runToken = window.requestAnimationFrame(loop);
  }());
}

/*!
Stops the engine running
*/
function stop() {
  window.cancelAnimationFrame(runToken);
}

/*!
Wipes the data and restarts the engine.
*/
function reset() {
  objects._reset();
  entities._reset();
  behaviours._reset();
}

// Annonymous surface counter
var annonymous$2 = 0;

function surface(components) {
  if (name && typeof name !== 'string') {
    components = name;
    name = "surface#" + annonymous$2++;
  }

  return new SlaerSurface();
}

//----------------------------------------------------------
// INTERNALS
//----------------------------------------------------------

function SlaerSurface(components) {
  components = components || {};
  
  this._canvas = document.createElement('canvas');

  this._canvas.style.position = 'fixed';
  this._canvas.style.width = '100%';
  this._canvas.style.height = '100%';
  this._canvas.style.top = 0;
  this._canvas.style.left = 0;
  
  if (components.background) {
    this._canvas.style.backgroundColor = components.background;
  }

  if (!components.resolution) {
    components.resolution = [1.0, 1.0];
  }
  else if (typeof components.resolution === 'number') {
    components.resolution = [components.resolution, components.resolution];
  }
  else if (typeof components.resolution === 'string') {
    components.resolution = parseFloat(components.resolution);
    components.resolution = [components.resolution, components.resolution];
  }

  this._resolution = components.resolution;

  this.resize([window.innerWidth, window.innerHeight], components.resolution);

  document.body.appendChild(this._canvas);

  this._ctx = this._canvas.getContext('2d');

  SlaerSurface.instances.push(this);
}

SlaerSurface.prototype.resize = function(size, res) {
  this._canvas.width = size[0] * res[0];
  this._canvas.height = size[1] * res[1];
};

SlaerSurface.instances = [];

window.addEventListener('resize', function() {
  for (var i = 0, N = SlaerSurface.instances.length; i < N; i++) {
    SlaerSurface.instances[i].resize([window.innerWidth, window.innerHeight], SlaerSurface.instances[i]._resolution);
  }
});

// Import the stuff we need for init
// Initialise the bootstrapper
window.addEventListener('load', function() {
  if (config('autorun')) {
    start();
  }
});

exports.configure = configure;
exports.config = config;
exports.entity = entity;
exports.entities = entities;
exports.object = object;
exports.objects = objects;
exports.behaviour = behaviour;
exports.behaviours = behaviours;
exports.start = start;
exports.stop = stop;
exports.reset = reset;
exports.extend = extend;
exports.merge = merge;
exports.mergeExtend = mergeExtend;
exports.surface = surface;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=slaerfx.js.map
