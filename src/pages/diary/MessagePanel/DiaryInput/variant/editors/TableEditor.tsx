import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { v4 as uuidv4 } from 'uuid';

import type { TableColumnId } from '@/store/diary/type';
import type { EnterKeyBehavior } from '@/store/settings/type';

import {
  AdMenu,
  AdMenuItem,
  AdRichText,
  AdRichTextViewer,
  AdTooltip,
  type AdRichTextHandle,
  type ContentFeatureState,
} from '@/packages/base';
import { createEmptyRichTextContent } from '@/packages/base/AdRichText/richtext';

import AttachmentCard from '../../attachment/AttachmentTray/AttachmentCard';
import {
  TABLE_DEFAULT_COLUMN_WIDTH,
  TABLE_DEFAULT_ROW_MIN_HEIGHT,
  type DraftTableColumn,
  type DraftTableRow,
} from '../../input/composer.types';
import styles from './TableEditor.module.css';

type CellPoint = { rowId: string; columnId: TableColumnId };
export type TableSelection =
  | null
  | ({ type: 'cell' } & CellPoint)
  | { type: 'range'; anchor: CellPoint; focus: CellPoint }
  | { type: 'row'; rowId: string }
  | { type: 'column'; columnId: TableColumnId };

export type TableEditorHandle = {
  addFilesToSelection: (files: FileList | File[]) => boolean;
  finalizeTable: () => {
    tableRows: DraftTableRow[];
    tableColumns: DraftTableColumn[];
  };
  insertAtSelectedCell: (value: string) => void;
};

type Props = {
  rows: DraftTableRow[];
  columns: DraftTableColumn[];
  onChange: (rows: DraftTableRow[], columns?: DraftTableColumn[]) => void;
  onAddFiles: (
    rowId: string,
    columnId: string,
    files: FileList | File[],
  ) => void;
  enterKeyBehavior?: EnterKeyBehavior;
  onFocus?: () => void;
  onBlur?: () => void;
  onActiveEditorChange: (
    id: string | null,
    editor: AdRichTextHandle | null,
  ) => void;
  onContentFeatureStateChange?: (state: ContentFeatureState) => void;
  onContentLinkEditorOpenChange?: (open: boolean) => void;
  contentInspectorTarget?: HTMLElement | null;
  onContentContactEditorOpenChange?: (
    feature: 'phone' | 'email' | null,
  ) => void;
};

type DragState = {
  kind: 'row' | 'column' | 'resize-column' | 'resize-row';
  id: string;
  start: number;
  index: number;
  size?: number;
  moved?: boolean;
  insertion?: number;
};

type StructuralMenu =
  | { type: 'row'; id: string }
  | { type: 'column'; id: TableColumnId }
  | null;

