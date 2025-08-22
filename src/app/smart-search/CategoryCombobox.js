"use client";
import { useState, useRef, useEffect } from "react";

export default function CategoryCombobox({ categories, selected, setSelected }) {
  const [query, setQuery] = useState("");
  const [show, setShow] = useState(false);
  const inputRef = useRef();

  // فیلتر دسته‌بندی‌ها بر اساس تایپ کاربر
  const filtered = query === ""
    ? categories
    : categories.filter(cat =>
        cat.display.toLowerCase().includes(query.toLowerCase())
      );

  // انتخاب گزینه با کلیک یا Enter
  const handleSelect = (cat) => {
    setSelected(cat.slug);
    setQuery(cat.display);
    setShow(false);
  };

  // مقدار اولیه input را با انتخاب فعلی sync کن
  useEffect(() => {
    if (selected) {
      const found = categories.find(cat => cat.slug === selected);
      if (found) setQuery(found.display);
    }
  }, [selected, categories]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        className="w-full p-2 border rounded"
        placeholder="جستجو و انتخاب دسته‌بندی..."
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 100)}
      />
      {show && filtered.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-60 overflow-auto mt-1">
          {filtered.map(cat => (
            <li
              key={cat.slug}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
              onMouseDown={() => handleSelect(cat)}
            >
              {cat.display}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
