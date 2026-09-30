import React from 'react';
import '../styles/search-filter.css';

const CATEGORIES = [
  'All',
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Other',
];

export default function SearchFilter({
  search,
  onSearchChange,
  category,
  onCategoryChange,
}) {
  return (
    <div className="search-filter">
      <div className="search-input-wrapper">
        <span className="search-input-icon" aria-hidden="true">
          🔍
        </span>
        <input
          type="search"
          className="search-input"
          placeholder="Search events by name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search events by name"
        />
      </div>

      <div className="category-pills" role="tablist" aria-label="Event categories">
        {CATEGORIES.map((cat) => {
          const isActive = (category || 'All') === cat;
          const pillClass = isActive
            ? 'category-pill category-pill-active'
            : 'category-pill category-pill-inactive';

          return (
            <button
              key={cat}
              type="button"
              className={pillClass}
              onClick={() => onCategoryChange(cat)}
              role="tab"
              aria-selected={isActive}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
