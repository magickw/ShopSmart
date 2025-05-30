import { ScanHistory, ProductResponse } from "@/lib/types";
import { formatDate } from "@/lib/api";

interface HistoryItemProps {
  item: ScanHistory;
  onView: () => void;
}

export default function HistoryItem({ item, onView }: HistoryItemProps) {
  const product = item.productData as ProductResponse;

  if (!product) {
    return null;
  }

  const bestPriceStore = product.stores?.find(store => store.isBestPrice);
  const firstImage = product.images?.[0];

  return (
    <div
      className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
      onClick={onView}
    >
      <div className="flex items-start space-x-3">
        {firstImage ? (
          <img
            src={firstImage}
            alt={product.title}
            className="w-12 h-12 object-cover rounded-lg bg-neutral-100"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-12 h-12 bg-neutral-200 rounded-lg flex items-center justify-center">
            <span className="material-icons text-neutral-400 text-lg">image</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-neutral-900 truncate">
            {product.title}
          </h3>

          {product.brand && (
            <p className="text-xs text-neutral-600 mt-1">{product.brand}</p>
          )}

          {bestPriceStore && (
            <div className="flex items-center mt-1">
              <span className="text-sm font-semibold text-green-600">
                ${bestPriceStore.price}
              </span>
              {bestPriceStore.link ? (
                <a
                  href={bestPriceStore.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-500 ml-1 hover:text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  at {bestPriceStore.name}
                </a>
              ) : (
                <span className="text-xs text-neutral-500 ml-1">
                  at {bestPriceStore.name}
                </span>
              )}
            </div>
          )}

          <p className="text-xs text-neutral-500 mt-1">
            Scanned {formatDate(item.scannedAt)}
          </p>
        </div>

        <div className="text-right flex items-center">
          <span className="text-xs text-neutral-400">#{product.barcode}</span>
          <span className="material-icons text-neutral-400 text-lg ml-2">
            chevron_right
          </span>
        </div>
      </div>
    </div>
  );
}
