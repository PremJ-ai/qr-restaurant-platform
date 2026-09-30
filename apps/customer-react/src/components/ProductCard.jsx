import React, { useEffect, useMemo, useState } from "react";

const getExtra = (label = "") =>
  Number((String(label).match(/\+\s*(\d+)/) || [])[1] || 0);

const isMultiGroup = (type) => type === "multi";

export default function ProductCard({ product, onAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [options, setOptions] = useState(() => buildInitialOptions(product));

  const hasOptions = Array.isArray(product?.o) && product.o.length > 0;

  const unitPrice = useMemo(() => {
    if (!product) return 0;

    return (
      Number(product.p || 0) +
      (product.o || []).reduce((total, [group, , type]) => {
        const selected = options[group];

        if (isMultiGroup(type)) {
          return (
            total +
            (Array.isArray(selected)
              ? selected.reduce((sum, value) => sum + getExtra(value), 0)
              : 0)
          );
        }

        return total + getExtra(selected);
      }, 0)
    );
  }, [product, options]);

  const selectedLabels = useMemo(() => {
    return (product?.o || []).flatMap(([group, , type]) => {
      const selected = options[group];

      if (isMultiGroup(type)) {
        return Array.isArray(selected) ? selected : [];
      }

      return selected ? [selected] : [];
    });
  }, [product, options]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function buildInitialState() {
    return buildInitialOptions(product);
  }

  function handleCardClick(event) {
    if (event.target.closest("button")) return;

    setIsOpen(true);
  }

  function handlePointerEnter() {
    if (window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) {
      setIsOpen(true);
    }
  }

  function handlePointerLeave() {
    if (window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) {
      setIsOpen(false);
    }
  }

  function handleFocus() {
    setIsOpen(true);
  }

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  }

  function selectOption(group, value, type) {
    setOptions((current) => {
      if (isMultiGroup(type)) {
        const existing = Array.isArray(current[group]) ? current[group] : [];
        const next = existing.includes(value)
          ? existing.filter((item) => item !== value)
          : [...existing, value];

        return { ...current, [group]: next };
      }

      return { ...current, [group]: value };
    });
  }

  function changeQuantity(delta) {
    setQuantity((current) => Math.max(1, Math.min(10, current + delta)));
  }

  function addToCart() {
    const item = {
      key: `${product.id}|${selectedLabels.join("|")}`,
      name: product.n,
      img: product.img,
      unit: unitPrice,
      qty: quantity,
      choices: selectedLabels,
    };

    onAdd(item);
    setIsOpen(false);
  }

  return (
    <article
      className={`product-card${isOpen ? " is-open" : ""}`}
      tabIndex={0}
      aria-label={`${product.n}. ₹${unitPrice}. Customize and add to cart.`}
      onClick={handleCardClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className="product-media">
        <img src={product.img} alt={product.n} loading="lazy" />
        <div className="product-gradient" aria-hidden="true" />
        <div className="product-badge">★ {product.r}</div>
        <div className="product-price-pill">₹{unitPrice}</div>
      </div>

      <div className="product-body">
        <div className="product-title-row">
          <div>
            <h3>{product.n}</h3>
            <p>{product.d}</p>
          </div>

          <button
            className="quick-add"
            type="button"
            aria-label={`Quick add ${product.n}`}
            onClick={addToCart}
          >
            +
          </button>
        </div>

        <div className="customize-hint" aria-hidden="true">
          <span>{hasOptions ? "Hover to customize" : "Hover for quantity"}</span>
          <span>↗</span>
        </div>
      </div>

      <div
        className="customize-drawer"
        role="region"
        aria-label={`Customize ${product.n}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="customize-top">
          <div>
            <span className="ey">QUICK CUSTOMIZE</span>
            <strong>{product.n}</strong>
          </div>

          <span className="customize-price">₹{unitPrice * quantity}</span>
        </div>

        {hasOptions ? (
          <div className="option-groups">
            {product.o.map(([group, values, type]) => (
              <div className="option-group" key={group}>
                <div className="option-label">
                  <b>{group}</b>
                  <span>
                    {isMultiGroup(type) ? "Select any" : "Choose one"}
                  </span>
                </div>

                <div className="option-buttons">
                  {values.map((value) => {
                    const active = isMultiGroup(type)
                      ? (options[group] || []).includes(value)
                      : options[group] === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        className={`option-button${active ? " active" : ""}`}
                        aria-pressed={active}
                        onClick={() => selectOption(group, value, type)}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-options">
            No extra customization is available for this item. Choose a
            quantity and add it to your order.
          </div>
        )}

        <div className="customize-footer">
          <div className="inline-qty" aria-label="Quantity">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => changeQuantity(-1)}
            >
              −
            </button>
            <b aria-live="polite">{quantity}</b>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => changeQuantity(1)}
            >
              +
            </button>
          </div>

          <button className="add-customized" type="button" onClick={addToCart}>
            Add · ₹{unitPrice * quantity}
          </button>
        </div>
      </div>
    </article>
  );
}

function buildInitialOptions(product) {
  const initial = {};

  (product?.o || []).forEach(([group, values, type]) => {
    initial[group] = isMultiGroup(type) ? [] : values?.[0] ?? "";
  });

  return initial;
}
