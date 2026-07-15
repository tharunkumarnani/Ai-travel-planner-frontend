import { useMemo, useState } from 'react'
import type { PackingItem } from '../types'

interface PackingListProps {
  items: PackingItem[]
}

export function PackingList({ items }: PackingListProps) {
  const [checkedOverrides, setCheckedOverrides] = useState<Record<string, boolean>>({})

  const itemKey = (item: PackingItem, index: number) => item._id ?? `${item.item}-${index}`

  const packedCount = useMemo(
    () =>
      items.filter((item, index) => {
        const key = itemKey(item, index)
        return checkedOverrides[key] ?? Boolean(item.isPacked)
      }).length,
    [checkedOverrides, items],
  )

  const groupedItems = useMemo(() => {
    return items.reduce<Record<string, PackingItem[]>>((groups, item) => {
      const category = item.category || 'Essentials'
      groups[category] = [...(groups[category] ?? []), item]
      return groups
    }, {})
  }, [items])

  if (items.length === 0) {
    return <p className="empty-copy">No packing items were generated for this trip.</p>
  }

  return (
    <div className="packing-list">
      <div className="packing-progress">
        <span>{packedCount} packed</span>
        <strong>{items.length} total</strong>
      </div>

      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <section className="packing-group" key={category}>
          <h4>{category}</h4>
          {categoryItems.map((item, index) => {
            const key = item._id ?? `${item.item}-${index}`
            const isChecked = checkedOverrides[key] ?? Boolean(item.isPacked)

            return (
              <label className="packing-item" key={key}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() =>
                    setCheckedOverrides((current) => ({
                      ...current,
                      [key]: !isChecked,
                    }))
                  }
                />
                <span>{item.item}</span>
              </label>
            )
          })}
        </section>
      ))}
    </div>
  )
}