const TableEditor = forwardRef<TableEditorHandle, Props>((props, ref) => {
  const { rows, columns, onChange, onAddFiles } = props;
  const [selection, setSelection] = useState<TableSelection>(null);
  const [editing, setEditing] = useState<CellPoint | null>(null);
  const [openMenu, setOpenMenu] = useState<StructuralMenu>(null);
  const [dragVisual, setDragVisual] = useState<{
    kind: 'row' | 'column';
    id: string;
    insertion: number;
  } | null>(null);
  const editorRef = useRef<AdRichTextHandle | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  const selectedCell = selection?.type === 'cell' ? selection : null;
  const setActiveEditorRef = useCallback((editor: AdRichTextHandle | null) => {
    editorRef.current = editor;
  }, []);
  const getCell = (point: CellPoint) =>
    rows.find((row) => row.id === point.rowId)?.cells[point.columnId];
  const patchCell = (
    point: CellPoint,
    cell: DraftTableRow['cells'][TableColumnId] | undefined,
  ) => {
    onChange(
      rows.map((row) => {
        if (row.id !== point.rowId) return row;
        const cells = { ...row.cells };
        if (cell) cells[point.columnId] = cell;
        else delete cells[point.columnId];
        return { ...row, cells };
      }),
    );
  };

  useImperativeHandle(
    ref,
    () => ({
      addFilesToSelection(files) {
        if (!selectedCell) return false;
        const existing = getCell(selectedCell);
        if (
          existing?.kind === 'richText' &&
          existing.content.preview &&
          !window.confirm(
            'Replace this cell text with the selected attachment?',
          )
        )
          return true;
        if (
          existing?.kind === 'attachment' &&
          !window.confirm('Replace the attachment in this cell?')
        )
          return true;
        onAddFiles(selectedCell.rowId, selectedCell.columnId, files);
        return true;
      },
      finalizeTable: () => ({ tableRows: rows, tableColumns: columns }),
      insertAtSelectedCell(value) {
        if (editing && editorRef.current)
          editorRef.current.insertAtCursor(value);
      },
    }),
    [columns, editing, onAddFiles, rows, selectedCell],
  );

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      const element = target instanceof Element ? target : target.parentElement;
      if (
        element?.closest(
          '[data-table-selection-preserve], [role="dialog"], [role="menu"], [data-floating-ui-portal]',
        )
      )
        return;
      setSelection(null);
      setEditing(null);
      setOpenMenu(null);
      props.onActiveEditorChange(null, null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const isSelected = (rowIndex: number, columnIndex: number) => {
    if (!selection) return false;
    if (selection.type === 'cell')
      return (
        rows[rowIndex].id === selection.rowId &&
        columns[columnIndex].id === selection.columnId
      );
    if (selection.type === 'row') return rows[rowIndex].id === selection.rowId;
    if (selection.type === 'column')
      return columns[columnIndex].id === selection.columnId;
    const ar = rows.findIndex((row) => row.id === selection.anchor.rowId);
    const ac = columns.findIndex(
      (column) => column.id === selection.anchor.columnId,
    );
    const fr = rows.findIndex((row) => row.id === selection.focus.rowId);
    const fc = columns.findIndex(
      (column) => column.id === selection.focus.columnId,
    );
    return (
      rowIndex >= Math.min(ar, fr) &&
      rowIndex <= Math.max(ar, fr) &&
      columnIndex >= Math.min(ac, fc) &&
      columnIndex <= Math.max(ac, fc)
    );
  };

  const clearSelection = () => {
    if (!selection) return;
    onChange(
      rows.map((row, ri) => {
        const cells = { ...row.cells };
        columns.forEach((column, ci) => {
          if (isSelected(ri, ci)) delete cells[column.id];
        });
        return { ...row, cells };
      }),
    );
  };

  const move = (deltaRow: number, deltaColumn: number, extend: boolean) => {
    const active =
      selection?.type === 'range'
        ? selection.focus
        : selection?.type === 'cell'
          ? selection
          : null;
    if (!active) return;
    const rowIndex = Math.max(
      0,
      Math.min(
        rows.length - 1,
        rows.findIndex((row) => row.id === active.rowId) + deltaRow,
      ),
    );
    const columnIndex = Math.max(
      0,
      Math.min(
        columns.length - 1,
        columns.findIndex((column) => column.id === active.columnId) +
          deltaColumn,
      ),
    );
    const focus = {
      rowId: rows[rowIndex].id,
      columnId: columns[columnIndex].id,
    };
    setSelection(
      extend
        ? {
            type: 'range',
            anchor: selection?.type === 'range' ? selection.anchor : active,
            focus,
          }
        : { type: 'cell', ...focus },
    );
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (editing) {
      if (event.key === 'Escape') {
        setEditing(null);
        props.onActiveEditorChange(null, null);
        event.preventDefault();
      }
      return;
    }
    if (event.key === 'Escape') {
      if (openMenu) setOpenMenu(null);
      else if (selection?.type === 'range')
        setSelection({ type: 'cell', ...selection.focus });
      else setSelection(null);
      event.preventDefault();
      return;
    }
    if (event.key === 'Enter' && selectedCell) {
      setEditing(selectedCell);
      event.preventDefault();
      return;
    }
    if (event.key === 'Tab' && selectedCell) {
      const rowIndex = rows.findIndex((row) => row.id === selectedCell.rowId);
      const columnIndex = columns.findIndex(
        (column) => column.id === selectedCell.columnId,
      );
      const current = rowIndex * columns.length + columnIndex;
      const next = Math.max(
        0,
        Math.min(
          rows.length * columns.length - 1,
          current + (event.shiftKey ? -1 : 1),
        ),
      );
      setSelection({
        type: 'cell',
        rowId: rows[Math.floor(next / columns.length)].id,
        columnId: columns[next % columns.length].id,
      });
      event.preventDefault();
      return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && selection) {
      clearSelection();
      event.preventDefault();
      return;
    }
    const keys: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    if (keys[event.key]) {
      move(...keys[event.key], event.shiftKey);
      event.preventDefault();
    }
  };

  const pointerMove = (event: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const coordinate = drag.kind.includes('column')
      ? event.clientX
      : event.clientY;
    const delta = coordinate - drag.start;
    if (drag.kind === 'resize-column') {
      onChange(
        rows,
        columns.map((column) =>
          column.id === drag.id
            ? {
                ...column,
                width: Math.max(72, (drag.size ?? column.width) + delta),
              }
            : column,
        ),
      );
      return;
    }
    if (drag.kind === 'resize-row') {
      onChange(
        rows.map((row) =>
          row.id === drag.id
            ? {
                ...row,
                minHeight: Math.max(32, (drag.size ?? row.minHeight) + delta),
              }
            : row,
        ),
      );
      return;
    }
    if (Math.abs(delta) < 4) return;
    drag.moved = true;
    const selector =
      drag.kind === 'column'
        ? '[data-table-column-index]'
        : '[data-table-row-index]';
    const elements = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>(selector) ?? [],
    );
    const target = elements.findIndex((element) => {
      const rect = element.getBoundingClientRect();
      const midpoint =
        drag.kind === 'column'
          ? rect.left + rect.width / 2
          : rect.top + rect.height / 2;
      return coordinate < midpoint;
    });
    drag.insertion = target < 0 ? elements.length : target;
    setDragVisual({
      kind: drag.kind,
      id: drag.id,
      insertion: drag.insertion,
    });
  };

  const finishPointer = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragVisual(null);
    if (!drag || drag.kind.startsWith('resize') || !drag.moved) return;
    suppressClickRef.current = true;
    const insertion = drag.insertion ?? drag.index;
    const destination = insertion > drag.index ? insertion - 1 : insertion;
    if (destination === drag.index) return;
    if (drag.kind === 'column') {
      const next = [...columns];
      const [moved] = next.splice(drag.index, 1);
      next.splice(destination, 0, moved);
      onChange(rows, next);
    } else {
      const next = [...rows];
      const [moved] = next.splice(drag.index, 1);
      next.splice(destination, 0, moved);
      onChange(next);
    }
  };

  const addRowAt = (index: number) => {
    const next = [...rows];
    next.splice(index, 0, {
      id: `table-row:${uuidv4()}`,
      minHeight: TABLE_DEFAULT_ROW_MIN_HEIGHT,
      cells: {},
    });
    onChange(next);
  };
  const addColumnAt = (index: number) => {
    const next = [...columns];
    next.splice(index, 0, {
      id: `table-column:${uuidv4()}`,
      width: TABLE_DEFAULT_COLUMN_WIDTH,
    });
    onChange(rows, next);
  };
  const deleteRow = (rowId: string) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((row) => row.id !== rowId));
    setSelection(null);
    setOpenMenu(null);
  };
  const deleteColumn = (columnId: TableColumnId) => {
    if (columns.length <= 1) return;
    onChange(
      rows.map((row) => {
        const cells = { ...row.cells };
        delete cells[columnId];
        return { ...row, cells };
      }),
      columns.filter((column) => column.id !== columnId),
    );
    setSelection(null);
    setOpenMenu(null);
  };

  const startStructuralDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
    kind: 'row' | 'column',
    id: string,
    index: number,
  ) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      kind,
      id,
      start: kind === 'column' ? event.clientX : event.clientY,
      index,
    };
  };

  const structuralClick = (
    type: 'row' | 'column',
    id: string,
    columnId?: TableColumnId,
  ) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (type === 'row') {
      setSelection({ type: 'row', rowId: id });
      setOpenMenu({ type: 'row', id });
    } else {
      const resolvedId = columnId ?? (id as TableColumnId);
      setSelection({ type: 'column', columnId: resolvedId });
      setOpenMenu({ type: 'column', id: resolvedId });
    }
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      role="grid"
      aria-label="Table editor"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerMove={pointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
    >
      <div className={styles.viewport}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: columns
              .map((column) => `minmax(${column.width}px, ${column.width}fr)`)
              .join(' '),
          }}
        >
          {columns.map((column, ci) => (
            <div
              key={`column-control:${column.id}`}
              className={styles.columnControl}
              data-selected={
                selection?.type === 'column' && selection.columnId === column.id
                  ? true
                  : undefined
              }
              data-dragging={
                dragVisual?.kind === 'column' && dragVisual.id === column.id
                  ? true
                  : undefined
              }
              style={{
                gridColumn: ci + 1,
                gridRow: `1 / ${rows.length + 1}`,
              }}
            >
              <button
                type="button"
                className={styles.columnSelect}
                aria-label={`Select column ${ci + 1}`}
                onClick={() => {
                  setSelection({ type: 'column', columnId: column.id });
                  setOpenMenu(null);
                }}
              />
              <AdMenu
                opened={
                  openMenu?.type === 'column' && openMenu.id === column.id
                }
                onChange={(opened) =>
                  setOpenMenu(opened ? { type: 'column', id: column.id } : null)
                }
                position="bottom"
                offset={6}
                withinPortal
                anchor={
                  <button
                    type="button"
                    data-table-column-index={ci}
                    data-table-selection-preserve
                    className={styles.columnTrigger}
                    onPointerDown={(event) => {
                      setSelection({
                        type: 'column',
                        columnId: column.id,
                      });
                      startStructuralDrag(event, 'column', column.id, ci);
                    }}
                    onClick={() =>
                      structuralClick('column', column.id, column.id)
                    }
                    aria-label={`Column ${ci + 1} actions`}
                  >
                    <span className={styles.controlPill}>…</span>
                  </button>
                }
              >
                <AdMenuItem
                  onClick={() => {
                    addColumnAt(ci);
                    setOpenMenu(null);
                  }}
                >
                  Insert column before
                </AdMenuItem>
                <AdMenuItem
                  onClick={() => {
                    addColumnAt(ci + 1);
                    setOpenMenu(null);
                  }}
                >
                  Insert column after
                </AdMenuItem>
                <AdMenuItem
                  destructive
                  disabled={columns.length <= 1}
                  onClick={() => deleteColumn(column.id)}
                >
                  Delete column
                </AdMenuItem>
              </AdMenu>
              <span
                className={styles.columnResize}
                role="separator"
                aria-orientation="vertical"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dragRef.current = {
                    kind: 'resize-column',
                    id: column.id,
                    start: event.clientX,
                    index: ci,
                    size:
                      event.currentTarget.parentElement?.getBoundingClientRect()
                        .width ?? column.width,
                  };
                }}
              />
            </div>
          ))}
          {rows.flatMap((row, ri) =>
            columns.map((column, ci) => {
              const point = { rowId: row.id, columnId: column.id };
              const cell = row.cells[column.id];
              const activeEdit =
                editing?.rowId === row.id && editing.columnId === column.id;
              return (
                <div
                  key={`${row.id}:${column.id}`}
                  className={`${styles.cell} ${isSelected(ri, ci) ? styles.selected : ''}`}
                  data-dragging={
                    (dragVisual?.kind === 'row' && dragVisual.id === row.id) ||
                    (dragVisual?.kind === 'column' &&
                      dragVisual.id === column.id) ||
                    undefined
                  }
                  role="gridcell"
                  tabIndex={-1}
                  style={{
                    minHeight: row.minHeight,
                    gridColumn: ci + 1,
                    gridRow: ri + 1,
                  }}
                  onKeyDown={(event) => {
                    onKeyDown(event);
                    event.stopPropagation();
                  }}
                  onPointerDown={(event) => {
                    if (event.button === 0)
                      setSelection({ type: 'cell', ...point });
                  }}
                  onClick={() => {
                    if (
                      selection?.type === 'cell' &&
                      selection.rowId === row.id &&
                      selection.columnId === column.id &&
                      matchMedia('(pointer: coarse)').matches
                    )
                      setEditing(point);
                    else setSelection({ type: 'cell', ...point });
                  }}
                  onDoubleClick={() => setEditing(point)}
                  onPointerEnter={(event) => {
                    if (event.buttons === 1 && selection?.type === 'cell')
                      setSelection({
                        type: 'range',
                        anchor: selection,
                        focus: point,
                      });
                  }}
                >
                  {ci === 0 ? (
                    <div
                      className={styles.rowControl}
                      data-selected={
                        selection?.type === 'row' && selection.rowId === row.id
                          ? true
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        className={styles.rowSelect}
                        aria-label={`Select row ${ri + 1}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelection({ type: 'row', rowId: row.id });
                          setOpenMenu(null);
                        }}
                      />
                      <AdMenu
                        opened={
                          openMenu?.type === 'row' && openMenu.id === row.id
                        }
                        onChange={(opened) =>
                          setOpenMenu(
                            opened ? { type: 'row', id: row.id } : null,
                          )
                        }
                        position="right-start"
                        offset={6}
                        withinPortal
                        anchor={
                          <button
                            type="button"
                            data-table-row-index={ri}
                            data-table-selection-preserve
                            className={styles.rowTrigger}
                            onPointerDown={(event) => {
                              setSelection({ type: 'row', rowId: row.id });
                              startStructuralDrag(event, 'row', row.id, ri);
                            }}
                            onClick={(event) => {
                              event.stopPropagation();
                              structuralClick('row', row.id);
                            }}
                            aria-label={`Row ${ri + 1} actions`}
                          >
                            <span className={styles.controlPill}>⋮</span>
                          </button>
                        }
                      >
                        <AdMenuItem
                          onClick={() => {
                            addRowAt(ri);
                            setOpenMenu(null);
                          }}
                        >
                          Insert row before
                        </AdMenuItem>
                        <AdMenuItem
                          onClick={() => {
                            addRowAt(ri + 1);
                            setOpenMenu(null);
                          }}
                        >
                          Insert row after
                        </AdMenuItem>
                        <AdMenuItem
                          destructive
                          disabled={rows.length <= 1}
                          onClick={() => deleteRow(row.id)}
                        >
                          Delete row
                        </AdMenuItem>
                      </AdMenu>
                      <span
                        className={styles.rowResize}
                        role="separator"
                        aria-orientation="horizontal"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          event.currentTarget.setPointerCapture(
                            event.pointerId,
                          );
                          const cellElement =
                            event.currentTarget.parentElement?.parentElement;
                          dragRef.current = {
                            kind: 'resize-row',
                            id: row.id,
                            start: event.clientY,
                            index: ri,
                            size:
                              cellElement?.getBoundingClientRect().height ??
                              row.minHeight,
                          };
                        }}
                      />
                    </div>
                  ) : null}
                  {activeEdit ? (
                    <AdRichText
                      ref={setActiveEditorRef}
                      value={
                        cell?.kind === 'richText'
                          ? cell.content
                          : createEmptyRichTextContent()
                      }
                      onChange={(content) =>
                        patchCell(point, { kind: 'richText', content })
                      }
                      onFocus={() => {
                        props.onActiveEditorChange(
                          `${row.id}:${column.id}`,
                          editorRef.current,
                        );
                        props.onFocus?.();
                      }}
                      onBlur={props.onBlur}
                      onContentFeatureStateChange={
                        props.onContentFeatureStateChange
                      }
                      onContentLinkEditorOpenChange={
                        props.onContentLinkEditorOpenChange
                      }
                      contentInspectorTarget={props.contentInspectorTarget}
                      onContentContactEditorOpenChange={
                        props.onContentContactEditorOpenChange
                      }
                    />
                  ) : cell?.kind === 'richText' ? (
                    <AdRichTextViewer value={cell.content} />
                  ) : cell?.kind === 'attachment' ? (
                    <div className={styles.attachment}>
                      <AttachmentCard
                        attachment={cell.attachment}
                        variant="tray"
                        onRemove={() => patchCell(point, undefined)}
                      />
                    </div>
                  ) : null}
                </div>
              );
            }),
          )}
          {dragVisual?.kind === 'column' ? (
            <div
              className={styles.columnInsertion}
              data-end={dragVisual.insertion === columns.length || undefined}
              style={{
                gridColumn: Math.min(dragVisual.insertion + 1, columns.length),
                gridRow: `1 / ${rows.length + 1}`,
              }}
            />
          ) : null}
          {dragVisual?.kind === 'row' ? (
            <div
              className={styles.rowInsertion}
              data-end={dragVisual.insertion === rows.length || undefined}
              style={{
                gridColumn: `1 / ${columns.length + 1}`,
                gridRow: Math.min(dragVisual.insertion + 1, rows.length),
              }}
            />
          ) : null}
          <AdTooltip label="Add column" position="left">
            <button
              type="button"
              className={`${styles.appendButton} ${styles.appendColumn}`}
              data-table-selection-preserve
              aria-label="Add column"
              onClick={() => addColumnAt(columns.length)}
            >
              +
            </button>
          </AdTooltip>
          <AdTooltip label="Add row" position="top">
            <button
              type="button"
              className={`${styles.appendButton} ${styles.appendRow}`}
              data-table-selection-preserve
              aria-label="Add row"
              onClick={() => addRowAt(rows.length)}
            >
              +
            </button>
          </AdTooltip>
        </div>
      </div>
    </div>
  );
});

TableEditor.displayName = 'TableEditor';
export default TableEditor;
