import { Mail, Lock, User, ArrowRight, Loader2, ChevronDown } from 'lucide-react'

export const Input = ({ icon: Icon, label, ...props }) => (
    <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-400 ml-1">{label}</label>
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-indigo-500 transition-colors">
                <Icon className="w-5 h-5" />
            </div>
            <input
                {...props}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600"
            />
        </div>
    </div>
)

export const Button = ({ children, loading, ...props }) => (
    <button
        {...props}
        disabled={loading || props.disabled}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
    >
        {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
            <>
                {children}
                <ArrowRight className="w-5 h-5" />
            </>
        )}
    </button>
)

export const Select = ({ icon: Icon, label, options, ...props }) => (
    <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-400 ml-1">{label}</label>
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                <Icon className="w-5 h-5" />
            </div>
            <select
                {...props}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3 pl-12 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer text-white"
            >
                <option value="" disabled>{props.placeholder || 'Select an option'}</option>
                {options.map(opt => (
                    <option key={opt} value={opt} className="bg-neutral-900 text-white font-sans">{opt}</option>
                ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                <ChevronDown className="w-4 h-4" />
            </div>
        </div>
    </div>
)
