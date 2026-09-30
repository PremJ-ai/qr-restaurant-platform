import React,{useMemo,useState} from "react";

const extra=(s)=>Number((s.match(/\+\s*(\d+)/)||[])[1]||0);

export default function ProductCard({product,onAdd}){
  const [expanded,setExpanded]=useState(false);
  const [qty,setQty]=useState(1);
  const [choices,setChoices]=useState(()=>{
    const initial={};
    (product.o||[]).forEach(([group,options,type])=>{
      initial[group]=type==="multi"?[]:options[0];
    });
    return initial;
  });

  const unitPrice=useMemo(()=>{
    return product.p+(product.o||[]).reduce((sum,[group,,type])=>{
      const value=choices[group];
      if(type==="multi") return sum+(Array.isArray(value)?value.reduce((s,item)=>s+extra(item),0):0);
      return sum+(value?extra(value):0);
    },0);
  },[choices,product]);

  const toggleOption=(group,option,type)=>{
    setChoices(prev=>{
      if(type==="multi"){
        const current=Array.isArray(prev[group])?prev[group]:[];
        return {...prev,[group]:current.includes(option)?current.filter(x=>x!==option):[...current,option]};
      }
      return {...prev,[group]:option};
    });
  };

  const selectedLabels=useMemo(()=>{
    return (product.o||[]).flatMap(([group,,type])=>{
      const value=choices[group];
      if(type==="multi") return Array.isArray(value)?value:[];
      return value?[value]:[];
    });
  },[choices,product]);

  const add=()=>{
    onAdd({
      key:product.id+"|"+selectedLabels.join("|"),
      name:product.n,
      img:product.img,
      unit:unitPrice,
      qty,
      choices:selectedLabels
    });
    setExpanded(true);
  };

  return (
    <article
      className={"product-card"+(expanded?" is-open":"")}
      tabIndex={0}
      onFocus={()=>setExpanded(true)}
      onClick={(event)=>{
        if(event.target.closest("button")) return;
        setExpanded(true);
      }}
    >
      <div className="product-media">
        <img src={product.img} alt={product.n}/>
        <div className="product-gradient"/>
        <div className="product-badge">★ {product.r}</div>
        <div className="product-price-pill">₹{unitPrice}</div>
      </div>

      <div className="product-body">
        <div className="product-title-row">
          <div>
            <h3>{product.n}</h3>
            <p>{product.d}</p>
          </div>
          <button className="quick-add" type="button" onClick={add}>+</button>
        </div>
        <div className="customize-hint">
          <span>Move over to customize</span>
          <span aria-hidden="true">↗</span>
        </div>
      </div>

      <div className="customize-drawer" onClick={event=>event.stopPropagation()}>
        <div className="customize-top">
          <div>
            <span className="ey">QUICK CUSTOMIZE</span>
            <strong>{product.n}</strong>
          </div>
          <span className="customize-price">₹{unitPrice*qty}</span>
        </div>

        {(product.o||[]).length===0 ? (
          <div className="no-options">This item has no extra customization. Choose your quantity and add it.</div>
        ) : (
          <div className="option-groups">
            {(product.o||[]).map(([group,options,type])=>(
              <div className="option-group" key={group}>
                <div className="option-label">
                  <b>{group}</b>
                  <span>{type==="multi"?"Select any":"Choose one"}</span>
                </div>
                <div className="option-buttons">
                  {options.map(option=>{
                    const active=type==="multi"
                      ? (choices[group]||[]).includes(option)
                      : choices[group]===option;
                    return (
                      <button
                        key={option}
                        type="button"
                        className={"option-button"+(active?" active":"")}
                        onClick={()=>toggleOption(group,option,type)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="customize-footer">
          <div className="inline-qty">
            <button type="button" onClick={()=>setQty(Math.max(1,qty-1))}>−</button>
            <b>{qty}</b>
            <button type="button" onClick={()=>setQty(Math.min(10,qty+1))}>+</button>
          </div>
          <button className="add-customized" type="button" onClick={add}>Add · ₹{unitPrice*qty}</button>
        </div>
      </div>
    </article>
  );
}
