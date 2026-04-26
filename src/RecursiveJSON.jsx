import "./RecursiveJSON.css"
import { useState, useRef } from 'react'

/**
 *      let jsonData = {
 *             a: 1,
 *             b: 3,
 *             c: {
 *                d: 2,
 *                e: 4
 *             }
 *            }
 *          }
 *      }
 **/

const getType = (data) => {
  let type = ""
  console.log(typeof data)
  if(Array.isArray(data)){
    return "[]"
  }
  switch (typeof data) {
    case 'object':
      type = '{}'
      break
  }
  return type
}

export function DisplayJSON({ data , label = null, depth = 0}) {
  let myObj = data;
  let keys = Object.keys(data)

  const [open, setOpen] = useState(true)
  console.log(data)
  let type = getType(myObj)

  return (
    <div className="object__list">
    {
      <>
        { label && <span style={{paddingLeft: `${depth * 12}px`}}>{label}: </span> }
          {type[0] && (<><span style={{paddingLeft: `${depth * 12}px`}}> {type[0]}</span><br/></>)}
          {  keys.map((key) => {
            return (
            (typeof myObj[key] == 'array' || typeof myObj[key] == 'object') ?
              (<DisplayJSON key={key} data={ myObj[key] } label= { key } depth={depth + 1} />) :
              (<div key={key}>
               {open && <span key={key} style={{paddingLeft: `${12 + depth * 12}px`}} >{key} : {myObj[key]}</span>}
               <br />
               </div>
              )
            )
          })
        }
      </>
    }
    {type[1] && <div style={{paddingLeft: `${12 + depth * 12}px`}} >{type[1]}</div>}
    </div>  
  )
}

