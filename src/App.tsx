import { useState, useRef } from 'react'
import './App.css'
import createJSONEngine from './utils/json-engine.js'

let initialValue = {
  a: 1,
  b: 3,
  c: {
    d: 2,
    e: 4
  }
}

function CreateSetInput({ onSet  }) {
  const [path, setPath] = useState('')
  const [value, setValue] = useState('')

  return(
    <div>
      <input 
        placholder="path (eg: a.b)" 
        value={path}
        onChange={(e) => setPath(e.target.value)}
      />
      <input 
        placholder="value" 
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={() => onSet(path, value)}>
        Set
      </button>
    </div>
  )
}

function App() {
  const engineRef = useRef(createJSONEngine(initialValue))

  const [, setTick] = useState(0)

  const engine = engineRef.current

  const handleSet = (path, value) => {
    try {
      engine.set(path, value)
      setTick(t => t+1)
    }
    catch(e) {
      console.log(e)
    }
  }
  return (
    <div>
      <CreateSetInput onSet={handleSet} />
     <pre>{JSON.stringify(engine.state, null, 2)}</pre>
    </div>
  )
}

export default App
