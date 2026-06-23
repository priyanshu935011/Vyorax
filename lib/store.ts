import { create } from "zustand";
import { persist } from "zustand/middleware";
import { resolvePincodeToCity, calculateDeliveryDate } from "./delivery";

// --- CART STORE ---
export interface CartItem {
  id: string;
  name: string;
  slug: string;
  price: number; // in paise
  image: string;
  quantity: number;
  stock: number;
  sku: string;
  isCycle?: boolean;
  isGift?: boolean;
  originalPrice?: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  setItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),
      addItem: (item, quantity = 1) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);

        if (existingItem) {
          const newQty = existingItem.quantity + quantity;
          if (newQty > item.stock) {
            alert(`Only ${item.stock} items in stock!`);
            return;
          }
          set({
            items: currentItems.map((i) =>
              i.id === item.id ? { ...i, quantity: newQty } : i
            ),
            isOpen: true, // open drawer on add
          });
        } else {
          if (quantity > item.stock) {
            alert(`Only ${item.stock} items in stock!`);
            return;
          }
          set({
            items: [...currentItems, { ...item, quantity }],
            isOpen: true, // open drawer on add
          });
        }
      },
      removeItem: (id) =>
        set({
          items: get().items.filter((i) => i.id !== id),
        }),
      updateQuantity: (id, quantity) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;

        if (quantity > item.stock) {
          alert(`Only ${item.stock} items in stock!`);
          return;
        }

        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getCartTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      setItems: (items) => set({ items }),
    }),
    {
      name: "vega-cart-storage",
    }
  )
);

// --- WISHLIST STORE ---
interface WishlistState {
  items: string[]; // array of product IDs
  toggleItem: (id: string) => void;
  hasItem: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: (id) => {
        const current = get().items;
        const exists = current.includes(id);
        if (exists) {
          set({ items: current.filter((item) => item !== id) });
        } else {
          set({ items: [...current, id] });
        }
      },
      hasItem: (id) => get().items.includes(id),
    }),
    {
      name: "vega-wishlist-storage",
    }
  )
);

// --- RECENTLY VIEWED STORE ---
export interface RecentlyViewedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  categoryName: string;
}

interface RecentlyViewedState {
  products: RecentlyViewedProduct[];
  addProduct: (product: RecentlyViewedProduct) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      products: [],
      addProduct: (product) => {
        const current = get().products;
        // Remove duplicate if exists
        const filtered = current.filter((p) => p.id !== product.id);
        // Add to front of queue (FIFO, max 8)
        const updated = [product, ...filtered].slice(0, 8);
        set({ products: updated });
      },
    }),
    {
      name: "vega-recently-viewed-storage",
    }
  )
);

// --- PRODUCT COMPARISON STORE ---
export interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  specs: Record<string, any>;
  brand?: string;
  assemblyDifficulty?: number;
}

interface CompareState {
  products: CompareProduct[];
  addProduct: (product: CompareProduct) => void;
  removeProduct: (id: string) => void;
  clearCompare: () => void;
  hasProduct: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      products: [],
      addProduct: (product) => {
        const current = get().products;
        if (current.find((p) => p.id === product.id)) return;
        if (current.length >= 3) {
          alert("You can compare up to 3 products at a time. Remove one to add another.");
          return;
        }
        set({ products: [...current, product] });
      },
      removeProduct: (id) =>
        set({
          products: get().products.filter((p) => p.id !== id),
        }),
      clearCompare: () => set({ products: [] }),
      hasProduct: (id) => get().products.some((p) => p.id === id),
    }),
    {
      name: "vega-compare-storage",
    }
  )
);

// --- AI CHAT STORE ---
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIChatState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  messages: ChatMessage[];
  isLoading: boolean;
  clearChat: () => void;
  sendMessage: (content: string, productContext?: any, cartContext?: any) => Promise<void>;
}

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content: "Namaste! I am your Vyorax Shopping Assistant. 🚴\n\nHow can I help you today? I can recommend cycles, compare gear, estimate sizing, or check order delivery details! Try asking me:\n\n* *'Find me a hybrid cycle under ₹30,000'* \n* *'What gear is best for beginner fitness?'* \n* *'Compare Aero-X with Ranchi Rider'*",
        },
      ],
      isLoading: false,
      clearChat: () =>
        set({
          messages: [
            {
              id: "welcome",
              role: "assistant",
              content: "Namaste! I am your Vyorax Shopping Assistant. 🚴\n\nHow can I help you today?",
            },
          ],
        }),
      sendMessage: async (content, productContext = null, cartContext = null) => {
        const userMsg: ChatMessage = {
          id: `msg-${Date.now()}-user`,
          role: "user",
          content,
        };

        const currentMessages = get().messages;
        set({
          messages: [...currentMessages, userMsg],
          isLoading: true,
        });

        // Initialize assistant placeholder message for streaming
        const assistantMsgId = `msg-${Date.now()}-assistant`;
        const assistantMsgPlaceholder: ChatMessage = {
          id: assistantMsgId,
          role: "assistant",
          content: "",
        };

        set((state) => ({
          messages: [...state.messages, assistantMsgPlaceholder],
        }));

        try {
          // Send request to API route
          const apiMessages = [...currentMessages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          }));

          const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: apiMessages,
              productContext,
              cartContext,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to connect to AI server");
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let assistantContent = "";

          if (reader) {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value);
              assistantContent += chunk;

              // Update the assistant message in real-time
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: assistantContent } : m
                ),
              }));
            }
          }
        } catch (error) {
          console.error("AI chat error:", error);
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content:
                      "I'm sorry, I encountered a connection issue. Please check your internet connection or verify your Anthropic API Key configuration in settings.",
                  }
                : m
            ),
          }));
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "vega-ai-chat-storage",
    }
  )
);

