import "./RecursiveJSON.css"

/**
 *      let jsonData = {
 *        1     a: 1,
 *          2     b: 3,
 *            3     c: {
 *              4       d: 2,
 *                5       e: 4
 *                  6     }
 *                    7   }
 *            }
 *      }
 **/

let tabs = 0;

const returnSpace = (num) => {
  return (Array.from({length: num}).map((_, i) => <span>1</span>))
}

export function DisplayJSON({ data , label = null}) {
  let myObj = data;
  let keys = Object.keys(data)
  let i = 0

  return (
    <div className="object__list">
    {
      <>
      { returnSpace(tabs)  }
      { label && <span>{label}</span> }
      {  keys.map((key) => {
        return (
        (typeof myObj[key] == 'array' || typeof myObj[key] == 'object') ?
          <DisplayJSON data={ myObj[key] } label= { key } /> :
          <div key={key}>{key} : {myObj[key]}</div>
        )
        })
      }
      </>
    }
    </div>  
  )
}

