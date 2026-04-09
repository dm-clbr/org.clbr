import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, buildDepartmentTree, getDepartmentDescendantIds } from '../../lib/queries'
import type { Department } from '../../types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Plus, Edit2, Trash2, Loader2, ChevronRight, ChevronDown, GripVertical } from 'lucide-react'
import { cn } from '../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlatNode {
  dept: Department
  depth: number
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function buildFlatNodes(dept: Department, depth: number, collapsed: Set<string>, result: FlatNode[]) {
  result.push({ dept, depth })
  if (!collapsed.has(dept.id) && dept.children && dept.children.length > 0) {
    for (const child of dept.children) {
      buildFlatNodes(child, depth + 1, collapsed, result)
    }
  }
}

function getDeptLabel(depth: number): string {
  if (depth === 0) return 'Department'
  return 'Sub-department'
}

// ─── Draggable row ────────────────────────────────────────────────────────────

interface DeptRowProps {
  node: FlatNode
  isOver: boolean
  isActive: boolean
  onEdit: (dept: Department) => void
  onDelete: (dept: Department) => void
  onToggleCollapse: (id: string) => void
  isCollapsed: boolean
  hasChildren: boolean
}

function DeptRow({ node, isOver, isActive: _isActive, onEdit, onDelete, onToggleCollapse, isCollapsed, hasChildren }: DeptRowProps) {
  const { dept, depth } = node

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: dept.id })
  const { setNodeRef: setDropRef, isOver: isDropOver } = useDroppable({ id: dept.id })

  const isDropTarget = isOver || isDropOver

  // Combine refs
  const ref = (el: HTMLDivElement | null) => {
    setDragRef(el)
    setDropRef(el)
  }

  return (
    <div
      ref={ref}
      style={{ paddingLeft: `${depth * 24 + 4}px` }}
      className={cn(
        'clbr-list-item flex items-center gap-2 p-2 transition-colors',
        isDragging && 'opacity-30',
        isDropTarget && !isDragging && 'bg-[rgba(64,66,77,0.3)] border-[rgba(188,191,204,0.55)] ring-1 ring-[#D3D6E0]/40',
      )}
    >
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => hasChildren && onToggleCollapse(dept.id)}
        className={cn('rounded-[2px] p-0.5 text-[#9DA2B3]', hasChildren ? 'hover:text-[#F2F2F2]' : 'invisible')}
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab touch-none rounded-[2px] p-0.5 text-[#9DA2B3] hover:text-[#F2F2F2]"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Department info */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Badge
          style={{ backgroundColor: dept.color, color: '#F2F2F2' }}
          className="shrink-0 rounded-[2px] border-0 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.3px]"
        >
          {dept.name}
        </Badge>
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.3px] text-[#9DA2B3]">{getDeptLabel(depth)}</span>
        {dept.description && (
          <span className="truncate text-sm text-[#BCBFCC]">{dept.description}</span>
        )}
      </div>

      {/* Edit button */}
      <Button variant="ghost" size="icon" onClick={() => onEdit(dept)} className="clbr-btn-minimal h-9 w-9 shrink-0 p-0">
        <Edit2 className="h-4 w-4" />
      </Button>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(dept)}
        className="clbr-btn-minimal h-9 w-9 shrink-0 p-0 text-[#D3D6E0] hover:bg-[rgba(110,113,128,0.22)] hover:text-[#F2F2F2]"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ─── Root droppable zone ──────────────────────────────────────────────────────

