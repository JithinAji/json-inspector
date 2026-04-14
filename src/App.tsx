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

function SetErrorState({ errValue  }) {
  return(
    errValue && <div className="error__message">{ errValue }</div>
  )
}

function CreateSetInput({ onSet  }) {
  const [path, setPath] = useState('')
  const [value, setValue] = useState('')

  return(
    <div>
      <input 
        placeholder="path (eg: x.y)" 
        value={path}
        onChange={(e) => setPath(e.target.value)}
      />
      <input 
        placeholder="value" 
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={() => onSet(path, value)}>
        Set
      </button>
    </div>
  )
}

function parseValue(value) {
  if(value.trim() === "") return ""

  if(value === "true") return true
  if(value === "false") return false

  if(value === "null") return null

  const num = Number(value)
  if(!isNaN(num)) return num

  return value
}

function App() {
  const engineRef = useRef(createJSONEngine(initialValue))

  const [err, setErr] = useState('')
  const [, setTick] = useState(0)

  const engine = engineRef.current

  const handleSet = (path, value) => {
    try {
      setErr("")
      let setValue = parseValue(value) 
      engine.set(path, setValue)
      setTick(t => t+1)
    }
    catch(e) {
      setErr(e.message)
      console.log(e)
    }
  }
  return (
    <div>
      <CreateSetInput onSet={handleSet} />
      <SetErrorState errValue={err} />
      <pre>{JSON.stringify(engine.state, null, 2)}</pre>
    </div>
  )
}

export default App
