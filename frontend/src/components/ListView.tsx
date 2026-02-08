import type { Task } from '../types';
import { Calendar, User as UserIcon, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ListViewProps {
    tasks: Task[];
    onEdit: (task: Task) => void;
    onUpdateRank: (taskId: number, newRank: number) => void;
}

function SortableTaskRow({ task, onEdit }: { task: Task; onEdit: (task: Task) => void }) {
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

    const getPriorityColor = (level: number) => {
        if (level >= 10) return 'mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        if (level >= 5) return 'mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        return 'mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
            <td className="px-2 py-4 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                <GripVertical size={16} className="text-gray-400" />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white cursor-pointer" onClick={() => onEdit(task)}>
                {task.title}
            </td>
            <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onEdit(task)}>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${task.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                    {task.status.replace('_', ' ')}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => onEdit(task)}>
                <div className="flex items-center gap-2">
                    {task.category?.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.category.color }} />}
                    {task.category?.name || <span className="text-gray-300 italic">No Category</span>}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onEdit(task)}>
                {task.priority ? (
                    <span className={getPriorityColor(task.priority.level)}>
                        {task.priority.name}
                    </span>
                ) : <span className="text-gray-400 text-sm">-</span>}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => onEdit(task)}>
                <div className="flex items-center gap-2">
                    <UserIcon size={14} className="text-gray-400" />
                    {task.assignee?.name || <span className="text-gray-300 italic">Unassigned</span>}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 cursor-pointer" onClick={() => onEdit(task)}>
                <div className="flex items-center gap-2">
                    {task.due_date && <Calendar size={14} className="text-gray-400" />}
                    {formatDate(task.due_date)}
                </div>
            </td>
        </tr>
    );
}

export default function ListView({ tasks, onEdit, onUpdateRank }: ListViewProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = tasks.findIndex(t => t.id === active.id);
        const newIndex = tasks.findIndex(t => t.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        // Get the task being moved
        const movedTask = tasks[oldIndex];

        // Calculate new rank based on neighbors WITH THE SAME STATUS
        // Since backend orders by status (done last), then rank, we need to ensure
        // we only consider tasks with the same status for rank calculation
        const sameStatusTasks = tasks.filter(t => t.status === movedTask.status);

        // Determine new position in status group based on where it was dropped
        let newIndexInStatus: number;
        if (oldIndex < newIndex) {
            // Dragging down - find position after the target
            const targetTask = tasks[newIndex];
            const targetIndexInStatus = sameStatusTasks.findIndex(t => t.id === targetTask.id);
            newIndexInStatus = targetIndexInStatus;
        } else {
            // Dragging up - find position before the target
            const targetTask = tasks[newIndex];
            const targetIndexInStatus = sameStatusTasks.findIndex(t => t.id === targetTask.id);
            newIndexInStatus = targetIndexInStatus;
        }

        let newRank: number;
        if (newIndexInStatus === 0) {
            // Moving to the top of this status group
            const nextInStatus = sameStatusTasks[0];
            newRank = nextInStatus && nextInStatus.id !== movedTask.id
                ? (nextInStatus.rank ?? 1000) / 2
                : 500;
        } else if (newIndexInStatus >= sameStatusTasks.length - 1) {
            // Moving to the bottom of this status group
            const prevInStatus = sameStatusTasks[sameStatusTasks.length - 1];
            newRank = (prevInStatus?.rank ?? 0) + 1000;
        } else {
            // Moving between two tasks in the same status
            const prevInStatus = sameStatusTasks[newIndexInStatus - 1];
            const nextInStatus = sameStatusTasks[newIndexInStatus];
            const prevRank = prevInStatus?.rank ?? 0;
            const nextRank = nextInStatus?.rank ?? prevRank + 2000;
            newRank = (prevRank + nextRank) / 2;
        }

        // Update via API (Dashboard handles optimistic update)
        onUpdateRank(active.id as number, newRank);
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-2 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-8"></th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priority</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assignee</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                {tasks.map(task => (
                                    <SortableTaskRow key={task.id} task={task} onEdit={onEdit} />
                                ))}
                            </SortableContext>
                        </tbody>
                    </table>
                </DndContext>
            </div>
            {tasks.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No tasks found.</p>
                </div>
            )}
        </div>
    );
}
