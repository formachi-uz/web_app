import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem } from './db'

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (index: number) => void
  updateQty: (index: number, qty: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const items = get().items
        const existing = items.findIndex(
          (i) => i.product_id === item.product_id && i.size === item.size
        )
        if (existing >= 0) {
          const updated = [...items]
          updated[existing].qty += item.qty
          set({ items: updated })
        } else {
          set({ items: [...items, item] })
        }
      },

      removeItem: (index) => {
        const items = get().items.filter((_, i) => i !== index)
        set({ items })
      },

      updateQty: (index, qty) => {
        const items = [...get().items]
        if (qty <= 0) {
          items.splice(index, 1)
        } else {
          items[index].qty = qty
        }
        set({ items })
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, item) => sum + item.price * item.qty, 0),

      count: () =>
        get().items.reduce((sum, item) => sum + item.qty, 0),
    }),
    { name: 'formachi-cart' }
  )
)
