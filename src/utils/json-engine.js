/**
 * This is a JSON helper file
 * Sometimes things get complicated with JSON and it feels overwhelming
 * I find it really difficult to manage a complicated JSON
 * I am planning to make JSON tracking a bit more easier with this
 *
 *
 * Creator: Jithin Aji
 *
 */


const createJSONEngine = (initialValue = {}) => {
  const MAX_HISTORY = 100;

  let rawState = structuredClone(initialValue)

  const proxyCache = new WeakMap()

  const isPlainObject = (val) => 
    typeof val === "object" &&
      val !== null &&
(val.constructor === Object || Array.isArray(val))



  const handler = {
    set(target, prop, value, receiver) {
      throw new Error("State is readonly. Use engine.set()")
    },
    deleteProperty(target, prop) {
      throw new Error("Object deletion is not allowed")
    },
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      
      if(isPlainObject(value)) return getProxy(value) 
      
      return value
    }
  }

  const getProxy = (obj) => {
    if(proxyCache.has(obj)) {
      return proxyCache.get(obj)
    }

    const proxy = new Proxy(obj, handler)
    proxyCache.set(obj, proxy)

    return proxy
  }

  let publicState = getProxy(rawState) 

  const listeners = new Map();

  let history = [];
  let future = [];

  let batchDepth = 0;
  let batchCommands = [];

  // Stuff for event listeners to work.

  const onChange = (fn, path = "") => {
    if (typeof fn !== "function") {
      throw new Error("onChange: Listener must be a function");
    }

    if(!listeners.has(path)) {
      listeners.set(path, new Set());
    }

    listeners.get(path).add(fn);
  }

  const offChange = (fn, path = "") => {
    if(typeof fn !== "function") {
      throw new Error("offChange: Listener must be a function")
    }

    const set = listeners.get(path);
    if(!set) return;

    set.delete(fn);
    
    if(set.size === 0)
      listeners.delete(path);
  }

  const notify = (change) => {
    const path = change.path;
    const callFunctions = new Set();
    for(const[key, fns] of listeners) {
      if(key === "" || key.startsWith(`${path}.`) || key === path || path.startsWith(`${key}.`)) {
        for (const fn of fns) {
          callFunctions.add(fn);
        }
      }
    }
    callFunctions.forEach(fn => {
      try {
        fn(change);
      } catch(err) {
        console.error(err);
      }
    });
  }

  const redo = () => {
    if(future.length === 0) {
      return;
    }

    let command = future.pop();

    command.execute(); 
    pushToHistory(command);
  }

  const undo = () => {
    if(history.length === 0) {
      return;
    }

    let command = history.pop();
    command.undo(); 
    future.push(command);
  }

  // Batch function

  const batch = (fn) => {
    if(typeof fn !== "function") {
      throw new Error("batch: argument must be a function");
    }

    const snapShot = structuredClone(rawState);

    batchDepth += 1;
    try{
      fn();
    } catch(err) {
      Object.keys(rawState).forEach(k => delete rawState[k]);
      Object.assign(rawState, structuredClone(snapShot));
      batchCommands = [];
      batchDepth = 0;
      throw err;
    }
    batchDepth -= 1;

    if(batchDepth === 0 && batchCommands.length > 0) {
      const commands = [...batchCommands];
      future = [];
      const batchCommand = createBatchCommand(commands); 
      pushToHistory(batchCommand);
      batchCommands = [];
    }
  }


  // Stuff to edit JSON data.

  const log = () => {
    console.log(JSON.stringify(rawState, null, 2));
  };

  const set = (path, newValue) => {
    const {parent, key } = traverseToParent(path, true);
    const existed = key in parent;
    const oldValue = parent[key];

    let command = createSetCommand(path, oldValue, newValue, existed);
    let didChange = command.execute();
    if(!didChange) return; 

    future = [];

    if(batchDepth > 0) {
      batchCommands.push(command);
    } else {
      pushToHistory(command);
    }
  }

  const createBatchCommand = (commands) => {
    const execute = () => { commands.forEach(command => command.execute()) }
    const undo = () => {
      for(let i = commands.length - 1; i >= 0; i--) {
        commands[i].undo();
      }
    }

    return {execute, undo};
  }

  const createSetCommand = (path, oldValue, newValue, existed) => {
    const execute = () => {
      let change = applySet(path, newValue);
      if(change) {
        notify(change);
        return true;
      }
      return false;
    }

    const undo = () => {
      let change = null;
      if(!existed) {
        change = applyDelete(path);
      } else {
        change = applySet(path, oldValue);
      }
      if(change) {
        notify(change);
        return true;  
      }
      return false;
    }


    return {execute, undo};
  }

  const createDeleteCommand = (path, oldValue) => {
    const execute = () => {
      let change = applyDelete(path);
      if(change) {
        notify(change);
        return true;   
      }
      return false;
    }

    const undo = () => {
      let change = applySet(path, oldValue);
      if(change) {
        notify(change);
        return true;
      }
      return false;
    }

    return {execute, undo};
  }

  const applySet = (path, newValue) => {
    const {parent, key } = traverseToParent(path, true);

    const existed = key in parent;
    const oldValue = parent[key];

    if(existed && Object.is(oldValue, newValue)) return;

    parent[key] = newValue;

    const change = {
      type: existed ? "update" : "add",
      path,
      oldValue,
      newValue
    }

    return change;
  }


  const deleteKey = (path) => {
    const {parent, key } = traverseToParent(path, false);

    if(!(key in parent)) {
      throw new Error(`${key} does not exist`);
    }
    const oldValue = parent[key];

    const command = createDeleteCommand(path, oldValue);
    const didChange = command.execute();

    if(!didChange) return;

    future = [];

    if(batchDepth > 0) {
      batchCommands.push(command);
    } else {
      pushToHistory(command);
    }
  }

  const update = (path, updater) => {
    if(typeof updater !== 'function') {
      throw new Error(`argument should be a function`);
    }

    const oldValue = get(path);
    const newValue = updater(oldValue);

    set(path, newValue);
  }

  const replace = (newState) => {
    if(typeof newState !== "object" || newState == null) {
      throw new Error("replace: state must be an object")
    }

    if(Object.is(rawState, newState)) return;

    const oldState = structuredClone(rawState);

    const command = {
      execute() {
        Object.keys(rawState).forEach(k => delete rawState[k]);
        Object.assign(rawState, structuredClone(newState));

        notify({
          type: "replace",
          path: "",
          oldValue: oldState,
          newValue: structuredClone(newState)
        })
      },

      undo() {
        Object.keys(rawState).forEach(k => delete rawState[k]);
        Object.assign(rawState, structuredClone(oldState));

        notify({
          type: "replace",
          path: "",
          oldValue: structuredClone(newState),
          newValue: oldState
        })
      }
    }

    command.execute();
    future = [];
    pushToHistory(command);
  }

  const clearHistory = () => {
    history = [];
    future = [];
  }

  const applyDelete = (path) => {
    const {parent, key } = traverseToParent(path, false);

    if(!(key in parent)) {
      throw new Error(`${key} does not exist`);
    }

    const oldValue = parent[key];

    delete parent[key];

    const change = {
      type: "delete",
      path,
      oldValue,
      newValue: undefined
    }

    return change;
  }

  const get = (path) => {
    const {parent, key} = traverseToParent(path);

    if(!(key in parent)) throw new Error(`${key} does not exist`)

    return structuredClone(parent[key]);
  }

  const has = (path) => {
    try {
      const {parent, key} = traverseToParent(path);
      return key in parent;
    } catch {
      return false;
    }
  }

  // helper functions

  const pushToHistory = (command) => {
      if(history.length >= MAX_HISTORY) {
        history.shift();
      }
      history.push(command);
  }

  const checkInvalidPath = (path) => {
    if(!path || typeof path !== "string"){
      throw new Error("Invalid path name");
    }
  }

  const isNotObject = (attr) => typeof attr !== "object" || attr === null

  const traverseToParent = (path, createMissing = false) => {
    checkInvalidPath(path);

    let attributes = path.split(".");
    let pointer = rawState;

    for(let i = 0; i < attributes.length - 1; i++) {
      const attribute = attributes[i];

      if(attribute in pointer) {
        if(isNotObject(pointer[attribute])) {
          throw new Error (`${attribute} is not an object.`)
        }
      } else {
        if(createMissing) {
          pointer[attribute] = {};
        }

        else throw new Error (`${attribute} does not exist`);
      }
      pointer = pointer[attribute];
    }

    const attribute = attributes[attributes.length - 1];
    return {parent: pointer, key: attribute };
  }
  
  return {
    state: publicState,
    log,
    set,
    deleteKey,
    onChange,
    offChange,
    get,
    undo,
    redo,
    batch,
    has,
    update,
    replace,
    clearHistory
  }
   
}

export default createJSONEngine;
