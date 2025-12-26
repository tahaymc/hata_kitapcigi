const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\Users\\enp144\\Desktop\\proje\\hata_kitapcigi\\src\\pages\\HomePage.jsx');
const fileContent = fs.readFileSync(filePath, 'utf8');
const lines = fileContent.split('\n');

// Valid Code Block for "Solution Steps"
const correctBlock = `                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Çözüm Adımları</label>
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
                                    </div>
                                </div>`;

// Apply Fix for Add Modal
// Remove lines 1042 to 1179 (indices 1041 to 1178)
// Indices are 0-based, so line 1 is index 0.
// Line 1042 is index 1041.
// Line 1179 is index 1178.
const addModalStartIndex = 1041;
const addModalEndIndex = 1179; // Excluding this, so slice up to this? No, I want to remove up to 1179.
// Slice 1: 0 to 1041 (lines 1 to 1041)
// Slice 2: 1179 to end (lines 1180 to end)

const part1 = lines.slice(0, addModalStartIndex);
const part2 = lines.slice(addModalEndIndex); // This starts from line 1180
const newContentArray = [...part1, correctBlock, ...part2];
const intermediateContent = newContentArray.join('\n');

fs.writeFileSync(filePath, intermediateContent, 'utf8');
console.log('Fixed Add Modal');
