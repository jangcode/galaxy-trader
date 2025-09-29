import React, { useState, useEffect } from 'react';
import type { Planet } from '../types';
import { useGame } from '../contexts/GameContext';
import { Icon } from './icons';

interface PlanetEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    planetToEdit: Planet | null;
}

export const PlanetEditorModal: React.FC<PlanetEditorModalProps> = ({ isOpen, onClose, planetToEdit }) => {
    const { actions } = useGame();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [taxRate, setTaxRate] = useState(5);
    const [color, setColor] = useState('#FFFFFF');
    
    const isEditing = !!planetToEdit;

    useEffect(() => {
        if (planetToEdit) {
            setName(planetToEdit.name);
            setDescription(planetToEdit.description);
            setTaxRate(planetToEdit.taxRate * 100);
            setColor(planetToEdit.color);
        } else {
            // Reset for new planet
            setName('');
            setDescription('');
            setTaxRate(5);
            setColor('#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'));
        }
    }, [planetToEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const planetData = {
            name,
            description,
            taxRate: taxRate / 100,
            color
        };
        
        if (isEditing && planetToEdit) {
            await actions.updatePlanet({ id: planetToEdit.id, ...planetData });
        } else {
            await actions.addPlanet(planetData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-space-panel rounded-lg shadow-xl w-full max-w-2xl m-4 border border-space-border">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-space-border flex justify-between items-center">
                        <h2 className="text-2xl font-orbitron text-white">
                            {isEditing ? `Edit ${planetToEdit.name}` : 'Add New Planet'}
                        </h2>
                        <button type="button" onClick={onClose} className="text-space-text-secondary hover:text-white">
                            <Icon name="close" className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Column 1 */}
                        <div className="space-y-4">
                             <div>
                                <label htmlFor="name" className="block text-sm font-medium text-space-text-secondary">Planet Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="mt-1 block w-full bg-space-dark border border-space-border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-accent-blue focus:border-accent-blue sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-space-text-secondary">Description</label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    rows={8}
                                    className="mt-1 block w-full bg-space-dark border border-space-border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-accent-blue focus:border-accent-blue sm:text-sm"
                                    placeholder="e.g., A mineral-rich volcanic planet. The harsh environment makes food and water scarce..."
                                />
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="taxRate" className="block text-sm font-medium text-space-text-secondary">Tax Rate (%)</label>
                                <input
                                    id="taxRate"
                                    type="number"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                                    required
                                    min="0"
                                    max="100"
                                    step="1"
                                    className="mt-1 block w-full bg-space-dark border border-space-border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-accent-blue focus:border-accent-blue sm:text-sm"
                                />
                            </div>
                             <div>
                                <label htmlFor="color" className="block text-sm font-medium text-space-text-secondary">Map Color</label>
                                <div className="mt-1 flex items-center gap-2">
                                     <input
                                        id="color-picker"
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="p-1 h-10 w-10 block bg-space-dark border-space-border cursor-pointer rounded-md"
                                    />
                                    <input
                                        id="color"
                                        type="text"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        required
                                        className="block w-full bg-space-dark border border-space-border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-accent-blue focus:border-accent-blue sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div className="bg-space-dark/50 border border-space-border p-4 rounded-md">
                                <h4 className="font-bold text-accent-yellow">AI Market Generation</h4>
                                <p className="text-sm text-space-text-secondary mt-1">
                                    When you save, the planetary market and specialty good will be automatically generated by AI based on the planet's name and description.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-space-dark/50 rounded-b-lg flex justify-end">
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-md font-bold text-white bg-accent-blue hover:bg-accent-blue/80 transition-colors"
                        >
                            {isEditing ? 'Save Changes' : 'Create Planet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
