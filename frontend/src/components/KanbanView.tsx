import { useState } from 'react';
import type { Task } from '../types';
import { DndContext, type DragEndEvent, type DragStartEvent, type DragOverEvent, useSensor, useSensors, PointerSensor, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User as UserIcon } from 'lucide-react';

interface KanbanViewProps {
    tasks: Task[];
    onEdit: (task: Task) => void;
    onUpdateStatus: (taskId: number, newStatus: string) => void;
    onUpdateRank: (taskId: number, newRank: number) => void;
}

const COLUMNS = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
];

function SortableKanbanCard({ task, onClick }: { task: Task, onClick?: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}
            className="p-3 rounded-lg mb-2 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer border border-transparent hover:border-gray-200 dark:border-gray-700 dark:hover:border-gray-600 group"
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    {task.category?.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.category.color }} />}
                    {task.category?.name || 'No Category'}
                </span>
                {task.priority && (
                    <div className={`h-1.5 w-8 rounded-full ${task.priority.level >= 10 ? 'bg-red-500' : task.priority.level >= 5 ? 'bg-yellow-500' : 'bg-green-500'}`} title={task.priority.name} />
                )}
            </div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{task.title}</h4>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <UserIcon size={14} className={task.assignee ? "text-indigo-500" : "text-gray-300"} />
                    <span>{task.assignee ? task.assignee.name : 'Unassigned'}</span>
                </div>

                {task.due_date && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar size={14} />
                        <span>{formatDate(task.due_date)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function KanbanColumn({ id, title, tasks, onEdit }: { id: string, title: string, tasks: Task[], onEdit: (t: Task) => void }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    return (
        <div className={`flex flex-col w-80 min-w-[320px] max-h-full rounded-xl transition-colors duration-200 ml-4 first:ml-6
        ${isOver ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800/50'}
    `}>
            <div className="p-3 flex items-center justify-between sticky top-0 bg-inherit rounded-t-xl z-10">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm px-2">
                    {title}
                </h3>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
                    {tasks.length}
                </span>
            </div>
            <div ref={setNodeRef} className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-1 min-h-[50px]">
                        {tasks.map(task => (
                            <SortableKanbanCard key={task.id} task={task} onClick={() => onEdit(task)} />
                        ))}
                        {tasks.length === 0 && (
                            <div className="h-16 flex items-center justify-center text-gray-400 text-xs italic">
                                Drop tasks here
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>
            <div className="p-2">
                <button
                    onClick={() => onEdit(null as any)}
                    className="w-full text-left p-2 text-sm text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors flex items-center gap-2"
                >
                    <span className="text-lg leading-none">+</span> Add a card
                </button>
            </div>
        </div>
    );
}

export default function KanbanView({ tasks, onEdit, onUpdateStatus, onUpdateRank }: KanbanViewProps) {
    const [activeId, setActiveId] = useState<number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
    };

    const handleDragOver = (_event: DragOverEvent) => {
        // Could be used for visual feedback, but not needed for our implementation
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || !active.id) return;

        const activeTask = tasks.find(t => t.id === active.id);
        if (!activeTask) return;

        // Determine if we're dropping on a column or a task
        const overColumn = COLUMNS.find(col => col.id === over.id);
        const overTask = tasks.find(t => t.id === over.id);

        if (overColumn) {
            // Dropped on a column (empty area or column itself)
            if (activeTask.status !== overColumn.id) {
                // Status change
                onUpdateStatus(activeTask.id, overColumn.id);
            }
        } else if (overTask) {
            // Dropped on another task
            const targetStatus = overTask.status;

            if (activeTask.status !== targetStatus) {
                // Status change - update status and rank
                onUpdateStatus(activeTask.id, targetStatus);

                // Also update rank based on position in new column
                const tasksInTargetColumn = tasks.filter(t => t.status === targetStatus && t.id !== activeTask.id);
                const overIndex = tasksInTargetColumn.findIndex(t => t.id === overTask.id);

                let newRank: number;
                if (overIndex === 0) {
                    newRank = (overTask.rank ?? 1000) / 2;
                } else if (overIndex === tasksInTargetColumn.length - 1) {
                    newRank = (overTask.rank ?? 0) + 1000;
                } else {
                    const prevRank = tasksInTargetColumn[overIndex - 1]?.rank ?? 0;
                    const nextRank = overTask.rank ?? prevRank + 2000;
                    newRank = (prevRank + nextRank) / 2;
                }

                onUpdateRank(activeTask.id, newRank);
            } else {
                // Reordering within the same column
                const tasksInColumn = tasks.filter(t => t.status === activeTask.status);
                const activeIndex = tasksInColumn.findIndex(t => t.id === activeTask.id);
                const overIndex = tasksInColumn.findIndex(t => t.id === overTask.id);

                if (activeIndex !== overIndex) {
                    // Calculate new rank
                    let newRank: number;
                    if (overIndex === 0) {
                        newRank = (tasksInColumn[0]?.rank ?? 1000) / 2;
                    } else if (overIndex === tasksInColumn.length - 1) {
                        newRank = (tasksInColumn[tasksInColumn.length - 1]?.rank ?? 0) + 1000;
                    } else {
                        // Inserting between tasks
                        const prevRank = activeIndex < overIndex
                            ? tasksInColumn[overIndex]?.rank ?? 0
                            : tasksInColumn[overIndex - 1]?.rank ?? 0;
                        const nextRank = activeIndex < overIndex
                            ? tasksInColumn[overIndex + 1]?.rank ?? prevRank + 2000
                            : tasksInColumn[overIndex]?.rank ?? prevRank + 2000;
                        newRank = (prevRank + nextRank) / 2;
                    }

                    onUpdateRank(activeTask.id, newRank);
                }
            }
        }
    };

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="flex h-full overflow-x-auto overflow-y-hidden pb-4 pt-4 items-start content-start bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
                {COLUMNS.map(col => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        tasks={tasks.filter(t => t.status === col.id)}
                        onEdit={onEdit}
                    />
                ))}
                {/* Spacer for right padding */}
                <div className="w-6 shrink-0" />
            </div>
            <DragOverlay>
                {activeTask ? (
                    <div className="p-3 rounded-lg border bg-white shadow-xl scale-105 rotate-2 border-indigo-200 dark:bg-gray-800 dark:border-indigo-500 cursor-grabbing w-[280px]">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                {activeTask.category?.name || 'No Category'}
                            </span>
                            {activeTask.priority && (
                                <div className={`h-1.5 w-8 rounded-full ${activeTask.priority.level >= 10 ? 'bg-red-500' : activeTask.priority.level >= 5 ? 'bg-yellow-500' : 'bg-green-500'}`} title={activeTask.priority.name} />
                            )}
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight mb-2">{activeTask.title}</h4>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <UserIcon size={14} className={activeTask.assignee ? "text-indigo-500" : "text-gray-300"} />
                                <span>{activeTask.assignee ? activeTask.assignee.name : 'Unassigned'}</span>
                            </div>
                            {activeTask.due_date && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                    <Calendar size={14} />
                                    <span>{new Date(activeTask.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