// --- PINCODE STORE ---
export interface PincodeState {
  verifiedPincode: string | null;
  status: "idle" | "checking" | "serviceable" | "unserviceable";
  deliveryMessage: string;
  isModalOpen: boolean;
  pendingAddItem: (() => void) | null;
  setPendingAddItem: (action: (() => void) | null) => void;
  setIsModalOpen: (open: boolean) => void;
  checkPincode: (pincode: string) => Promise<boolean>;
  initializePincode: () => void;
}

export const usePincodeStore = create<PincodeState>()(
  (set) => ({
    verifiedPincode: null,
    status: "idle",
    deliveryMessage: "",
    isModalOpen: false,
    pendingAddItem: null,
    setPendingAddItem: (pendingAddItem) => set({ pendingAddItem }),
    setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
    checkPincode: async (pincode: string) => {
      if (!pincode || pincode.trim().length !== 6 || isNaN(Number(pincode))) {
        set({ status: "unserviceable", deliveryMessage: "Please enter a valid 6-digit pincode." });
        return false;
      }

      const cleanPin = pincode.trim();
      const resolvedCity = resolvePincodeToCity(cleanPin);

      if (resolvedCity) {
        set({ status: "checking", deliveryMessage: "" });
        try {
          const response = await fetch(`/api/delivery/check?pincode=${cleanPin}`);
          const data = await response.json();
          if (data.serviceable) {
            localStorage.setItem("vega_verified_pincode", cleanPin);
            set({ 
              verifiedPincode: cleanPin, 
              status: "serviceable", 
              deliveryMessage: `✓ Deliverable to ${data.city || resolvedCity} ${cleanPin}. Delivers by ${data.deliveryDate}` 
            });
            return true;
          } else {
            set({ status: "unserviceable", deliveryMessage: data.message || `❌ Pincode ${cleanPin} is outside our delivery zone.` });
            return false;
          }
        } catch (e) {
          localStorage.setItem("vega_verified_pincode", cleanPin);
          let deliveryDays = 2;
          
          const simSettingsStr = localStorage.getItem("vega_sim_settings");
          if (simSettingsStr) {
            try {
              const simSettings = JSON.parse(simSettingsStr);
              const cities = simSettings.homepageConfig?.deliveryCities;
              if (Array.isArray(cities)) {
                const matched = cities.find((c: any) => {
                  const name = typeof c === "string" ? c : c.name || "";
                  return name.trim().toLowerCase() === resolvedCity.toLowerCase();
                });
                if (matched) {
                  deliveryDays = typeof matched === "string" ? 2 : matched.days ?? 2;
                }
              }
            } catch(err) {}
          }
          
          const formattedDate = calculateDeliveryDate(deliveryDays);
          set({ 
            verifiedPincode: cleanPin, 
            status: "serviceable", 
            deliveryMessage: `✓ Deliverable to ${resolvedCity} ${cleanPin}. Delivers by ${formattedDate}` 
          });
          return true;
        }
      } else {
        set({ 
          status: "unserviceable", 
          deliveryMessage: `❌ Out of delivery zone. Pincode ${cleanPin} is not serviceable.` 
        });
        return false;
      }
    },
    initializePincode: () => {
      if (typeof window === "undefined") return;
      const verified = localStorage.getItem("vega_verified_pincode");
      if (verified) {
        const resolvedCity = resolvePincodeToCity(verified);
        if (resolvedCity) {
          set({ verifiedPincode: verified, status: "serviceable" });
          return;
        } else {
          localStorage.removeItem("vega_verified_pincode");
        }
      }
      
      const savedAddr = localStorage.getItem("vega_saved_address");
      if (savedAddr) {
        try {
          const parsed = JSON.parse(savedAddr);
          if (parsed.pincode) {
            const cleanPin = parsed.pincode.trim();
            const resolvedCity = resolvePincodeToCity(cleanPin);
            if (resolvedCity) {
              localStorage.setItem("vega_verified_pincode", cleanPin);
              set({ verifiedPincode: cleanPin, status: "serviceable", deliveryMessage: `✓ Serving address pincode ${cleanPin}` });
            } else {
              set({ verifiedPincode: cleanPin, status: "unserviceable", deliveryMessage: `❌ Saved address pincode ${cleanPin} is out of active zone` });
            }
          }
        } catch(e) {}
      }
    }
  })
);

// --- SETTINGS STORE ---
interface SettingsState {
  freeShippingMin: number;
  emiConfig: any;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  freeShippingMin: 500000,
  emiConfig: null,
  isLoading: false,
  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        set({
          freeShippingMin: data.freeShippingMin ?? 500000,
          emiConfig: data.homepageConfig?.emiConfig || null,
        });
      } else {
        const saved = localStorage.getItem("vega_sim_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          set({
            freeShippingMin: (parsed.freeShippingMin || 5000) * 100,
            emiConfig: parsed.homepageConfig?.emiConfig || null,
          });
        }
      }
    } catch (e) {
      const saved = localStorage.getItem("vega_sim_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        set({
          freeShippingMin: (parsed.freeShippingMin || 5000) * 100,
          emiConfig: parsed.homepageConfig?.emiConfig || null,
        });
      }
    } finally {
      set({ isLoading: false });
    }
  }
}));