function RootDropZone({ isActive }: { isActive: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: '__root__' })
  if (!isActive) return null
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'mb-2 flex h-10 items-center justify-center rounded-[2px] border-2 border-dashed text-xs font-bold uppercase tracking-[0.3px] transition-colors',
        isOver
          ? 'border-[#D3D6E0] bg-[rgba(64,66,77,0.3)] text-[#F2F2F2]'
          : 'border-[rgba(64,66,77,0.45)] text-[#9DA2B3]',
      )}
    >
      Drop here to make a root department
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DepartmentManager() {
  const { data: departments, isLoading } = useDepartments()
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const deleteDepartment = useDeleteDepartment()

  const [isEditing, setIsEditing] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [deletingDept, setDeletingDept] = useState<Department | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    color: '#6366f1',
    description: '',
    parent_id: null as string | null,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const tree = useMemo(() => buildDepartmentTree(departments || []), [departments])

  const flatNodes = useMemo(() => {
    const result: FlatNode[] = []
    tree.forEach((root) => buildFlatNodes(root, 0, collapsed, result))
    return result
  }, [tree, collapsed])

  const activeDept = useMemo(
    () => departments?.find((d) => d.id === activeId) ?? null,
    [departments, activeId],
  )

  const handleToggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleEdit = (dept: Department) => {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      color: dept.color,
      description: dept.description || '',
      parent_id: dept.parent_id ?? null,
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditingDept(null)
    setFormData({ name: '', color: '#6366f1', description: '', parent_id: null })
  }

  const handleDeleteConfirm = async () => {
    if (!deletingDept) return
    await deleteDepartment.mutateAsync(deletingDept.id)
    setDeletingDept(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingDept) {
      await updateDepartment.mutateAsync({ id: editingDept.id, ...formData })
    } else {
      await createDepartment.mutateAsync(formData)
    }
    handleCancel()
  }

  // Departments that can be chosen as parent in form (exclude self + own descendants when editing)
  const parentOptions = useMemo(() => {
    if (!departments) return []
    if (!editingDept) return departments
    const forbidden = new Set(getDepartmentDescendantIds(editingDept.id, departments))
    return departments.filter((d) => !forbidden.has(d.id))
  }, [departments, editingDept])

  // ── DnD handlers ──
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
  }

  const handleDragOver = ({ over }: DragOverEvent) => {
    setOverId(over ? (over.id as string) : null)
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    setOverId(null)

    if (!over || active.id === over.id) return

    const draggedId = active.id as string
    const targetId = over.id as string

    // Prevent nesting under own descendants (cycle prevention)
    if (targetId !== '__root__') {
      const descendants = getDepartmentDescendantIds(draggedId, departments || [])
      if (descendants.includes(targetId)) return
    }

    const newParentId = targetId === '__root__' ? null : targetId
    const dragged = departments?.find((d) => d.id === draggedId)
    if (!dragged || dragged.parent_id === newParentId) return

    await updateDepartment.mutateAsync({ id: draggedId, parent_id: newParentId })
  }

  if (isLoading) {
    return <div className="clbr-empty">Loading departments...</div>
  }

  return (
    <div className="space-y-6">
      <Card className="clbr-card">
        <CardHeader>
          <CardTitle className="clbr-card-title">
            {isEditing ? (editingDept ? 'Edit Department' : 'Add Department') : 'Departments'}
          </CardTitle>
          <CardDescription className="clbr-card-description">
            {isEditing
              ? 'Configure department details and color coding'
              : 'Manage departments — drag a department onto another to nest it as a sub-department'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="clbr-label">Department Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g., Engineering"
                  className="clbr-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color" className="clbr-label">Color *</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                    className="clbr-input h-10 w-20"
                    required
                  />
                  <Badge
                    style={{ backgroundColor: formData.color, color: '#F2F2F2' }}
                    className="rounded-[2px] border-0 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.3px]"
                  >
                    Preview
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent" className="clbr-label">Parent Department</Label>
                <select
                  id="parent"
                  value={formData.parent_id ?? ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, parent_id: e.target.value || null }))
                  }
                  className="clbr-select flex h-10 w-full px-3 py-2 text-sm"
                >
                  <option value="">None (root department)</option>
                  {parentOptions.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="clbr-label">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={3}
                  className="clbr-textarea"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createDepartment.isPending || updateDepartment.isPending}
                  className="clbr-btn-primary"
                >
                  {(createDepartment.isPending || updateDepartment.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingDept ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} className="clbr-btn-secondary">
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <Button onClick={() => setIsEditing(true)} className="clbr-btn-secondary">
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>

              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <RootDropZone isActive={!!activeId} />

                <div className="space-y-1">
                  {flatNodes.map(({ dept, depth }) => {
                    const hasChildren = (dept.children?.length ?? 0) > 0
                    return (
                      <DeptRow
                        key={dept.id}
                        node={{ dept, depth }}
                        isOver={overId === dept.id}
                        isActive={activeId === dept.id}
                        onEdit={handleEdit}
                        onDelete={setDeletingDept}
                        onToggleCollapse={handleToggleCollapse}
                        isCollapsed={collapsed.has(dept.id)}
                        hasChildren={hasChildren}
                      />
                    )
                  })}
                  {flatNodes.length === 0 && (
                    <p className="clbr-empty py-4">
                      No departments yet. Add one above.
                    </p>
                  )}
                </div>

                <DragOverlay>
                  {activeDept && (
                    <div className="clbr-list-item flex items-center gap-2 p-2 opacity-90 shadow-lg">
                      <GripVertical className="h-4 w-4 text-[#9DA2B3]" />
                      <Badge
                        style={{ backgroundColor: activeDept.color, color: '#F2F2F2' }}
                        className="rounded-[2px] border-0 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.3px]"
                      >
                        {activeDept.name}
                      </Badge>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="clbr-card w-full max-w-sm space-y-4 p-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold uppercase tracking-[0.3px] text-[#F2F2F2]">Delete department?</h3>
              <p className="text-sm text-[#9DA2B3]">
                <span className="font-medium text-[#F2F2F2]">{deletingDept.name}</span> will be
                permanently deleted. Any child departments will be moved to the root level.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeletingDept(null)} disabled={deleteDepartment.isPending} className="clbr-btn-secondary">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteDepartment.isPending}
                className="clbr-btn-secondary !bg-[#6E7180] hover:!bg-[#40424D]"
              >
                {deleteDepartment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
