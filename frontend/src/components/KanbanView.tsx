import { useState } from 'react';
import type { Task } from '../types';
import { DndContext, type DragEndEvent, type DragStartEvent, useDraggable, useDroppable, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { Calendar, User as UserIcon } from 'lucide-react';

interface KanbanViewProps {
    tasks: Task[];
    onEdit: (task: Task) => void;
    onUpdateStatus: (taskId: number, newStatus: string) => void;
}

const COLUMNS = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
];

function KanbanCard({ task, onClick, isOverlay }: { task: Task, onClick?: () => void, isOverlay?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
    } : undefined;

    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (isOverlay) {
        return (
            <div
                className="p-3 rounded-lg border bg-white shadow-xl scale-105 rotate-2 border-indigo-200 dark:bg-gray-800 dark:border-indigo-500 cursor-grabbing w-[280px]"
            >
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                        {task.category?.name || 'No Category'}
                    </span>
                    {task.priority && (
                        <div className={`h-1.5 w-8 rounded-full ${task.priority.level >= 10 ? 'bg-red-500' : task.priority.level >= 5 ? 'bg-yellow-500' : 'bg-green-500'}`} title={task.priority.name} />
                    )}
                </div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight mb-2">{task.title}</h4>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
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

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                className="p-3 rounded-lg mb-2 bg-gray-200/50 dark:bg-gray-700/50 h-[100px] border-2 border-dashed border-gray-300 dark:border-gray-600"
            />
        );
    }

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
                <div className="flex flex-col gap-1 min-h-[50px]">
                    {tasks.map(task => (
                        <KanbanCard key={task.id} task={task} onClick={() => onEdit(task)} />
                    ))}
                    {tasks.length === 0 && (
                        <div className="h-16 flex items-center justify-center text-gray-400 text-xs italic">
                            Drop tasks here
                        </div>
                    )}
                </div>
            </div>
            <div className="p-2">
                <button
                    onClick={() => onEdit({} as any)} // Placeholder for 'Add another card' logic if needed, currently opens empty modal
                    className="w-full text-left p-2 text-sm text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors flex items-center gap-2"
                >
                    <span className="text-lg leading-none">+</span> Add a card
                </button>
            </div>
        </div>
    );
}

export default function KanbanView({ tasks, onEdit, onUpdateStatus }: KanbanViewProps) {
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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id) {
            const task = tasks.find(t => t.id === active.id);
            if (task && task.status !== over.id) {
                onUpdateStatus(task.id, over.id as string);
            }
        }
    };

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}
