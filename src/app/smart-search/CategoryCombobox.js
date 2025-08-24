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
    console.log("CategoryCombobox: Selecting category:", cat); // Debug log
    setSelected(cat.slug);
    setQuery(cat.display);
    setShow(false);
  };

  // مقدار اولیه input را با انتخاب فعلی sync کن
  useEffect(() => {
    if (selected && categories.length > 0) {
      const found = categories.find(cat => cat.slug === selected);
      if (found) {
        console.log("CategoryCombobox: Found selected category:", found); // Debug log
        setQuery(found.display);
      }
    }
  }, [selected, categories]);

  // Reset query when categories change
  useEffect(() => {
    if (categories.length > 0 && !selected) {
      setQuery("");
    }
  }, [categories, selected]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
        <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-auto mt-1">
          {filtered.map(cat => (
            <li
              key={cat.slug}
              className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
              onMouseDown={() => handleSelect(cat)}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{cat.display.split(' ')[0]}</span>
                <span className="text-gray-700 dark:text-gray-300">{cat.display.split(' ').slice(1).join(' ')}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
