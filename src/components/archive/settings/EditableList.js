"use client";

import { sortAlpha, useListEditor } from "./listEditing";
import {
  AddField,
  CrossIcon,
  ListNotice,
  RemovalPrompt,
  RenameField,
  UnlistedNames,
  UsageCount,
  sectionLabelClass,
} from "./ListFields";
import { TOUCH_TARGET } from "@/components/studio/ui/touch";

/**
 * A list of names shown as pills: click a name to rename it, × to remove.
 * `usageOf(name)` is how many projects use it; removing a used name asks
 * whether to remove it from those projects too (`onRemoveFromProjects`).
 * `unlisted` are names projects use that the list lacks.
 */
export function EditableList({
  label,
  items,
  onChange,
  onRename,
  usageOf = () => 0,
  unlisted = [],
  onRemoveFromProjects,
}) {
  const editor = useListEditor({
    items,
    onChange,
    onRename,
    usageOf,
    onRemoved: (name, { fromProjects }) => {
      if (fromProjects) onRemoveFromProjects?.(name);
    },
  });

  return (
    <section>
      <p className={sectionLabelClass}>{label}</p>
      {editor.pendingRemoval && (
        <RemovalPrompt
          name={editor.pendingRemoval}
          count={usageOf(editor.pendingRemoval)}
          onConfirm={editor.confirmRemoval}
          onCancel={editor.cancelRemoval}
        />
      )}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {items.length === 0 && <span className="text-xs italic text-zinc-400">No items yet</span>}
        {sortAlpha(items).map((item) =>
          editor.editing === item ? (
            <span key={item} className="flex items-center gap-1 rounded-full bg-zinc-200 px-2 py-0.5">
              <RenameField
                compact
                value={editor.editValue}
                onChange={editor.setEditValue}
                onConfirm={editor.confirmEdit}
                onCancel={editor.cancelEdit}
              />
            </span>
          ) : (
            <span
              key={item}
              className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700"
            >
              <button
                type="button"
                aria-label={`Rename ${item}`}
                onClick={() => editor.startEdit(item)}
                className="transition hover:text-zinc-900"
              >
                {item} <UsageCount count={usageOf(item)} />
              </button>
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => editor.remove(item)}
                className={`ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-300 hover:text-zinc-700 ${TOUCH_TARGET}`}
              >
                <CrossIcon className="h-2.5 w-2.5" />
              </button>
            </span>
          )
        )}
      </div>
      <UnlistedNames names={unlisted} usageOf={usageOf} onAdd={(name) => onChange([...items, name])} />
      <AddField
        value={editor.newValue}
        onChange={editor.setNewValue}
        onAdd={editor.add}
        placeholder={`Add ${label.toLowerCase()}…`}
        label={`New ${label.toLowerCase()}`}
      />
      <ListNotice>{editor.notice}</ListNotice>
    </section>
  );
}
