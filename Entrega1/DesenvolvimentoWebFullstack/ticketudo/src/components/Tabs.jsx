export default function Tabs({ options, value, onChange }) {
  return (
    <div className="filter-tabs" role="tablist">
      {options.map((option) => (
        <button
          role="tab"
          aria-selected={value === option.id}
          className={value === option.id ? 'filter-tab is-selected' : 'filter-tab'}
          onClick={() => onChange(option.id)}
          key={option.id}
        >
          {option.label}
          {typeof option.count === 'number' ? <em>{option.count}</em> : null}
        </button>
      ))}
    </div>
  )
}
