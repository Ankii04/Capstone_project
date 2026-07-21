import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, isToday } from 'date-fns';

const COLUMNS = [
  { id: 'todo', label: '📋 Todo', color: 'hsl(38,92%,50%)' },
  { id: 'in-progress', label: '⚡ In Progress', color: 'hsl(195,90%,50%)' },
  { id: 'done', label: '✅ Done', color: 'hsl(145,63%,45%)' },
];

function getDueDateClass(dueDate, status) {
  if (!dueDate || status === 'done') return '';
  const d = new Date(dueDate);
  if (isPast(d) && !isToday(d)) return 'due-overdue';
  if (isToday(d)) return 'due-today';
  return 'due-upcoming';
}

function SortableTaskCard({ task, canManage, assignableUsers, onUpdateStatus, onDelete, onOpenComments, onUpdateAssignee }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const dueCls = getDueDateClass(task.dueDate, task.status);

  return (
    <div ref={setNodeRef} style={style} className={`kanban-card ${isDragging ? 'dragging' : ''}`}>
      <div className="kanban-card-drag" {...attributes} {...listeners}>
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 000 2h6a1 1 0 100-2H7z" />
        </svg>
      </div>
      <div className="kanban-card-body">
        <div className="kanban-card-header">
          <span className="task-title">{task.title}</span>
          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        </div>
        {task.description && <p className="kanban-card-desc">{task.description}</p>}
        <div className="kanban-card-meta">
          {task.assignedTo && (
            <span className="kanban-assignee">👤 {task.assignedTo.name}</span>
          )}
          {task.dueDate && (
            <span className={`kanban-due ${dueCls}`}>
              {dueCls === 'due-overdue' ? '⚠️' : dueCls === 'due-today' ? '🔔' : '📅'}
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>
        <div className="kanban-card-actions">
          {canManage && (
            <select
              value={task.assignedTo?._id || ''}
              onChange={e => onUpdateAssignee(task._id, e.target.value)}
              className="task-select task-select-sm"
              onClick={e => e.stopPropagation()}
            >
              <option value="">Unassigned</option>
              {assignableUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          )}
          <button className="btn-icon btn-comment" onClick={() => onOpenComments(task)} title="Comments">💬</button>
          {canManage && (
            <button className="btn-icon btn-delete" onClick={() => onDelete(task._id)} title="Delete">🗑️</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasks, canManage, assignableUsers, onUpdateStatus, onDelete, onOpenComments, onUpdateAssignee }) {
  const [activeTask, setActiveTask] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find(t => t._id === active.id));
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const task = tasks.find(t => t._id === active.id);
    const targetCol = COLUMNS.find(c => c.id === over.id);
    if (targetCol && task && task.status !== targetCol.id) {
      onUpdateStatus(task._id, targetCol.id);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <SortableContext key={col.id} id={col.id} items={colTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
              <div className="kanban-column" data-col={col.id}>
                <div className="kanban-col-header" style={{ borderColor: col.color }}>
                  <span className="kanban-col-title" style={{ color: col.color }}>{col.label}</span>
                  <span className="kanban-col-count">{colTasks.length}</span>
                </div>
                <div className="kanban-col-body" id={col.id}>
                  {colTasks.length === 0 ? (
                    <div className="kanban-col-empty">Drop tasks here</div>
                  ) : (
                    colTasks.map(task => (
                      <SortableTaskCard
                        key={task._id}
                        task={task}
                        canManage={canManage}
                        assignableUsers={assignableUsers}
                        onUpdateStatus={onUpdateStatus}
                        onDelete={onDelete}
                        onOpenComments={onOpenComments}
                        onUpdateAssignee={onUpdateAssignee}
                      />
                    ))
                  )}
                </div>
              </div>
            </SortableContext>
          );
        })}
      </div>
      <DragOverlay>
        {activeTask && (
          <div className="kanban-card kanban-card-overlay">
            <span className="task-title">{activeTask.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
