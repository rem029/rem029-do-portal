import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SelectedModifierGroup {
  groupName: string
  selections: string[]
}

export interface CartLine {
  lineId: string
  itemId: string
  quantity: number
  selectedModifiers: SelectedModifierGroup[]
}

// Same item + same modifiers = one line (quantity bump); different modifiers = separate lines.
export const getCartLineId = (
  itemId: string,
  selectedModifiers: SelectedModifierGroup[] = [],
) => {
  if (selectedModifiers.length === 0) return itemId
  const normalized = [...selectedModifiers]
    .map((g) => ({ groupName: g.groupName, selections: [...g.selections].sort() }))
    .sort((a, b) => a.groupName.localeCompare(b.groupName))
  return `${itemId}::${JSON.stringify(normalized)}`
}

interface CartState {
  /**
   * The menu-page / event slug the current cart belongs to. The cart is
   * persisted in one localStorage key but is only valid for one ordering
   * surface at a time - `syncPage` wipes the table/seat/lines when the guest
   * moves to a different page so restaurant A's cart never rides along to
   * restaurant B.
   */
  pageKey: string | undefined
  tableId: string | undefined
  seatNumber: number | undefined
  /** Optional guest name. Follows the guest, not the table: survives table select/switch/reload; only clear() wipes it. */
  guestName: string
  /** Optional per-order note. Like guestName, but clear() also wipes it so it doesn't carry to the next order. */
  notes: string
  lines: CartLine[]
  /** Called by the menu shell on load. Resets the cart when the page/event slug changes. */
  syncPage: (pageKey: string) => void
  setTableId: (tableId: string) => void
  setSeatNumber: (seatNumber: number) => void
  setGuestName: (guestName: string) => void
  setNotes: (notes: string) => void
  addItem: (itemId: string, selectedModifiers?: SelectedModifierGroup[]) => void
  removeItem: (itemId: string, selectedModifiers?: SelectedModifierGroup[]) => void
  getQuantity: (itemId: string, selectedModifiers?: SelectedModifierGroup[]) => number
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      pageKey: undefined,
      tableId: undefined,
      seatNumber: undefined,
      guestName: '',
      notes: '',
      lines: [],
      // Guest landed on a different ordering page than the persisted cart belongs
      // to - drop the table, seat, items and note. guestName follows the guest.
      syncPage: (pageKey: string) => {
        if (get().pageKey === pageKey) return
        set({ pageKey, tableId: undefined, seatNumber: undefined, lines: [], notes: '' })
      },
      // No-op if the same table is re-set (QR reload). A real switch drops the seat
      // (table-specific); name/notes are left alone - they follow the guest.
      setTableId: (tableId: string) => {
        if (get().tableId === tableId) return
        set({ tableId, seatNumber: undefined })
      },
      setSeatNumber: (seatNumber: number) => set({ seatNumber }),
      setGuestName: (guestName: string) => set({ guestName }),
      setNotes: (notes: string) => set({ notes }),
      addItem: (itemId: string, selectedModifiers: SelectedModifierGroup[] = []) => {
        const lineId = getCartLineId(itemId, selectedModifiers)
        const lines = [...get().lines]
        const existing = lines.find((l) => l.lineId === lineId)
        if (existing) {
          existing.quantity += 1
        } else {
          lines.push({ lineId, itemId, quantity: 1, selectedModifiers })
        }
        set({ lines })
      },
      removeItem: (itemId: string, selectedModifiers: SelectedModifierGroup[] = []) => {
        const lineId = getCartLineId(itemId, selectedModifiers)
        const lines = get()
          .lines.map((l) => (l.lineId === lineId ? { ...l, quantity: l.quantity - 1 } : l))
          .filter((l) => l.quantity > 0)
        set({ lines })
      },
      getQuantity: (itemId: string, selectedModifiers: SelectedModifierGroup[] = []) =>
        get().lines.find((l) => l.lineId === getCartLineId(itemId, selectedModifiers))
          ?.quantity || 0,
      clear: () => set({ lines: [], notes: '' }),
    }),
    { name: 'fnb-cart' },
  ),
)
