"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ShieldAlert, Check, HelpCircle, Layers, FolderPlus } from "lucide-react";
import { MOCK_CATEGORIES } from "@/lib/mockData";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  // Edit / Form states
  const [formId, setFormId] = useState<string | null>(null); // null means creating
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formParentId, setFormParentId] = useState<string>("");
  const [formGstRate, setFormGstRate] = useState<number>(18);

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
          setIsSimulationMode(false);
        } else {
          // Switch to localstorage/mock fallback
          console.warn("DB offline or unauthorized. Falling back to local/mock simulation.");
          loadSimulationData();
        }
      } catch (error) {
        console.warn("Categories API failed. Falling back to local/mock simulation.");
        loadSimulationData();
      } finally {
        setIsLoading(false);
      }
    }

    loadCategories();
  }, []);

  // Helper to load simulation data
  const loadSimulationData = () => {
    setIsSimulationMode(true);
    const saved = localStorage.getItem("vega_sim_categories");
    if (saved) {
      try {
        setCategories(JSON.parse(saved));
      } catch (e) {
        setCategories(MOCK_CATEGORIES);
      }
    } else {
      setCategories(MOCK_CATEGORIES);
      localStorage.setItem("vega_sim_categories", JSON.stringify(MOCK_CATEGORIES));
    }
  };

  // Auto-generate slug from name
  useEffect(() => {
    if (!formId) {
      const generated = formName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-");
      setFormSlug(generated);
    }
  }, [formName, formId]);

  const handleEditClick = (cat: any) => {
    setFormId(cat.id);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormParentId(cat.parentId || "");
    setFormGstRate(cat.gstRate || 18);
  };

  const handleCancelEdit = () => {
    setFormId(null);
    setFormName("");
    setFormSlug("");
    setFormParentId("");
    setFormGstRate(18);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: formId,
      name: formName.trim(),
      slug: formSlug.trim(),
      parentId: formParentId || null,
      gstRate: formGstRate,
    };

    if (isSimulationMode) {
      let updatedList = [...categories];
      if (formId) {
        // Update
        updatedList = updatedList.map((c) =>
          c.id === formId ? { ...c, name: payload.name, slug: payload.slug, parentId: payload.parentId, gstRate: payload.gstRate } : c
        );
        alert("Category simulated update successfully!");
      } else {
        // Create
        const newCat = {
          id: `cat-sim-${Date.now()}`,
          name: payload.name,
          slug: payload.slug,
          parentId: payload.parentId,
          gstRate: payload.gstRate,
          createdAt: new Date().toISOString(),
        };
        updatedList.push(newCat);
        alert("New category simulated creation successful!");
      }
      setCategories(updatedList);
      localStorage.setItem("vega_sim_categories", JSON.stringify(updatedList));
      handleCancelEdit();
    } else {
      // Real API CRUD
      setIsLoading(true);
      try {
        const method = formId ? "PUT" : "POST";
        const res = await fetch("/api/admin/categories", {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const savedCat = await res.json();
          if (formId) {
            setCategories(categories.map((c) => (c.id === formId ? savedCat : c)));
            alert("Category updated successfully!");
          } else {
            setCategories([...categories, savedCat]);
            alert("New category created successfully!");
          }
          handleCancelEdit();
        } else {
          alert("Failed to save category. DB response error.");
        }
      } catch (error: any) {
        alert("Failed to save category. Server error: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    const confirmMsg = cat.parentId 
      ? `Are you sure you want to delete the subcategory "${cat.name}"?`
      : `Warning: Deleting parent category "${cat.name}" will also delete all of its subcategories. Continue?`;

    if (!confirm(confirmMsg)) return;

    if (isSimulationMode) {
      let updatedList = [...categories];
      if (!cat.parentId) {
        // Parent deleted: cascade delete children
        updatedList = updatedList.filter((c) => c.id !== cat.id && c.parentId !== cat.id);
      } else {
        // Child deleted
        updatedList = updatedList.filter((c) => c.id !== cat.id);
      }
      setCategories(updatedList);
      localStorage.setItem("vega_sim_categories", JSON.stringify(updatedList));
      alert("Category simulated deletion completed.");
    } else {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/categories?id=${cat.id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          if (!cat.parentId) {
            setCategories(categories.filter((c) => c.id !== cat.id && c.parentId !== cat.id));
          } else {
            setCategories(categories.filter((c) => c.id !== cat.id));
          }
          alert("Category removed successfully from database.");
        } else {
          alert("Failed to delete category.");
        }
      } catch (error: any) {
        alert("Failed to delete category: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Get parent lists (skip subcategories to avoid recursive nesting loops)
  const availableParents = categories.filter((c) => !c.parentId && c.id !== formId);

  // Group categories into parent -> children structures
  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[var(--steel)]/40 pb-6">
        <div>
          <h1 className="text-2xl font-sans font-bold text-white uppercase tracking-wider">Manage Categories</h1>
          <p className="text-xs text-[var(--silver)] font-sans mt-1">Add, edit, restructure, and delete store categories and subcategories.</p>
        </div>
      </div>

      {/* Warning banner for simulation mode */}
      {isSimulationMode && (
        <div className="flex items-center space-x-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-300 font-sans">
          <ShieldAlert size={18} className="text-amber-400 flex-shrink-0" />
          <div>
            <span className="font-bold uppercase tracking-wider block mb-0.5">Simulation Mode Active</span>
            Database is currently offline. Category changes will persist inside browser localStorage for testing purposes.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT FORM COLUMN */}
        <div className="lg:col-span-4 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-6 space-y-6">
          <div className="flex items-center space-x-2 border-b border-[var(--steel)]/30 pb-3">
            <FolderPlus size={16} className="text-[var(--agni)]" />
            <h3 className="text-sm font-sans font-bold uppercase text-white">
              {formId ? "Edit Category" : "Add Category"}
            </h3>
          </div>

          <form onSubmit={handleSaveCategory} className="space-y-4">
            {/* Category Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Category Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Electric Cycles"
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] placeholder-neutral-600"
              />
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">URL Slug</label>
              <input
                type="text"
                required
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="e.g. electric-cycles"
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] placeholder-neutral-600"
              />
              <span className="text-[9px] text-[var(--smoke)] font-sans mt-0.5 block">Used for routing URLs (e.g. /products?category=slug).</span>
            </div>

            {/* Parent Category Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Parent Category</label>
              <select
                value={formParentId}
                onChange={(e) => setFormParentId(e.target.value)}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] font-sans"
              >
                <option value="">None (Top Level Category)</option>
                {availableParents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </select>
              <span className="text-[9px] text-[var(--smoke)] font-sans mt-0.5 block">Select a parent category to create a subcategory.</span>
            </div>

            {/* GST Rate selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">GST Rate (%)</label>
              <select
                value={formGstRate}
                onChange={(e) => setFormGstRate(parseInt(e.target.value))}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] font-sans"
              >
                <option value={5}>5% (Basic Goods / Services)</option>
                <option value={12}>12% (Standard)</option>
                <option value={18}>18% (Standard Plus / Parts)</option>
                <option value={28}>28% (Luxury / Premium Cycles)</option>
              </select>
              <span className="text-[9px] text-[var(--smoke)] font-sans mt-0.5 block">Select the GST percentage applicable to this category's products.</span>
            </div>

            {/* CTA Actions */}
            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-grow px-4 py-2.5 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-xs font-bold uppercase tracking-wider rounded transition-colors"
              >
                {formId ? "Update Category" : "Create Category"}
              </button>
              {formId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2.5 bg-[var(--carbon)] hover:bg-neutral-800 border border-[var(--steel)]/60 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT CATEGORIES LIST COLUMN */}
        <div className="lg:col-span-8 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-6 space-y-6">
          <div className="flex items-center space-x-2 border-b border-[var(--steel)]/30 pb-3">
            <Layers size={16} className="text-[var(--agni)]" />
            <h3 className="text-sm font-sans font-bold uppercase text-white">
              Category Hierarchy Tree
            </h3>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--steel)] border-t-[var(--agni)] animate-spin" />
              <p className="text-xs text-[var(--silver)] font-sans uppercase tracking-wider animate-pulse">Loading Tree Structure...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {parentCategories.map((parent) => {
                const subCats = categories.filter((c) => c.parentId === parent.id);
                return (
                  <div
                    key={parent.id}
                    className="border border-[var(--steel)]/40 hover:border-[var(--steel)]/80 rounded-xl p-4 bg-[var(--carbon)]/30 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Parent Item */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-white">
                            {parent.name} <span className="text-[10px] text-[var(--gold)] font-mono ml-1.5">({parent.gstRate || 18}% GST)</span>
                          </h4>
                          <span className="text-[9px] font-mono text-[var(--smoke)] mt-0.5 block">
                            slug: {parent.slug}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditClick(parent)}
                            className="p-1.5 hover:bg-white/10 rounded text-[var(--silver)] hover:text-white transition-colors"
                            title="Edit Parent Category"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(parent)}
                            className="p-1.5 hover:bg-red-500/10 rounded text-red-400 hover:text-red-300 transition-colors"
                            title="Delete Parent Category"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories list */}
                      <div className="mt-4 pt-3 border-t border-[var(--steel)]/20 space-y-2.5">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-[var(--smoke)] block">
                          Subcategories ({subCats.length})
                        </span>
                        
                        {subCats.length === 0 ? (
                          <span className="text-[10px] text-neutral-600 font-sans italic block pl-2">
                            No child subcategories
                          </span>
                        ) : (
                          <div className="space-y-1.5 pl-1.5">
                            {subCats.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex justify-between items-center group/sub py-1 px-2 rounded hover:bg-white/5 transition-colors"
                              >
                                <div className="min-w-0">
                                  <span className="text-xs font-sans font-medium text-neutral-300">
                                    ↳ {sub.name} <span className="text-[9px] text-[var(--gold-light)] font-mono font-normal ml-1">({sub.gstRate || 18}% GST)</span>
                                  </span>
                                  <span className="text-[8px] font-mono text-[var(--smoke)] block pl-3">
                                    {sub.slug}
                                  </span>
                                </div>
                                <div className="flex space-x-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEditClick(sub)}
                                    className="p-1 hover:bg-white/10 rounded text-[var(--silver)] hover:text-white transition-colors"
                                    title="Edit Subcategory"
                                  >
                                    <Edit size={10} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(sub)}
                                    className="p-1 hover:bg-red-500/15 rounded text-red-400 hover:text-red-300 transition-colors"
                                    title="Delete Subcategory"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {parentCategories.length === 0 && (
                <div className="col-span-2 py-10 text-center text-xs text-neutral-500 font-sans">
                  No categories found. Create one using the form on the left.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
