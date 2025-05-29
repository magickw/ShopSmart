import { ScanHistory, ProductResponse } from "@/lib/types";
import { formatDate } from "@/lib/api";

interface HistoryItemProps {
  item: ScanHistory;
  onView: () => void;
}

export default function HistoryItem({ item, onView }: HistoryItemProps) {
  const productData = item.productData as ProductResponse;
  
  // Find the best price store
  const bestPriceStore = productData.stores.find(store => store.isBestPrice);
  const lowestPrice = bestPriceStore ? bestPriceStore.price : 
    productData.stores.length > 0 ? productData.stores[0].price : "N/A";
  
  const storeName = bestPriceStore ? bestPriceStore.name : 
    productData.stores.length > 0 ? productData.stores[0].name : "";
  
  return (
    <div className="p-4 hover:bg-neutral-50 cursor-pointer" onClick={onView}>
      <div className="flex items-center">
        <div className="bg-neutral-100 rounded-lg w-12 h-12 flex items-center justify-center mr-3 flex-shrink-0">
          <span className="material-icons text-neutral-500">inventory_2</span>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-neutral-800 mb-0.5">{productData.title}</h3>
          <p className="text-sm text-neutral-600">{productData.brand || "Unknown brand"}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-neutral-800">${lowestPrice}</p>
          <p className="text-xs text-neutral-500"><a
                  href={store.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-blue-600"
                >{store.name}</a></p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          Scanned {formatDate(item.scannedAt.toString())}
        </p>
        <button className="text-xs text-primary font-medium">View</button>
      </div>
    </div>
  );
}
