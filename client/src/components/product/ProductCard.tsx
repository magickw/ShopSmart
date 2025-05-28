import { ProductResponse } from "@/lib/types";

interface ProductCardProps {
  product: ProductResponse;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      <div className="p-4">
        <div className="flex items-start">
          {/* Product image */}
          <div className="bg-neutral-200 rounded-lg w-24 h-24 flex items-center justify-center mr-4 flex-shrink-0">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="material-icons text-neutral-400 text-3xl">inventory_2</span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <span className="text-xs bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full">
                {product.category || "Product"}
              </span>
            </div>
            <h3 className="font-bold text-lg text-neutral-800 mb-1">{product.title}</h3>
            {product.brand && <p className="text-sm text-neutral-600 mb-2">{product.brand}</p>}
            <p className="text-sm text-neutral-500">
              Barcode: <span className="font-mono">{product.barcode}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
