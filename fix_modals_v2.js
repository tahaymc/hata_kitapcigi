const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\Users\\enp144\\Desktop\\proje\\hata_kitapcigi\\src\\pages\\HomePage.jsx');

try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const labelStr = '<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Çözüm Adımları</label>';
    const footerStr = '<div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">';

    // --- Fix Add Modal ---
    const addLabelIndex = fileContent.indexOf(labelStr);
    if (addLabelIndex === -1) throw new Error('Add Modal Label not found');

    // Find footer after label
    const addFooterIndex = fileContent.indexOf(footerStr, addLabelIndex);
    if (addFooterIndex === -1) throw new Error('Add Modal Footer not found');

    // Find the wrapper div before the label.
    // We want to replace from the div wrapping the label.
    // The previous line should be '                                <div>'.
    const addDivStart = fileContent.lastIndexOf('<div>', addLabelIndex);
    // Actually, looking at indentation, it might be '                                <div>'.
    // Let's just replace from labelStr start - (whitespace + <div>). 
    // But safe bet is to replace from addLabelIndex - some amount?
    // No, let's keep the outer div if possible, OR replace from labelStr.

    // My correctBlock includes the outer <div>.
    // So I need to find the specific outer div.
    // Search backward for '<div>' from addLabelIndex.

    // Let's rely on the file content structure from view_file.
    // Line 1042: '                                <div>'
    // Line 1043: labelStr

    // So if I replace from addLabelIndex, I keep the outer div.
    // But I want to replace the whole `space-y-4` div inside it too?
    // My previous correctBlock had the outer `<div>` and `</div>`.

    // Let's reconstruct correctBlock to NOT have outer div, just the content inside it.
    // Content: Label + space-y-4 div.

    const correctAddBlock = `<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Çözüm Adımları</label>
                                    <div className="space-y-4">
                                        {newErrorData.solutionSteps.map((step, index) => (
                                            <div key={index} className="flex gap-3 group items-start">
                                                <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 font-mono text-sm mt-1">
                                                    {index + 1}.
                                                </span>
                                                <div className="flex-grow space-y-2">
                                                    <div className="relative">
                                                        <textarea
                                                            rows="2"
                                                            className="w-full pl-4 pr-28 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-y"
                                                            placeholder={\`\${index + 1}. Adımı girin...\`}
                                                            value={step.text}
                                                            onChange={(e) => {
                                                                const newSteps = [...newErrorData.solutionSteps];
                                                                newSteps[index] = { ...newSteps[index], text: e.target.value };
                                                                setNewErrorData({ ...newErrorData, solutionSteps: newSteps });
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    setNewErrorData({ ...newErrorData, solutionSteps: [...newErrorData.solutionSteps, { text: '', imageUrl: null }] });
                                                                }
                                                            }}
                                                        ></textarea>
                                                        <div className="absolute right-2 top-2 flex items-center gap-1">
                                                            <label className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer select-none border border-slate-200 dark:border-slate-700">
                                                                <ImageIcon className="w-3.5 h-3.5" />
                                                                <span>Görsel</span>
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) {
                                                                            const reader = new FileReader();
                                                                            reader.onloadend = () => {
                                                                                const newSteps = [...newErrorData.solutionSteps];
                                                                                newSteps[index] = { ...newSteps[index], imageUrl: reader.result };
                                                                                setNewErrorData({ ...newErrorData, solutionSteps: newSteps });
                                                                            };
                                                                            reader.readAsDataURL(file);
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                            {newErrorData.solutionSteps.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newSteps = newErrorData.solutionSteps.filter((_, i) => i !== index);
                                                                        setNewErrorData({ ...newErrorData, solutionSteps: newSteps });
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                                    title="Adımı Sil"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {step.imageUrl && (
                                                        <div className="relative inline-block group/img">
                                                            <img src={step.imageUrl} alt="" className="h-20 w-auto rounded-lg border border-slate-200 dark:border-slate-700 object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newSteps = [...newErrorData.solutionSteps];
                                                                    newSteps[index] = { ...newSteps[index], imageUrl: null };
                                                                    setNewErrorData({ ...newErrorData, solutionSteps: newSteps });
                                                                }}
                                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setNewErrorData({ ...newErrorData, solutionSteps: [...newErrorData.solutionSteps, { text: '', imageUrl: null }] })}
                                            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Yeni Adım Ekle
                                        </button>
                                    </div>`;

    // Before footer, there is usually `</div>` and some closing tags.
    // The messed up part ends with `</div >` and `)}` etc.
    // But we want to replace up to right before the footer.
    // And ensure we close the outer div?
    // In view_file line 1178: `                                </div >`
    // Line 1180: footer.
    // So there is one closing div before footer.

    // So we invoke `correctAddBlock` + `\n                                </div>\n\n`.
    // And remove everything from addLabelIndex to addFooterIndex (exclusive).

    let contentPhase1 = fileContent.substring(0, addLabelIndex) + correctAddBlock + '\n                                </div>\n\n' + fileContent.substring(addFooterIndex);

    // --- Fix Edit Modal ---
    // Now searching in contentPhase1.
    const editLabelIndex = contentPhase1.indexOf(labelStr, addLabelIndex + correctAddBlock.length); // Search after the first one
    if (editLabelIndex === -1) throw new Error('Edit Modal Label not found');

    const editFooterIndex = contentPhase1.indexOf(footerStr, editLabelIndex);
    if (editFooterIndex === -1) throw new Error('Edit Modal Footer not found');

    const correctEditBlock = `<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Çözüm Adımları</label>
                                    <div className="space-y-4">
                                        {editingError.solutionSteps.map((step, index) => (
                                            <div key={index} className="flex gap-3 group items-start">
                                                <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 font-mono text-sm mt-1">
                                                    {index + 1}.
                                                </span>
                                                <div className="flex-grow space-y-2">
                                                    <div className="relative">
                                                        <textarea
                                                            rows="2"
                                                            className="w-full pl-4 pr-28 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-y"
                                                            placeholder={\`\${index + 1}. Adımı girin...\`}
                                                            value={step.text}
                                                            onChange={(e) => {
                                                                const newSteps = [...editingError.solutionSteps];
                                                                newSteps[index] = { ...newSteps[index], text: e.target.value };
                                                                setEditingError({ ...editingError, solutionSteps: newSteps });
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    setEditingError({ ...editingError, solutionSteps: [...editingError.solutionSteps, { text: '', imageUrl: null }] });
                                                                }
                                                            }}
                                                        ></textarea>
                                                        <div className="absolute right-2 top-2 flex items-center gap-1">
                                                            <label className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer select-none border border-slate-200 dark:border-slate-700">
                                                                <ImageIcon className="w-3.5 h-3.5" />
                                                                <span>Görsel</span>
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) {
                                                                            const reader = new FileReader();
                                                                            reader.onloadend = () => {
                                                                                const newSteps = [...editingError.solutionSteps];
                                                                                newSteps[index] = { ...newSteps[index], imageUrl: reader.result };
                                                                                setEditingError({ ...editingError, solutionSteps: newSteps });
                                                                            };
                                                                            reader.readAsDataURL(file);
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                            {editingError.solutionSteps.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newSteps = editingError.solutionSteps.filter((_, i) => i !== index);
                                                                        setEditingError({ ...editingError, solutionSteps: newSteps });
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                                    title="Adımı Sil"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {step.imageUrl && (
                                                        <div className="relative inline-block group/img">
                                                            <img src={step.imageUrl} alt="" className="h-20 w-auto rounded-lg border border-slate-200 dark:border-slate-700 object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newSteps = [...editingError.solutionSteps];
                                                                    newSteps[index] = { ...newSteps[index], imageUrl: null };
                                                                    setEditingError({ ...editingError, solutionSteps: newSteps });
                                                                }}
                                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setEditingError({ ...editingError, solutionSteps: [...editingError.solutionSteps, { text: '', imageUrl: null }] })}
                                            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Yeni Adım Ekle
                                        </button>
                                    </div>`;

    const finalContent = contentPhase1.substring(0, editLabelIndex) + correctEditBlock + '\n                                </div>\n\n' + contentPhase1.substring(editFooterIndex);

    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log('Fixed Both Modals successfully');

} catch (e) {
    fs.writeFileSync('error_log.txt', e.stack || e.toString());
    process.exit(1);
}
