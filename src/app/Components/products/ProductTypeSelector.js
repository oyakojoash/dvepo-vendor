
"use client";

const productTypes = [
  {
    value: "retail",
    title: "Retail",
    description: "Sell individual items to customers.",
    details: "Selling price and stock",
    icon: "🛍️",
  },
  {
    value: "wholesale",
    title: "Wholesale",
    description: "Sell goods in bulk to buyers.",
    details: "Unit price and minimum quantity",
    icon: "📦",
  },
  {
    value: "subscription",
    title: "Subscription",
    description: "Sell recurring services or access.",
    details: "Recurring price and billing interval",
    icon: "🔄",
  },
];

export default function ProductTypeSelector({
  selectedModel,
  onSelect,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {productTypes.map((type) => {
        const selected = selectedModel === type.value;

        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onSelect(type.value)}
            aria-pressed={selected}
            className={`rounded-xl border p-4 text-left transition ${
              selected
                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200"
                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
            }`}
          >
            <div className="mb-3 text-2xl" aria-hidden="true">
              {type.icon}
            </div>

            <h3 className="font-semibold text-gray-900">
              {type.title}
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              {type.description}
            </p>

            <p className="mt-3 text-xs text-gray-500">
              {type.details}
            </p>

            <span
              className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                selected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {selected ? "Selected" : "Choose type"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
