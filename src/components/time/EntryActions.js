"use client";

/** Edit and Delete for a time entry; Delete asks for confirmation. */
export function EntryActions({ entry, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onEdit(entry)}
        className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => {
          if (confirm("Delete this time entry?")) onDelete(entry.id);
        }}
        className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  );
}
