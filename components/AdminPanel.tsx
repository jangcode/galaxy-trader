import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Icon } from './icons';
import { PlanetEditorModal } from './PlanetEditorModal';
import type { Planet } from '../types';

export const AdminPanel: React.FC = () => {
    const { gameState } = useGame();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlanet, setEditingPlanet] = useState<Planet | null>(null);

    if (!gameState) return null;
    
    const handleAddNew = () => {
        setEditingPlanet(null);
        setIsModalOpen(true);
    };

    const handleEdit = (planet: Planet) => {
        setEditingPlanet(planet);
        setIsModalOpen(true);
    };
    
    return (
        <div className="animate-slide-in p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-orbitron text-accent-blue">Admin Panel: Planets</h2>
                <button
                    onClick={handleAddNew}
                    className="bg-accent-green/20 text-accent-green px-4 py-2 rounded-md hover:bg-accent-green/40 transition-colors flex items-center gap-2"
                >
                    <Icon name="new" className="w-5 h-5" />
                    Add New Planet
                </button>
            </div>
            
            <div className="bg-space-panel border border-space-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-space-dark/50 text-sm text-space-text-secondary">
                            <tr>
                                <th className="p-4 font-semibold">Name</th>
                                <th className="p-4 font-semibold">Description</th>
                                <th className="p-4 font-semibold text-center">Tax</th>
                                <th className="p-4 font-semibold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-space-border">
                            {gameState.galaxy.planets.map(planet => (
                                <PlanetRow key={planet.id} planet={planet} onEdit={handleEdit} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <PlanetEditorModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    planetToEdit={editingPlanet}
                />
            )}
        </div>
    );
};

interface PlanetRowProps {
    planet: Planet;
    onEdit: (planet: Planet) => void;
}

const PlanetRow: React.FC<PlanetRowProps> = ({ planet, onEdit }) => {
    const { actions, gameState } = useGame();

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${planet.name}? This action cannot be undone.`)) {
            actions.deletePlanet(planet.id);
        }
    };

    const isCurrentPlanet = gameState?.player.currentPlanetId === planet.id;
    const isBotPlanet = gameState?.autoBotState?.isActive && (gameState.autoBotState.originPlanetId === planet.id || gameState.autoBotState.destinationPlanetId === planet.id);
    const canBeDeleted = !isCurrentPlanet && !isBotPlanet && gameState!.galaxy.planets.length > 1;


    return (
        <tr className="hover:bg-space-dark/50">
            <td className="p-4 font-medium" style={{ color: planet.color }}>{planet.name}</td>
            <td className="p-4 text-space-text-secondary max-w-md truncate" title={planet.description}>
                {planet.description}
            </td>
            <td className="p-4 text-center font-mono">{(planet.taxRate * 100).toFixed(0)}%</td>
            <td className="p-4">
                <div className="flex justify-center items-center gap-2">
                    <button
                        onClick={() => onEdit(planet)}
                        className="p-2 bg-accent-blue/20 text-accent-blue rounded hover:bg-accent-blue/40"
                        title="Edit Planet"
                    >
                        Edit
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={!canBeDeleted}
                        className="p-2 bg-accent-red/20 text-accent-red rounded hover:bg-accent-red/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={canBeDeleted ? "Delete Planet" : "Cannot delete this planet (critical location or last planet)"}
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}
