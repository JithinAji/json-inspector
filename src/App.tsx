import { useState } from 'react'
import './App.css'
import createJSONEngine from './utils/json-engine.js'
import { DisplayJSON  } from './RecursiveJSON'

function App() {
  const [count, setCount] = useState(0)

  let jsonData = {
    a: 1,
    b: 3,
    c: {
      d: 2,
      e: 4
    }
  }
  let value = createJSONEngine(jsonData)

  return (
    <div>
      <DisplayJSON data={value.state}></DisplayJSON>
    </div>
  )
}

export default App
