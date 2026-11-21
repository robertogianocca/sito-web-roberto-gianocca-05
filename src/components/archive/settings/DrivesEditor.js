"use client";

import { dropCapacity, moveCapacity, sortAlpha, useListEditor } from "./listEditing";
import { AddField, CrossIcon, RenameField, sectionLabelClass } from "./ListFields";
import { TOUCH_TARGET } from "@/components/studio/ui/touch";

/**
 * Drives with their capacity ("4 TB"). Renaming or removing a drive carries
 * its capacity along.
 */
export function DrivesEditor({ drives, capacities, onChangeDrives, onChangeCapacities, onRename }) {
  const editor = useListEditor({
    items: drives,
    onChange: onChangeDrives,
    onRename: (from, to) => {
      onRename?.(from, to);
      onChangeCapacities(moveCapacity(capacities, from, to));
    },
    onRemoved: (name) => onChangeCapacities(dropCapacity(capacities, name)),
  });

  return (
    <section>
      <p className={sectionLabelClass}>Drives</p>
      <div className="mb-2 space-y-2">
        {drives.length === 0 && <span className="text-xs italic text-zinc-400">No items yet</span>}
        {sortAlpha(drives).map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2"
          >
            <div className="min-w-0 flex-1">
              {editor.editing === item ? (
                <RenameField
                  value={editor.editValue}
                  onChange={editor.setEditValue}
                  onConfirm={editor.confirmEdit}
                  onCancel={editor.cancelEdit}
                />
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Rename ${item}`}
                    onClick={() => editor.startEdit(item)}
                    className="truncate text-left text-xs font-medium text-zinc-700 transition hover:text-zinc-900"
                  >
                    {item}
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${item}`}
                    onClick={() => editor.remove(item)}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700 ${TOUCH_TARGET}`}
                  >
                    <CrossIcon className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
            </div>
            <input
              className="w-24 shrink-0 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-foreground placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:ring-1 focus:ring-zinc-300"
              value={capacities[item] ?? ""}
              onChange={(e) => onChangeCapacities({ ...capacities, [item]: e.target.value })}
              placeholder="4 TB"
              aria-label={`Capacity for ${item}`}
            />
          </div>
        ))}
      </div>
      <AddField
        value={editor.newValue}
        onChange={editor.setNewValue}
        onAdd={editor.add}
        placeholder="Add drive…"
        label="New drive"
      />
    </section>
  );
}
