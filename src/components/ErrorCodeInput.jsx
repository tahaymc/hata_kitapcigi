import React, { useEffect, useRef, useState } from 'react';

const ErrorCodeInput = ({ value = '', onChange }) => {
    // Parse initial value (e.g. "ABC-123" -> prefix="ABC", suffix="123")
    const [prefix, setPrefix] = useState('');
    const [suffix, setSuffix] = useState('');

    // Suffix ref for auto-focus
    const suffixRef = useRef(null);

    useEffect(() => {
        if (value) {
            const parts = value.split('-');
            if (parts[0]) setPrefix(parts[0]);
            if (parts[1]) setSuffix(parts[1]);
        } else {
            setPrefix('');
            setSuffix('');
        }
    }, [value]);

    const handlePrefixChange = (e) => {
        let val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
        if (val.length > 3) val = val.slice(0, 3);

        setPrefix(val);
        onChange(`${val}-${suffix}`);

        // Auto-focus move to suffix when 3 chars reached
        if (val.length === 3) {
            suffixRef.current?.focus();
        }
    };

    const handleSuffixChange = (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length > 3) val = val.slice(0, 3);

        setSuffix(val);
        onChange(`${prefix}-${val}`);
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').toUpperCase();

        // Check if matches generic format roughly
        // Matches ABC-123 or just ABC123
        const match = text.match(/([A-Z]{1,3})[- ]?(\d{1,3})/);

        if (match) {
            const newPrefix = match[1];
            const newSuffix = match[2];
            setPrefix(newPrefix);
            setSuffix(newSuffix);
            onChange(`${newPrefix}-${newSuffix}`);
        }
    };

    return (
        <div className="flex items-center gap-2 group" onPaste={handlePaste}>
            <div className="relative flex-1">
                <input
                    type="text"
                    className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center font-mono font-bold text-lg tracking-wider text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 uppercase"
                    placeholder="ABC"
                    maxLength={3}
                    value={prefix}
                    onChange={handlePrefixChange}
                />
                <span className="absolute bottom-[-20px] left-0 w-full text-center text-[10px] text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    KOD
                </span>
            </div>

            <div className="text-slate-300 dark:text-slate-600 font-bold text-xl select-none">
                —
            </div>

            <div className="relative flex-1">
                <input
                    ref={suffixRef}
                    type="text"
                    className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center font-mono font-bold text-lg tracking-wider text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder="123"
                    maxLength={3}
                    value={suffix}
                    onChange={handleSuffixChange}
                />
                <span className="absolute bottom-[-20px] left-0 w-full text-center text-[10px] text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    NO
                </span>
            </div>
        </div>
    );
};

export default ErrorCodeInput;
