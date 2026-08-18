import React, { useState } from 'react';
import {
  Plus,
  UserCheck,
  Search,
  Pencil,
  Trash2,
  UploadCloud,
  X,
  Building,
  Check,
} from 'lucide-react';
import { Team, CategoryType } from '../types';

interface ParticipantManagerProps {
  teams: Team[];
  onAddTeam: (name: string, category: CategoryType, club?: string) => void;
  onUpdateTeam: (id: string, name: string, category: CategoryType, club?: string) => void;
  onDeleteTeam: (id: string) => void;
  onBulkAddTeams: (lines: string[], category: CategoryType) => void;
  onClearAllTeams: () => void;
}

export const ParticipantManager: React.FC<ParticipantManagerProps> = ({
  teams,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  onBulkAddTeams,
  onClearAllTeams,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<CategoryType>('Non-Seeded');
  const [clubInput, setClubInput] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState<CategoryType>('Non-Seeded');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim().toUpperCase();
    if (!trimmed) return;

    if (editingTeamId) {
      onUpdateTeam(editingTeamId, trimmed, categoryInput, clubInput.trim());
      handleCancelEdit();
    } else {
      onAddTeam(trimmed, categoryInput, clubInput.trim());
      setNameInput('');
      setClubInput('');
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeamId(team.id);
    setNameInput(team.name);
    setCategoryInput(team.category);
    setClubInput(team.club || '');
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setNameInput('');
    setCategoryInput('Non-Seeded');
    setClubInput('');
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim().toUpperCase())
      .filter((l) => l.length > 0);

    if (lines.length > 0) {
      onBulkAddTeams(lines, bulkCategory);
      setBulkText('');
      setShowBulkModal(false);
    }
  };

  const filteredTeams = teams.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.club && t.club.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = filterCategory === 'all' || t.category === filterCategory;
    return matchSearch && matchCat;
  });

  const seededACount = teams.filter((t) => t.category === 'Seeded A').length;
  const seededBCount = teams.filter((t) => t.category === 'Seeded B').length;
  const nonSeededCount = teams.filter((t) => t.category === 'Non-Seeded').length;

  return (
    <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 animate-fadeIn">
      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <UserCheck size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Total Peserta</div>
            <div className="text-xl font-bold text-slate-100">{teams.length} Tim</div>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            A
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Seeded A</div>
            <div className="text-xl font-bold text-amber-400">{seededACount} Tim</div>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
            B
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Seeded B</div>
            <div className="text-xl font-bold text-blue-400">{seededBCount} Tim</div>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 font-bold">
            N
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Non-Seeded</div>
            <div className="text-xl font-bold text-slate-200">{nonSeededCount} Tim</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left, List Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Form */}
        <div className="lg:col-span-4 bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h2 className="text-base font-bold text-blue-400 uppercase tracking-wide flex items-center gap-2">
              {editingTeamId ? <Pencil size={18} /> : <Plus size={18} />}
              {editingTeamId ? 'Edit Peserta' : 'Tambah Peserta Baru'}
            </h2>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-2.5 py-1 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-lg hover:bg-emerald-900/40 transition-colors flex items-center gap-1 cursor-pointer"
              title="Tambah Banyak Tim Sekaligus"
            >
              <UploadCloud size={14} />
              Banyak Tim
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Nama Pasangan / Tim <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Contoh: AMIR / BUDI"
                required
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-slate-100 text-sm p-2.5 rounded-lg outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Kategori Seeded</label>
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value as CategoryType)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-slate-100 text-sm p-2.5 rounded-lg outline-none cursor-pointer"
              >
                <option value="Non-Seeded">Non-Seeded</option>
                <option value="Seeded A">Seeded A (Unggulan 1)</option>
                <option value="Seeded B">Seeded B (Unggulan 2)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Building size={12} />
                Asal Klub / Instansi (Opsional)
              </label>
              <input
                type="text"
                value={clubInput}
                onChange={(e) => setClubInput(e.target.value)}
                placeholder="Contoh: PB MAHAP / JAKARTA"
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-slate-100 text-sm p-2.5 rounded-lg outline-none transition-colors"
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {editingTeamId ? (
                  <>
                    <Check size={16} /> Simpan Perubahan
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Simpan Peserta
                  </>
                )}
              </button>

              {editingTeamId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-sm rounded-lg border border-slate-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <X size={16} /> Batal Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Panel: Team Table */}
        <div className="lg:col-span-8 bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col min-h-[450px]">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-200 uppercase tracking-wide">
              Daftar Peserta Terdaftar ({filteredTeams.length})
            </h2>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 sm:w-48">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tim..."
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs pl-8 pr-2 py-1.5 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-100 text-xs px-2 py-1.5 rounded-lg outline-none"
              >
                <option value="all">Semua Kategori</option>
                <option value="Seeded A">Seeded A</option>
                <option value="Seeded B">Seeded B</option>
                <option value="Non-Seeded">Non-Seeded</option>
              </select>

              {teams.length > 0 && (
                <button
                  onClick={onClearAllTeams}
                  className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-600/40 text-rose-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Hapus Semua Peserta"
                >
                  <Trash2 size={13} />
                  Bersihkan
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto max-h-[500px] border border-slate-700/60 rounded-lg">
            {filteredTeams.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Belum ada peserta terdaftar yang sesuai kriteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase sticky top-0 border-b border-slate-700">
                    <th className="py-2.5 px-3 text-center w-12">No</th>
                    <th className="py-2.5 px-3">Nama Pasangan / Tim</th>
                    <th className="py-2.5 px-3">Klub</th>
                    <th className="py-2.5 px-3 w-32">Kategori</th>
                    <th className="py-2.5 px-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredTeams.map((team, idx) => {
                    let badgeColor =
                      'bg-slate-700 border-slate-600 text-slate-300';
                    if (team.category === 'Seeded A') {
                      badgeColor =
                        'bg-amber-500/15 border-amber-500/40 text-amber-400';
                    } else if (team.category === 'Seeded B') {
                      badgeColor =
                        'bg-blue-500/15 border-blue-500/40 text-blue-400';
                    }

                    return (
                      <tr
                        key={team.id}
                        className="hover:bg-slate-700/30 transition-colors group"
                      >
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400 text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-100">
                          {team.name}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-400">
                          {team.club || '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-xs font-bold border rounded-md ${badgeColor}`}
                          >
                            {team.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEdit(team)}
                              className="p-1.5 text-amber-400 hover:bg-amber-500/20 rounded transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => onDeleteTeam(team.id)}
                              className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <UploadCloud size={18} className="text-emerald-400" />
                Tambah Banyak Tim Sekaligus
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Target Kategori Seeded
                </label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value as CategoryType)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs p-2 rounded-lg outline-none"
                >
                  <option value="Non-Seeded">Non-Seeded</option>
                  <option value="Seeded A">Seeded A</option>
                  <option value="Seeded B">Seeded B</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Daftar Nama Pasangan (1 Nama per Baris)
                </label>
                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`AMIR / BUDI\nCECEP / DEDI\nEKO / FAJAR\nGANI / HADI`}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs p-3 rounded-lg outline-none font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-700 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Proses Tambah Banyak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
