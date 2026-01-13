import { useState, useCallback, ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../../utils";

interface CollapsibleSectionProps {
    title: string;
    children: ReactNode;
    defaultExpanded?: boolean;
    alwaysExpanded?: boolean;
    badge?: string | number;
    icon?: ReactNode;
}

export function CollapsibleSection({
    title,
    children,
    defaultExpanded = false,
    alwaysExpanded = false,
    badge,
    icon,
}: CollapsibleSectionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded || alwaysExpanded);

    const toggle = useCallback(() => {
        if (!alwaysExpanded) {
            setIsExpanded((prev) => !prev);
        }
    }, [alwaysExpanded]);

    return (
        <section className="border-b border-neutral-200">
            <button
                onClick={toggle}
                disabled={alwaysExpanded}
                className={cn(
                    "w-full px-4 py-2.5 flex items-center gap-2 text-xs font-semibold text-neutral-600 uppercase tracking-wider bg-neutral-50",
                    !alwaysExpanded && "hover:bg-neutral-100 cursor-pointer",
                    alwaysExpanded && "cursor-default"
                )}
            >
                {!alwaysExpanded && (
                    <span className="text-neutral-400">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                )}
                {icon && <span className="text-neutral-500">{icon}</span>}
                <span className="flex-1 text-left">{title}</span>
                {badge !== undefined && (
                    <span className="text-neutral-400 font-normal normal-case">
                        {badge}
                    </span>
                )}
            </button>
            {isExpanded && (
                <div className="px-4 py-3">
                    {children}
                </div>
            )}
        </section>
    );
}
