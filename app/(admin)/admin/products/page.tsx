"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Edit, Trash2, ShieldAlert, Sparkles, Check } from "lucide-react";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/lib/mockData";

export default function AdminProductsPage() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Edit form states
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formPrice, setFormPrice] = useState(0); // in Rupees
  const [formStock, setFormStock] = useState(0);
  const [formCategory, setFormCategory] = useState("cat-cycles");
  const [formDescription, setFormDescription] = useState("");

  const handleEditClick = (p: any) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormPrice(p.price / 100);
    setFormStock(p.stock);
    setFormCategory(p.categoryId);
    setFormDescription(p.description || p.shortDescription);
    setIsEditing(true);
  };

  const handleAddNewClick = () => {
    setEditingProduct(null);
    setFormName("");
    setFormSku(`VYORAX-CYC-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormPrice(20000);
    setFormStock(5);
    setFormCategory("cat-cycles");
    setFormDescription("Premium lightweight hybrid machine engineered for high-performance city riding.");
    setIsEditing(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      // Edit existing product
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: formName,
              sku: formSku,
              price: formPrice * 100, // back to paise
              stock: formStock,
              categoryId: formCategory,
              description: formDescription,
            }
          : p
      );
      setProducts(updated as any);
      alert("Product details updated successfully!");
    } else {
      // Add new mock product
      const newProd = {
        id: `prod-${Date.now()}`,
        name: formName,
        slug: formName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        sku: formSku,
        price: formPrice * 100,
        stock: formStock,
        categoryId: formCategory,
        categoryName: formCategory === "cat-cycles" ? "Cycles" : formCategory === "cat-fitness" ? "Fitness" : "Sports",
        description: formDescription,
        shortDescription: formDescription.substring(0, 100),
        images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=400&auto=format&fit=crop"],
        comparePrice: null,
        brand: "Vyorax",
        tags: ["new"],
        specs: { Frame: "Carbon Alloy" },
        cycleSize: null,
        assemblyDifficulty: 1,
        whoIsThisFor: [],
        starterKit: [],
        relatedProducts: [],
        isActive: true,
        isFeatured: false,
        metaTitle: `${formName} — Vyorax`,
        metaDescription: formDescription,
        rating: 5,
        reviewsCount: 0,
      };
      setProducts([newProd as any, ...products]);
      alert("New product added to inventory database!");
    }

    setIsEditing(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Are you sure you want to delete this product from database?")) {
      setProducts(products.filter((p) => p.id !== id));
      alert("Product removed successfully.");
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[var(--steel)]/40 pb-6">
        <div>
          <h1 className="text-2xl font-sans font-bold text-white uppercase tracking-wider">Manage Products</h1>
          <p className="text-xs text-[var(--silver)] font-sans mt-1">Add, edit, adjust stock, and update cycle specs.</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleAddNewClick}
            className="px-4 py-2.5 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-xs font-sans font-bold uppercase tracking-wider rounded flex items-center space-x-1.5 transition-colors"
          >
            <Plus size={14} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* RENDER EDITOR PANEL */}
      {isEditing ? (
        <form onSubmit={handleSaveProduct} className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-6 sm:p-8 space-y-6 max-w-2xl">
          <h3 className="text-sm font-sans font-bold uppercase text-white border-b border-[var(--steel)]/30 pb-3 mb-2">
            {editingProduct ? `Edit: ${editingProduct.name}` : "Create New Product"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Product Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">SKU Identifier</label>
              <input
                type="text"
                required
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Price (₹)</label>
              <input
                type="number"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(parseFloat(e.target.value))}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Stock Level</label>
              <input
                type="number"
                required
                value={formStock}
                onChange={(e) => setFormStock(parseInt(e.target.value))}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Category Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] font-sans"
              >
                {MOCK_CATEGORIES.map((c) => {
                  const parent = c.parentId ? MOCK_CATEGORIES.find((p) => p.id === c.parentId) : null;
                  const displayName = parent ? `${parent.name} ➔ ${c.name}` : c.name;
                  return (
                    <option key={c.id} value={c.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Description</label>
            <textarea
              rows={4}
              required
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] font-sans leading-relaxed"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-xs font-bold uppercase tracking-wider rounded transition-colors"
            >
              Save Product
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 border border-[var(--steel)] hover:border-white text-white text-xs font-bold uppercase tracking-wider rounded transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* PRODUCT LIST TABLE */
        <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl overflow-hidden">
          <div className="w-full overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-[var(--steel)]/50 text-[var(--smoke)] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-16">Preview</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--steel)]/30">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--carbon)]/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 rounded bg-[var(--obsidian)] relative overflow-hidden">
                        <Image
                          src={p.images[0]}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-white max-w-[200px] truncate">{p.name}</td>
                    <td className="py-3 px-4 font-mono text-[var(--silver)]">{p.sku}</td>
                    <td className="py-3 px-4 text-white font-semibold">₹{(p.price / 100).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          p.stock === 0
                            ? "bg-red-950/40 text-red-400 border border-red-500/20"
                            : p.stock <= 3
                            ? "bg-[var(--gold)]/10 text-[var(--gold-light)] border-[var(--gold)]/20 animate-pulse"
                            : "bg-[var(--forest)]/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--silver)] capitalize">
                      {p.categoryId === "cat-cycles" ? "Cycles" : p.categoryId === "cat-fitness" ? "Fitness" : "Sports"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1.5 bg-[var(--carbon)] hover:bg-[var(--steel)] text-[var(--silver)] hover:text-white rounded transition-colors"
                          title="Edit Product"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 bg-[var(--carbon)] hover:bg-red-950/60 text-[var(--smoke)] hover:text-red-400 rounded transition-colors border border-transparent hover:border-red-500/20"
                          title="Delete Product"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
