import { StoreWithPrice } from "@/lib/types";
import { formatDate } from "@/lib/api";

interface StoreComparisonProps {
  store: StoreWithPrice;
}

export default function StoreComparison({ store }: StoreComparisonProps) {
  const dateText = store.updatedAt ? formatDate(store.updatedAt) : "Unknown";
  
  return (
    <div className="bg-white rounded-lg shadow-sm mb-3 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center mr-3">
              <span className="material-icons text-neutral-700">storefront</span>
            </div>
            <div>
              <h4 className="font-medium text-neutral-800"><a
                  href={store.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-blue-600"
                >{store.name}</a></h4>
              <p className="text-xs text-neutral-500">Updated: {dateText}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-neutral-800">${store.price}</p>
            
            {store.isBestPrice ? (
              <div className="flex items-center">
                <span className="text-xs bg-secondary bg-opacity-10 text-secondary px-2 py-0.5 rounded-full flex items-center">
                  <span className="material-icons text-xs mr-1">trending_down</span>
                  Best price
                </span>
              </div>
            ) : (
              <p className={`text-xs ${store.inStock > 0 ? "text-success" : "text-error"}`}>
                {store.inStock > 0 ? "In stock" : "Low stock"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
