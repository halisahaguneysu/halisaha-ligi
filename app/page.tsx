'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Zap, LogOut, PlusCircle, Star, User, X, Activity, Calendar, Filter, Users, Trash2, Check, Home, Shield, Award, Table, Crown, Layers, LayoutGrid, GripVertical, Save, Sliders, Download, Share2, Sparkles } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toPng } from 'html-to-image';

interface StatDef {
  id: string;
  key: string;
  title: string;
  point_value?: number;
  category?: string;
  display_order?: number;
}

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  role?: 'admin' | 'player';
  preferred_position?: string;
  email?: string;
}

interface Season {
  id: string;
  name: string;
  is_active: boolean;
}

interface Match {
  id: string;
  match_date: string;
  description?: string;
  season_id?: string;
}

interface MatchPlayerDetail {
  player_id: string;
  position?: string;
  team?: 'A' | 'B';
  shirt_number?: number;
}

interface PlayerStatsGrouped {
  profile: Profile;
  stats: Record<string, number>;
  totalPoints: number;
  matchPosition?: string;
  matchTeam?: 'A' | 'B';
  shirtNumber?: number;
}

const DEFAULT_STAT_DEFS: StatDef[] = [
  { id: '1', key: 'matches', title: 'Maç', point_value: 10 },
  { id: '2', key: 'goals', title: 'Gol', point_value: 8 },
  { id: '3', key: 'assists', title: 'Asist', point_value: 6 },
  { id: '4', key: 'shots', title: 'Şut', point_value: 2 },
  { id: '5', key: 'shots_off_target', title: 'İsabetsiz Şut', point_value: -1 },
  { id: '6', key: 'passes', title: 'Pas', point_value: 3 },
  { id: '7', key: 'dribbles', title: 'Çalım', point_value: 3 },
  { id: '8', key: 'tackles', title: 'Müdahale', point_value: 3 },
  { id: '9', key: 'saves', title: 'Kurtarış', point_value: 3 },
  { id: '10', key: 'conceded_goals', title: 'Yenen Gol', point_value: -1 },
  { id: '11', key: 'wins', title: 'Galibiyet', point_value: 10 },
  { id: '12', key: 'losses', title: 'Mağlubiyet', point_value: 0 },
  { id: '13', key: 'yellow_cards', title: 'Sarı Kart', point_value: 0 },
  { id: '14', key: 'red_cards', title: 'Kırmızı Kart', point_value: 0 },
];

const FORMATIONS: Record<string, { size: number; name: string; lines: { role: string; count: number }[] }> = {
  // 6v6 Dizilişleri
  '6-2-2-1': {
    size: 6,
    name: '2 - 2 - 1 (2 Def, 2 OS, 1 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 2 },
      { role: 'OS', count: 2 },
      { role: 'FV', count: 1 },
    ],
  },
  '6-2-1-2': {
    size: 6,
    name: '2 - 1 - 2 (2 Def, 1 OS, 2 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 2 },
      { role: 'OS', count: 1 },
      { role: 'FV', count: 2 },
    ],
  },
  '6-1-3-1': {
    size: 6,
    name: '1 - 3 - 1 (1 Def, 3 OS, 1 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 1 },
      { role: 'OS', count: 3 },
      { role: 'FV', count: 1 },
    ],
  },
  '6-3-1-1': {
    size: 6,
    name: '3 - 1 - 1 (3 Def, 1 OS, 1 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 3 },
      { role: 'OS', count: 1 },
      { role: 'FV', count: 1 },
    ],
  },
  '6-1-2-2': {
    size: 6,
    name: '1 - 2 - 2 (1 Def, 2 OS, 2 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 1 },
      { role: 'OS', count: 2 },
      { role: 'FV', count: 2 },
    ],
  },

  // 7v7 Dizilişleri
  '7-3-3': {
    size: 7,
    name: '3 - 3 (3 Defans, 3 Forvet)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 3 },
      { role: 'FV', count: 3 },
    ],
  },
  '7-2-2-2': {
    size: 7,
    name: '2 - 2 - 2 (2 Def, 2 OS, 2 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 2 },
      { role: 'OS', count: 2 },
      { role: 'FV', count: 2 },
    ],
  },
  '7-3-2-1': {
    size: 7,
    name: '3 - 2 - 1 (3 Def, 2 OS, 1 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 3 },
      { role: 'OS', count: 2 },
      { role: 'FV', count: 1 },
    ],
  },
  '7-2-3-1': {
    size: 7,
    name: '2 - 3 - 1 (2 Def, 3 OS, 1 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 2 },
      { role: 'OS', count: 3 },
      { role: 'FV', count: 1 },
    ],
  },
  '7-1-3-2': {
    size: 7,
    name: '1 - 3 - 2 (1 Def, 3 OS, 2 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 1 },
      { role: 'OS', count: 3 },
      { role: 'FV', count: 2 },
    ],
  },
  '7-3-1-2': {
    size: 7,
    name: '3 - 1 - 2 (3 Def, 1 OS, 2 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 3 },
      { role: 'OS', count: 1 },
      { role: 'FV', count: 2 },
    ],
  },

  // 8v8 Dizilişleri
  '8-3-2-2': {
    size: 8,
    name: '3 - 2 - 2 (3 Def, 2 OS, 2 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 3 },
      { role: 'OS', count: 2 },
      { role: 'FV', count: 2 },
    ],
  },
  '8-2-3-2': {
    size: 8,
    name: '2 - 3 - 2 (2 Def, 3 OS, 2 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 2 },
      { role: 'OS', count: 3 },
      { role: 'FV', count: 2 },
    ],
  },
  '8-3-3-1': {
    size: 8,
    name: '3 - 3 - 1 (3 Def, 3 OS, 1 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 3 },
      { role: 'OS', count: 3 },
      { role: 'FV', count: 1 },
    ],
  },
  '8-2-2-3': {
    size: 8,
    name: '2 - 2 - 3 (2 Def, 2 OS, 3 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 2 },
      { role: 'OS', count: 2 },
      { role: 'FV', count: 3 },
    ],
  },
  '8-4-2-1': {
    size: 8,
    name: '4 - 2 - 1 (4 Def, 2 OS, 1 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 4 },
      { role: 'OS', count: 2 },
      { role: 'FV', count: 1 },
    ],
  },
  '8-3-1-3': {
    size: 8,
    name: '3 - 1 - 3 (3 Def, 1 OS, 3 Forv)',
    lines: [
      { role: 'KL', count: 1 },
      { role: 'DF', count: 3 },
      { role: 'OS', count: 1 },
      { role: 'FV', count: 3 },
    ],
  },
};

// Tarih Formatlama Yardımcısı: "2026-05-05" -> "05.05.2026"
const formatDateTR = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}.${month}.${year}`;
  }
  return dateStr;
};

// Maç Metni Formatlama: "1. Hafta - 05.05.2026"
const formatMatchLabel = (match: Match) => {
  const desc = match.description || 'Maç';
  const dateFormatted = formatDateTR(match.match_date);
  return `${desc} - ${dateFormatted}`;
};

// V-Yaka SVG Forma İkonu Bileşeni
const JerseyIcon = ({ number, jerseyColor, numberColor }: { number: number; jerseyColor: string; numberColor: string }) => (
  <div className="relative w-12 h-12 flex items-center justify-center drop-shadow-lg">
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path
        d="M 30 15 L 42 22 C 45 25, 55 25, 58 22 L 70 15 L 88 32 L 76 44 L 76 85 C 76 88, 73 90, 70 90 L 30 90 C 27 90, 24 88, 24 85 L 24 44 L 12 32 Z"
        fill={jerseyColor}
        stroke="#1e293b"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* V Yaka Çizgisi */}
      <path d="M 42 22 L 50 32 L 58 22" fill="none" stroke="#1e293b" strokeWidth="3.5" />
    </svg>
    <span
      className="absolute text-sm font-black tracking-tighter select-none pt-1.5"
      style={{ color: numberColor }}
    >
      {number}
    </span>
  </div>
);

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [statDefs, setStatDefs] = useState<StatDef[]>(DEFAULT_STAT_DEFS);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [playersData, setPlayersData] = useState<PlayerStatsGrouped[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('ALL');
  const [selectedFilterMatchId, setSelectedFilterMatchId] = useState<string>('ALL');

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  
  // Taktik Tahtası (Kendi Kadronu Kur Modu)
  const [isCustomTacticsMode, setIsCustomTacticsMode] = useState(false);
  const pitchRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Resmi Maç Dizilişi Değişkenleri ile Taktik Tahtası Değişkenleri Ayrıldı
  const [officialTeamSize, setOfficialTeamSize] = useState<number>(7);
  const [officialFormation, setOfficialFormation] = useState<string>('7-3-3');

  const [customTeamSize, setCustomTeamSize] = useState<number>(7);
  const [customFormation, setCustomFormation] = useState<string>('7-3-3');
  
  const [adminMatchId, setAdminMatchId] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [inputStats, setInputStats] = useState<Record<string, number>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentMatchSquadDetails, setCurrentMatchSquadDetails] = useState<MatchPlayerDetail[]>([]);

  const [newMatchDate, setNewMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMatchDesc, setNewMatchDesc] = useState('');
  const [showNewMatchForm, setShowNewMatchForm] = useState(false);

  const [newSeasonName, setNewSeasonName] = useState('');
  const [deletingSeasonId, setDeletingSeasonId] = useState('');

  // Canlı Maç Skoru Durumu (A Takımı - B Takımı)
  const [matchScore, setMatchScore] = useState<{ teamA: number; teamB: number; hasGoals: boolean }>({
    teamA: 0,
    teamB: 0,
    hasGoals: false
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUser(session.user);
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setCurrentUser(session.user);
        fetchUserProfile(session.user);
      } else {
        setCurrentUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    loadInitialData();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchStatsAndPlayers(selectedSeasonId, selectedFilterMatchId);
  }, [selectedSeasonId, selectedFilterMatchId]);

  useEffect(() => {
    if (adminMatchId && allProfiles.length > 0 && !isCustomTacticsMode) {
      loadMatchSquadAndAwards(adminMatchId);
    }
  }, [adminMatchId, allProfiles, isCustomTacticsMode]);

  const fetchUserProfile = async (authUser: any) => {
    if (!authUser) return;

    let { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (!prof && authUser.email) {
      const res = await supabase
        .from('profiles')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();
      prof = res.data;
    }

    if (prof) setProfile(prof);
    setLoading(false);
  };

  const loadInitialData = async () => {
    setLoading(true);

    const { data: defs } = await supabase
      .from('stat_definitions')
      .select('id, key, title, point_value, category, display_order, is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    const activeDefs = (defs && defs.length > 0) ? defs : DEFAULT_STAT_DEFS;
    setStatDefs(activeDefs);

    const { data: seasonList } = await supabase
      .from('seasons')
      .select('*')
      .order('created_at', { ascending: false });

    if (seasonList && seasonList.length > 0) {
      setSeasons(seasonList);
      const activeSeason = seasonList.find(s => s.is_active) || seasonList[0];
      setSelectedSeasonId(activeSeason.id);
      setDeletingSeasonId(seasonList[0].id);
    } else {
      setSeasons([]);
    }

    const { data: profs } = await supabase
      .from('profiles')
      .select('*')
      .or('role.eq.player,role.is.null');

    const playerProfiles = profs || [];
    setAllProfiles(playerProfiles);

    const { data: matchList } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false });

    if (matchList && matchList.length > 0) {
      setMatches(matchList);
      if (!adminMatchId) {
        setAdminMatchId(matchList[0].id);
      }
    }

    await fetchStatsAndPlayers(selectedSeasonId, 'ALL', activeDefs, playerProfiles, matchList || []);
  };

  const loadMatchSquadAndAwards = async (matchId: string) => {
    if (!matchId) return;

    const savedShirtNumbersKey = `shirt_numbers_${matchId}`;
    let savedNumbersMap: Record<string, number> = {};
    try {
      const localData = localStorage.getItem(savedShirtNumbersKey);
      if (localData) savedNumbersMap = JSON.parse(localData);
    } catch (e) {}

    const { data: squad, error } = await supabase
      .from('match_players')
      .select('player_id, position, team')
      .eq('match_id', matchId);

    if (error) {
      console.error("Match players fetch error:", error);
      return;
    }

    if (squad && squad.length > 0) {
      const existingPlayerIds = squad.map(s => s.player_id);
      const squadDetails: MatchPlayerDetail[] = squad.map((s, idx) => ({
        player_id: s.player_id,
        position: s.position || 'NONE',
        team: s.team || 'A',
        shirt_number: savedNumbersMap[s.player_id] ?? (idx + 1)
      }));

      allProfiles.forEach((p, idx) => {
        if (!existingPlayerIds.includes(p.id)) {
          squadDetails.push({
            player_id: p.id,
            position: 'NONE',
            team: undefined,
            shirt_number: savedNumbersMap[p.id] ?? (idx + 1)
          });
        }
      });

      setCurrentMatchSquadDetails(squadDetails);
      calculateMatchScore(matchId, squadDetails);
    } else {
      const defaultSquad: MatchPlayerDetail[] = allProfiles.map((p, idx) => ({
        player_id: p.id,
        position: 'NONE',
        team: undefined,
        shirt_number: savedNumbersMap[p.id] ?? (idx + 1)
      }));
      setCurrentMatchSquadDetails(defaultSquad);
      setMatchScore({ teamA: 0, teamB: 0, hasGoals: false });
    }
  };

  const calculateMatchScore = async (matchId: string, squad: MatchPlayerDetail[]) => {
    const goalDef = statDefs.find(d => d.key === 'goals' || d.title.toLowerCase() === 'gol');
    if (!goalDef) return;

    const { data: goalsData } = await supabase
      .from('player_stats')
      .select('player_id, value')
      .eq('match_id', matchId)
      .eq('stat_id', goalDef.id);

    if (!goalsData || goalsData.length === 0) {
      setMatchScore({ teamA: 0, teamB: 0, hasGoals: false });
      return;
    }

    let scoreA = 0;
    let scoreB = 0;
    let hasAnyGoal = false;

    goalsData.forEach(g => {
      const val = Number(g.value || 0);
      if (val > 0) {
        hasAnyGoal = true;
        const playerDetail = squad.find(s => s.player_id === g.player_id);
        if (playerDetail?.team === 'A') scoreA += val;
        if (playerDetail?.team === 'B') scoreB += val;
      }
    });

    setMatchScore({ teamA: scoreA, teamB: scoreB, hasGoals: hasAnyGoal });
  };

  const handleOpenPitchModal = (isCustom: boolean = false) => {
    setIsCustomTacticsMode(isCustom);

    if (isCustom) {
      const emptySquad: MatchPlayerDetail[] = allProfiles.map((p, idx) => ({
        player_id: p.id,
        position: 'NONE',
        team: undefined,
        shirt_number: idx + 1
      }));
      setCurrentMatchSquadDetails(emptySquad);
      setMatchScore({ teamA: 0, teamB: 0, hasGoals: false });
    } else {
      const targetMatchId = selectedFilterMatchId !== 'ALL' ? selectedFilterMatchId : (matches[0]?.id || adminMatchId);
      if (targetMatchId) {
        setAdminMatchId(targetMatchId);
        loadMatchSquadAndAwards(targetMatchId);
      }
    }
    setIsPitchModalOpen(true);
  };

  const handleDownloadPitchImage = async () => {
    if (!pitchRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(pitchRef.current, { cacheBust: true, quality: 0.95 });
      const link = document.createElement('a');
      link.download = `Halisaha_Kadro_Dizilisi_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Resim indirilirken hata oluştu:', err);
      alert('Resim oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSharePitchImage = async () => {
    if (!pitchRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(pitchRef.current, { cacheBust: true, quality: 0.95 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'halisaha-kadro.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Halısaha Kadro Dizilişi',
          text: 'İşte oluşturduğum halısaha kadro dizilişi!',
          files: [file],
        });
      } else {
        handleDownloadPitchImage();
      }
    } catch (err) {
      console.error('Paylaşım hatası:', err);
      handleDownloadPitchImage();
    } finally {
      setIsExporting(false);
    }
  };

  const calculateTotalPoints = (stats: Record<string, number>, currentDefs: StatDef[]) => {
    let total = 0;
    currentDefs.forEach((def) => {
      const statVal = Number(stats[def.key] || 0);
      const pointMultiplier = Number(def.point_value || 0);
      total += statVal * pointMultiplier;
    });
    return total;
  };

  const fetchStatsAndPlayers = async (
    seasonId: string, 
    filterMatchId: string, 
    currentDefs = statDefs, 
    profilesList = allProfiles,
    currentMatches = matches
  ) => {
    setLoading(true);
    let activeProfiles = profilesList.filter((p) => p.role !== 'admin');

    let filteredMatches = currentMatches;
    if (seasonId !== 'ALL') {
      filteredMatches = filteredMatches.filter(m => m.season_id === seasonId);
    }
    
    const validMatchIds = filteredMatches.map(m => m.id);

    let squadDetails: MatchPlayerDetail[] = [];

    if (filterMatchId !== 'ALL') {
      const savedShirtNumbersKey = `shirt_numbers_${filterMatchId}`;
      let savedNumbersMap: Record<string, number> = {};
      try {
        const localData = localStorage.getItem(savedShirtNumbersKey);
        if (localData) savedNumbersMap = JSON.parse(localData);
      } catch (e) {}

      const { data: squadData } = await supabase
        .from('match_players')
        .select('player_id, position, team')
        .eq('match_id', filterMatchId);

      const fieldSquad = squadData?.filter(s => s.position && s.position !== 'NONE' && s.team) || [];

      if (fieldSquad.length > 0) {
        squadDetails = fieldSquad.map((s, idx) => ({
          player_id: s.player_id,
          position: s.position,
          team: s.team,
          shirt_number: savedNumbersMap[s.player_id] ?? (idx + 1)
        }));
        const squadPlayerIds = squadDetails.map((s) => s.player_id);
        activeProfiles = activeProfiles.filter((p) => squadPlayerIds.includes(p.id));
      } else {
        setPlayersData([]);
        setLoading(false);
        return;
      }
    }

    let statsQuery = supabase.from('player_stats').select('player_id, stat_id, value, match_id');
    
    if (filterMatchId !== 'ALL') {
      statsQuery = statsQuery.eq('match_id', filterMatchId);
    } else if (seasonId !== 'ALL' && validMatchIds.length > 0) {
      statsQuery = statsQuery.in('match_id', validMatchIds);
    } else if (seasonId !== 'ALL' && validMatchIds.length === 0) {
      setPlayersData([]);
      setLoading(false);
      return;
    }

    const { data: statsData } = await statsQuery;

    const grouped: PlayerStatsGrouped[] = activeProfiles.map((prof) => {
      const pStats: Record<string, number> = {};

      currentDefs.forEach((d) => {
        const matchedStats = statsData?.filter(
          (s) => s.player_id === prof.id && (s.stat_id === d.id || s.stat_id === d.key)
        ) || [];

        const totalVal = matchedStats.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
        pStats[d.key] = totalVal;
      });

      const totalPoints = calculateTotalPoints(pStats, currentDefs);
      const matchDetail = squadDetails.find(s => s.player_id === prof.id);

      return { 
        profile: prof, 
        stats: pStats, 
        totalPoints,
        matchPosition: matchDetail?.position !== 'NONE' ? matchDetail?.position : undefined,
        matchTeam: matchDetail?.team,
        shirtNumber: matchDetail?.shirt_number
      };
    });

    setPlayersData(grouped);
    setLoading(false);
  };

  const handleCreateSeason = async () => {
    if (!newSeasonName.trim()) return;

    await supabase.from('seasons').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');

    const { error } = await supabase.from('seasons').insert([
      { name: newSeasonName, is_active: true }
    ]);

    if (error) {
      alert('Sezon oluşturulamadı: ' + error.message);
    } else {
      alert(`🎉 "${newSeasonName}" başarıyla başlatıldı!`);
      setNewSeasonName('');
      await loadInitialData();
    }
  };

  const handleDeleteSeason = async () => {
    if (!deletingSeasonId) return;

    const targetSeason = seasons.find(s => s.id === deletingSeasonId);
    const seasonMatches = matches.filter(m => m.season_id === deletingSeasonId);

    const confirmMessage = seasonMatches.length > 0 
      ? `⚠️ DİKKAT: "${targetSeason?.name}" sezonunu silmek istediğinizden emin misiniz? Bu sezona ait ${seasonMatches.length} adet maçın sezon bağı silinecektir!`
      : `"${targetSeason?.name}" sezonunu silmek istediğinize emin misiniz?`;

    if (!confirm(confirmMessage)) return;

    setLoading(true);

    const { error } = await supabase.from('seasons').delete().eq('id', deletingSeasonId);

    if (error) {
      alert('Sezon silinirken hata oluştu: ' + error.message);
      setLoading(false);
      return;
    }

    alert('Sezon başarıyla silindi.');

    if (targetSeason?.is_active) {
      const remainingSeasons = seasons.filter(s => s.id !== deletingSeasonId);
      if (remainingSeasons.length > 0) {
        await supabase.from('seasons').update({ is_active: true }).eq('id', remainingSeasons[0].id);
      }
    }

    setSelectedSeasonId('ALL');
    await loadInitialData();
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchDate) return;

    const currentActiveSeason = seasons.find(s => s.is_active);

    const { data: matchData, error: matchErr } = await supabase
      .from('matches')
      .insert([
        {
          match_date: newMatchDate,
          description: newMatchDesc || 'Maç',
          season_id: currentActiveSeason?.id || null
        },
      ])
      .select()
      .single();

    if (matchErr || !matchData) {
      alert('Maç oluşturulurken hata oluştu: ' + matchErr?.message);
      return;
    }

    setShowNewMatchForm(false);
    setNewMatchDesc('');
    alert('Maç başarıyla eklendi!');
    await loadInitialData();
  };

  const handleDragEnd = (result: DropResult) => {
    if (!isAdmin && !isCustomTacticsMode) return;

    const { destination, draggableId } = result;
    if (!destination) return;

    const targetKey = destination.droppableId;
    const updated = [...currentMatchSquadDetails];
    const targetIndex = updated.findIndex((s) => s.player_id === draggableId);

    if (targetIndex !== -1) {
      if (targetKey === 'POOL') {
        updated[targetIndex].team = undefined;
        updated[targetIndex].position = 'NONE';
      } else if (targetKey.startsWith('TEAM_A_')) {
        updated[targetIndex].team = 'A';
        updated[targetIndex].position = targetKey.replace('TEAM_A_', '');
      } else if (targetKey.startsWith('TEAM_B_')) {
        updated[targetIndex].team = 'B';
        updated[targetIndex].position = targetKey.replace('TEAM_B_', '');
      }
      setCurrentMatchSquadDetails(updated);
    }
  };

  const handleUpdateShirtNumber = (playerId: string, currentNum: number = 1) => {
    if (!isAdmin && !isCustomTacticsMode) return;
    const newNumStr = prompt("Yeni forma numarasını girin:", String(currentNum));
    if (newNumStr === null) return;
    const newNum = parseInt(newNumStr, 10);
    if (isNaN(newNum)) return;

    const updated = currentMatchSquadDetails.map((s) => {
      if (s.player_id === playerId) {
        return { ...s, shirt_number: newNum };
      }
      return s;
    });
    setCurrentMatchSquadDetails(updated);
  };

  const handleUpdateSquadDetails = async () => {
    if (!isAdmin || !adminMatchId) {
      alert('Lütfen önce işlem yapılacak maçı seçin!');
      return;
    }

    const savedShirtNumbersKey = `shirt_numbers_${adminMatchId}`;
    const shirtNumbersMap: Record<string, number> = {};
    currentMatchSquadDetails.forEach(s => {
      if (s.shirt_number !== undefined) {
        shirtNumbersMap[s.player_id] = s.shirt_number;
      }
    });
    try {
      localStorage.setItem(savedShirtNumbersKey, JSON.stringify(shirtNumbersMap));
    } catch (e) {}

    const fieldPlayers = currentMatchSquadDetails.filter(s => s.position && s.position !== 'NONE' && s.team);

    const { error: delErr } = await supabase.from('match_players').delete().eq('match_id', adminMatchId);
    if (delErr) {
      alert('Diziliş silinirken hata oluştu: ' + delErr.message);
      return;
    }

    if (fieldPlayers.length > 0) {
      const squadInserts = fieldPlayers.map((s) => ({
        match_id: adminMatchId,
        player_id: s.player_id,
        position: s.position,
        team: s.team
      }));
      
      const { error: insErr } = await supabase.from('match_players').insert(squadInserts);
      if (insErr) {
        alert('Diziliş kaydedilirken veritabanı hatası: ' + insErr.message);
        return;
      }
    }

    alert('✅ Seçili maçın saha kadrosu, dizilişi ve forma numaraları başarıyla kaydedildi!');
    
    await loadMatchSquadAndAwards(adminMatchId);
    await fetchStatsAndPlayers(selectedSeasonId, selectedFilterMatchId);
  };

  const handleDeleteMatch = async () => {
    if (!adminMatchId) return;

    const selectedMatch = matches.find((m) => m.id === adminMatchId);
    const confirmDelete = confirm(
      `⚠️ DİKKAT: ${formatMatchLabel(selectedMatch || { id: '', match_date: '' })} maçını, bu maça ait tüm istatistikleri ve saha kadrolarını silmek istediğinize emin misiniz?`
    );

    if (!confirmDelete) return;

    setLoading(true);

    try {
      localStorage.removeItem(`shirt_numbers_${adminMatchId}`);
    } catch (e) {}

    const { error } = await supabase.from('matches').delete().eq('id', adminMatchId);

    if (error) {
      alert('Maç silinirken hata oluştu: ' + error.message);
      setLoading(false);
      return;
    }

    alert('Maç ve maça ait tüm veriler başarıyla silindi.');
    setSelectedFilterMatchId('ALL');
    await loadInitialData();
  };

  const handleSaveStats = async () => {
    if (!selectedPlayerId || !adminMatchId) return;

    setLoading(true);

    for (const def of statDefs) {
      const val = inputStats[def.key] ?? 0;

      const { data: existing } = await supabase
        .from('player_stats')
        .select('id')
        .eq('player_id', selectedPlayerId)
        .eq('stat_id', def.id)
        .eq('match_id', adminMatchId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('player_stats')
          .update({ value: val, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('player_stats').insert({
          player_id: selectedPlayerId,
          stat_id: def.id,
          match_id: adminMatchId,
          value: val,
        });
      }
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    await loadInitialData();
    await loadMatchSquadAndAwards(adminMatchId);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    let loginEmail = usernameOrEmail.trim();

    if (!loginEmail.includes('@')) {
      const { data, error } = await supabase.rpc('get_email_by_username', {
        p_username: loginEmail,
      });

      if (error || !data) {
        setAuthError('Kullanıcı adı veya şifre hatalı!');
        return;
      }
      loginEmail = data;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password,
    });

    if (loginError) setAuthError('Kullanıcı adı/e-posta veya şifre hatalı!');
  };

  const handleLogout = () => supabase.auth.signOut();

  const handleGoHome = () => {
    setSelectedFilterMatchId('ALL');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const matchedPlayerInList = playersData.find(
    (p) => p.profile.id === currentUser?.id || p.profile.email === currentUser?.email
  );

  const activeProfile = profile || matchedPlayerInList?.profile;
  const displayName = activeProfile?.full_name || currentUser?.email?.split('@')[0] || 'Oyuncu';
  const displayUsername = activeProfile?.username || '';
  const isAdmin = activeProfile?.role === 'admin';

  const selectedMatch = matches.find((m) => m.id === selectedFilterMatchId);
  const filteredMatchesForSelect = selectedSeasonId === 'ALL' 
    ? matches 
    : matches.filter(m => m.season_id === selectedSeasonId);

  const sortedPlayers = [...playersData].sort((a, b) => b.totalPoints - a.totalPoints);

  const getWeeklyAutomatedAwards = () => {
    if (selectedFilterMatchId === 'ALL' || playersData.length === 0) {
      return { mvp: 'Belirlenmedi', gk: 'Belirlenmedi', def: 'Belirlenmedi', fwd: 'Belirlenmedi' };
    }

    const topMvp = sortedPlayers[0]?.profile.full_name || 'Belirlenmedi';

    const gkPlayers = sortedPlayers.filter(p => p.matchPosition?.startsWith('KL'));
    const defPlayers = sortedPlayers.filter(p => p.matchPosition?.startsWith('DF'));
    const fwdPlayers = sortedPlayers.filter(p => p.matchPosition?.startsWith('FV') || p.matchPosition?.startsWith('OS'));

    return {
      mvp: topMvp,
      gk: gkPlayers.length > 0 ? (gkPlayers[0].profile.full_name || gkPlayers[0].profile.username) : 'Belirlenmedi',
      def: defPlayers.length > 0 ? (defPlayers[0].profile.full_name || defPlayers[0].profile.username) : 'Belirlenmedi',
      fwd: fwdPlayers.length > 0 ? (fwdPlayers[0].profile.full_name || fwdPlayers[0].profile.username) : 'Belirlenmedi',
    };
  };

  const weeklyAwards = getWeeklyAutomatedAwards();
  const isOverall = selectedFilterMatchId === 'ALL';

  const filteredStatDefs = statDefs.filter((d) => {
    const keyLower = d.key.toLowerCase();
    const titleLower = d.title.toLowerCase();

    const containsAwardKeyword = 
      keyLower.includes('mvp') || keyLower.includes('best') ||
      titleLower.includes('mvp') || titleLower.includes('maçın adamı') || titleLower.includes('en iyi');

    const isStandardStat = keyLower === 'conceded_goals' || keyLower === 'saves' || titleLower === 'yenen gol' || titleLower === 'kurtarış';

    if (isStandardStat) return true;
    return !containsAwardKeyword;
  });

  const unassignedPoolPlayers = currentMatchSquadDetails.filter(
    (s) => !s.position || s.position === 'NONE'
  );

  // Aktif Moda Göre Değişkenleri Dinamik Kullanma
  const currentActiveTeamSize = isCustomTacticsMode ? customTeamSize : officialTeamSize;
  const currentActiveFormationKey = isCustomTacticsMode ? customFormation : officialFormation;

  const availableFormations = Object.keys(FORMATIONS).filter(
    (k) => FORMATIONS[k].size === currentActiveTeamSize
  );

  const activeFormationConfig = FORMATIONS[currentActiveFormationKey] || FORMATIONS['7-3-3'];

  const isDragAllowed = isAdmin || isCustomTacticsMode;

  if (loading && !playersData.length) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-green-500/10 text-green-400 rounded-full mb-3">
              <Trophy className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">Halısaha İstatistikleri</h1>
            <p className="text-slate-400 text-sm mt-1">Giriş Yap</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Kullanıcı Adı veya E-Posta</label>
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                placeholder="Örn: ahmet10"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Şifre</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <p className="text-red-400 text-xs text-center bg-red-500/10 p-2 rounded-lg">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-500 font-semibold py-3 rounded-xl text-sm transition duration-200"
            >
              Giriş Yap
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ÜST BAR */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleGoHome}>
            <Trophy className="w-6 h-6 text-green-500" />
            <span className="font-bold text-lg tracking-wide">HALISAHA LİGİ</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleGoHome}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition"
            >
              <Home className="w-4 h-4 text-green-400" />
              <span className="hidden sm:inline">Ana Ekran</span>
            </button>

            {/* KENDİ KADRONU KUR / TAKTİK TAHTASI BUTONU */}
            <button
              onClick={() => handleOpenPitchModal(true)}
              className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">Taktik Tahtası</span>
            </button>

            {/* RESMİ SAHA DİZİLİŞİ BUTONU */}
            <button
              onClick={() => handleOpenPitchModal(false)}
              className="flex items-center gap-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">{isAdmin ? 'Kadro Kur & Diziliş' : 'Saha Dizilişi'}</span>
            </button>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-500/30 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profilim</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* FORMASYON VE SAHA DİZİLİŞİ MODALI */}
      {isPitchModalOpen && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-7xl rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-5 max-h-[98vh] overflow-y-auto">
              <button
                onClick={() => setIsPitchModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition z-50 shadow-lg"
              >
                <X className="w-6 h-6" />
              </button>

              {/* ÜST DÜZENLEME BARI: TEK SATIR (MOD - DİZİLİŞ - İNDİR - PAYLAŞ) */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-4 pr-12 gap-3">
                <div className="flex items-center gap-2.5">
                  <LayoutGrid className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                    {isCustomTacticsMode ? 'Taktik Tahtası (Kendi Kadronu Kur)' : (isAdmin ? 'Haftalık Saha Dizilişi ve Kadro Yönetimi' : 'Haftalık Takım Saha Dizilişi')}
                  </h2>
                </div>

                {/* SIRALAMA: MOD - DİZİLİŞ - İNDİR - PAYLAŞ */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
                  
                  {/* 1. MOD SEÇİCİ */}
                  {(isAdmin || isCustomTacticsMode) && (
                    <div className="flex items-center gap-2 bg-slate-800 border border-emerald-500/40 px-3.5 py-2 rounded-xl">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-slate-400 hidden sm:inline">Mod:</span>
                      <select
                        value={currentActiveTeamSize}
                        onChange={(e) => {
                          const newSize = Number(e.target.value);
                          const firstMatchForm = Object.keys(FORMATIONS).find(k => FORMATIONS[k].size === newSize) || '7-3-3';
                          if (isCustomTacticsMode) {
                            setCustomTeamSize(newSize);
                            setCustomFormation(firstMatchForm);
                          } else {
                            setOfficialTeamSize(newSize);
                            setOfficialFormation(firstMatchForm);
                          }
                        }}
                        className="bg-transparent text-xs sm:text-sm text-emerald-300 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value={6} className="bg-slate-900 text-slate-100">6v6</option>
                        <option value={7} className="bg-slate-900 text-slate-100">7v7</option>
                        <option value={8} className="bg-slate-900 text-slate-100">8v8</option>
                      </select>
                    </div>
                  )}

                  {/* 2. DİZİLİŞ SEÇİCİ */}
                  {(isAdmin || isCustomTacticsMode) && (
                    <div className="flex items-center gap-2 bg-slate-800 border border-amber-500/40 px-3.5 py-2 rounded-xl">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-slate-400 hidden sm:inline">Diziliş:</span>
                      <select
                        value={currentActiveFormationKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (isCustomTacticsMode) setCustomFormation(val);
                          else setOfficialFormation(val);
                        }}
                        className="bg-transparent text-xs sm:text-sm text-amber-300 font-bold focus:outline-none cursor-pointer"
                      >
                        {availableFormations.map((key) => (
                          <option key={key} value={key} className="bg-slate-900 text-slate-100">
                            {FORMATIONS[key].name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* MAÇ SEÇİCİ (RESMİ MODDA HERKESE GÖSTERİLİR) */}
                  {!isCustomTacticsMode && (
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-slate-400 hidden sm:inline">Maç:</span>
                      <select
                        value={adminMatchId}
                        onChange={(e) => {
                          const mId = e.target.value;
                          setAdminMatchId(mId);
                          loadMatchSquadAndAwards(mId);
                        }}
                        className="bg-transparent text-xs sm:text-sm text-emerald-300 font-bold focus:outline-none cursor-pointer"
                      >
                        {matches.length === 0 && <option value="">Maç Bulunamadı</option>}
                        {matches.map((m) => (
                          <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">
                            {formatMatchLabel(m)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* ADMIN KAYDET BUTONU */}
                  {isAdmin && !isCustomTacticsMode && (
                    <button
                      onClick={handleUpdateSquadDetails}
                      className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4.5 py-2 rounded-xl text-xs sm:text-sm transition shadow-lg whitespace-nowrap"
                    >
                      <Save className="w-4 h-4" /> Dizilişi Kaydet
                    </button>
                  )}

                  {/* 3. İNDİR VE 4. PAYLAŞ BUTONLARI (TAKTİK TAHTASINDA EN SAĞDA) */}
                  {isCustomTacticsMode && (
                    <>
                      <button
                        onClick={handleDownloadPitchImage}
                        disabled={isExporting}
                        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition shadow-lg whitespace-nowrap disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" /> Görsel İndir
                      </button>

                      <button
                        onClick={handleSharePitchImage}
                        disabled={isExporting}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition shadow-lg whitespace-nowrap disabled:opacity-50"
                      >
                        <Share2 className="w-4 h-4" /> Paylaş
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* SAHA KANVAS İLE SOL LİSTE */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                
                {/* SOL PANEL: BOŞTAKİ OYUNCU HAVUZU */}
                <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl md:col-span-1 space-y-3">
                  <h3 className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Kadro Havuzu</span>
                    <span className="bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded text-xs">{unassignedPoolPlayers.length} Oyuncu</span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {isDragAllowed
                      ? 'Oyuncu kartını tutup sağdaki sahanın seçilen formasyondaki kutularına sürükleyin.'
                      : 'Kadroda yedekte bekleyen oyuncular.'}
                  </p>

                  <Droppable droppableId="POOL" isDropDisabled={!isDragAllowed}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-2.5 max-h-[480px] overflow-y-auto p-1.5 min-h-[180px] bg-slate-900/60 rounded-xl border border-slate-800"
                      >
                        {unassignedPoolPlayers.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400 font-semibold">Tüm oyuncular sahaya dizildi!</div>
                        ) : (
                          unassignedPoolPlayers.map((sDetail, index) => {
                            const pObj = allProfiles.find((p) => p.id === sDetail.player_id);
                            const fullName = pObj?.full_name || pObj?.username || 'İsimsiz Oyuncu';
                            const nameParts = fullName.split(' ');
                            const firstName = nameParts[0];
                            const lastName = nameParts.slice(1).join(' ');

                            return (
                              <Draggable
                                key={sDetail.player_id}
                                draggableId={sDetail.player_id}
                                index={index}
                                isDragDisabled={!isDragAllowed}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center justify-between shadow-md transition ${
                                      isDragAllowed ? 'cursor-grab active:cursor-grabbing hover:border-emerald-500 hover:bg-slate-800' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      {isDragAllowed && <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />}
                                      <div className="flex flex-col truncate leading-tight">
                                        <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">{firstName}</span>
                                        {lastName && <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">{lastName}</span>}
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-extrabold bg-slate-800 text-slate-300 px-2 py-0.5 rounded shrink-0 border border-slate-700">
                                      Boşta
                                    </span>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* SAĞ PANEL: CANLI HALISAHA */}
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-3xl md:col-span-3 overflow-x-auto flex justify-center items-center shadow-xl">
                  {/* RESİM İÇİN YAKALANACAK ALAN (pitchRef) */}
                  <div
                    ref={pitchRef}
                    className="relative w-full min-w-[820px] h-[480px] bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 border-4 border-white rounded-3xl p-3 flex justify-between items-center shadow-2xl overflow-hidden bg-[repeating-linear-gradient(90deg,#055c44,#055c44_45px,#044936_45px,#044936_90px)]"
                  >
                    
                    {/* SADE VE ŞIK SAHA ÜSTÜ SKOR/TAKIM TABELASI */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center bg-slate-950/85 text-white border border-slate-700/80 rounded-2xl px-5 py-2 shadow-2xl backdrop-blur-md">
                      <div className="flex items-center gap-3 text-xs sm:text-sm font-extrabold tracking-wide">
                        <span className="text-slate-100">Beyaz Takım</span>
                        
                        <span className="text-white font-black text-xs sm:text-sm px-1">
                          {isCustomTacticsMode || !matchScore.hasGoals
                            ? 'VS'
                            : `${matchScore.teamA} - ${matchScore.teamB}`}
                        </span>

                        <span className="text-slate-100">Siyah Takım</span>
                      </div>
                    </div>

                    {/* SOL KALE */}
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-10 h-36 border-4 border-white bg-white/25 border-l-0 rounded-r-xl z-0"></div>
                    
                    {/* SAĞ KALE */}
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-10 h-36 border-4 border-white bg-white/25 border-r-0 rounded-l-xl z-0"></div>

                    {/* ORTA ÇİZGİ VE YUVARLAK */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-white/90 z-0"></div>
                    <div className="absolute top-1/2 left-1/2 w-32 h-32 border-4 border-white/90 rounded-full -translate-x-1/2 -translate-y-1/2 z-0"></div>

                    {/* BEYAZ FORMA TAKIMI (SOL YARI) */}
                    <div className="relative z-10 w-1/2 h-full flex justify-around items-center px-3 pt-6">
                      {activeFormationConfig.lines.map((lineConfig) => (
                        <div key={`TEAM_A_LINE_${lineConfig.role}`} className="flex flex-col justify-around h-full py-2 items-center gap-1">
                          {Array.from({ length: lineConfig.count }).map((_, idx) => {
                            const posKey = `${lineConfig.role}_${idx + 1}`;
                            const assignedPlayer = currentMatchSquadDetails.find(
                              (s) => s.team === 'A' && (s.position === posKey || s.position === lineConfig.role)
                            );

                            return (
                              <div key={`TEAM_A_${posKey}`} className="flex flex-col items-center">
                                <Droppable droppableId={`TEAM_A_${posKey}`} isDropDisabled={!isDragAllowed}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.droppableProps}
                                      className={`w-24 min-h-[64px] rounded-xl flex flex-col items-center justify-center p-1 transition ${
                                        assignedPlayer
                                          ? 'border-0 bg-transparent'
                                          : snapshot.isDraggingOver
                                          ? 'border-2 border-dashed border-amber-400 bg-amber-500/40 shadow-lg'
                                          : 'border-2 border-dashed border-white/60 bg-black/40 shadow'
                                      }`}
                                    >
                                      {!assignedPlayer && !snapshot.isDraggingOver && (
                                        <span className="text-[11px] font-black text-white tracking-wider">
                                          {lineConfig.role}
                                        </span>
                                      )}

                                      {assignedPlayer ? (
                                        (() => {
                                          const pObj = allProfiles.find((p) => p.id === assignedPlayer.player_id);
                                          const fullName = pObj?.full_name || pObj?.username || 'İsimsiz';
                                          const nameParts = fullName.split(' ');
                                          const firstName = nameParts[0];
                                          const lastName = nameParts.slice(1).join(' ');

                                          return (
                                            <Draggable
                                              key={assignedPlayer.player_id}
                                              draggableId={assignedPlayer.player_id}
                                              index={0}
                                              isDragDisabled={!isDragAllowed}
                                            >
                                              {(provided) => (
                                                <div
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  {...provided.dragHandleProps}
                                                  className={`flex flex-col items-center group ${isDragAllowed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                                                >
                                                  {/* BEYAZ FORMA - SİYAH NUMARA */}
                                                  <div
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (isDragAllowed) handleUpdateShirtNumber(assignedPlayer.player_id, assignedPlayer.shirt_number || 1);
                                                    }}
                                                    title={isDragAllowed ? "Forma numarasını değiştirmek için tıklayın" : ""}
                                                    className="cursor-pointer hover:scale-110 transition-transform"
                                                  >
                                                    <JerseyIcon
                                                      number={assignedPlayer.shirt_number || 1}
                                                      jerseyColor="#ffffff"
                                                      numberColor="#0f172a"
                                                    />
                                                  </div>
                                                  {/* %50 ŞEFFAF SİYAH İSİM KARTI - BEYAZ YAZI */}
                                                  <div
                                                    className="bg-black/50 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md mt-0.5 shadow-md border border-black/30 backdrop-blur-[2px] text-center leading-tight w-max max-w-[85px]"
                                                    title={fullName}
                                                  >
                                                    <div className="truncate">{firstName}</div>
                                                    {lastName && <div className="truncate">{lastName}</div>}
                                                  </div>
                                                </div>
                                              )}
                                            </Draggable>
                                          );
                                        })()
                                      ) : null}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {/* SİYAH FORMA TAKIMI (SAĞ YARI) */}
                    <div className="relative z-10 w-1/2 h-full flex justify-around items-center px-3 pt-6">
                      {[...activeFormationConfig.lines].reverse().map((lineConfig) => (
                        <div key={`TEAM_B_LINE_${lineConfig.role}`} className="flex flex-col justify-around h-full py-2 items-center gap-1">
                          {Array.from({ length: lineConfig.count }).map((_, idx) => {
                            const posKey = `${lineConfig.role}_${idx + 1}`;
                            const assignedPlayer = currentMatchSquadDetails.find(
                              (s) => s.team === 'B' && (s.position === posKey || s.position === lineConfig.role)
                            );

                            return (
                              <div key={`TEAM_B_${posKey}`} className="flex flex-col items-center">
                                <Droppable droppableId={`TEAM_B_${posKey}`} isDropDisabled={!isDragAllowed}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.droppableProps}
                                      className={`w-24 min-h-[64px] rounded-xl flex flex-col items-center justify-center p-1 transition ${
                                        assignedPlayer
                                          ? 'border-0 bg-transparent'
                                          : snapshot.isDraggingOver
                                          ? 'border-2 border-dashed border-white bg-white/50 shadow-lg'
                                          : 'border-2 border-dashed border-white/60 bg-black/40 shadow'
                                      }`}
                                    >
                                      {!assignedPlayer && !snapshot.isDraggingOver && (
                                        <span className="text-[11px] font-black text-white tracking-wider">
                                          {lineConfig.role}
                                        </span>
                                      )}

                                      {assignedPlayer ? (
                                        (() => {
                                          const pObj = allProfiles.find((p) => p.id === assignedPlayer.player_id);
                                          const fullName = pObj?.full_name || pObj?.username || 'İsimsiz';
                                          const nameParts = fullName.split(' ');
                                          const firstName = nameParts[0];
                                          const lastName = nameParts.slice(1).join(' ');

                                          return (
                                            <Draggable
                                              key={assignedPlayer.player_id}
                                              draggableId={assignedPlayer.player_id}
                                              index={0}
                                              isDragDisabled={!isDragAllowed}
                                            >
                                              {(provided) => (
                                                <div
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  {...provided.dragHandleProps}
                                                  className={`flex flex-col items-center group ${isDragAllowed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                                                >
                                                  {/* SİYAH FORMA - BEYAZ NUMARA */}
                                                  <div
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (isDragAllowed) handleUpdateShirtNumber(assignedPlayer.player_id, assignedPlayer.shirt_number || 2);
                                                    }}
                                                    title={isDragAllowed ? "Forma numarasını değiştirmek için tıklayın" : ""}
                                                    className="cursor-pointer hover:scale-110 transition-transform"
                                                  >
                                                    <JerseyIcon
                                                      number={assignedPlayer.shirt_number || 2}
                                                      jerseyColor="#0f172a"
                                                      numberColor="#ffffff"
                                                    />
                                                  </div>
                                                  {/* %50 ŞEFFAF SİYAH İSİM KARTI - BEYAZ YAZI */}
                                                  <div
                                                    className="bg-black/50 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md mt-0.5 shadow-md border border-black/30 backdrop-blur-[2px] text-center leading-tight w-max max-w-[85px]"
                                                    title={fullName}
                                                  >
                                                    <div className="truncate">{firstName}</div>
                                                    {lastName && <div className="truncate">{lastName}</div>}
                                                  </div>
                                                </div>
                                              )}
                                            </Draggable>
                                          );
                                        })()
                                      ) : null}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

              </div>

              <button
                onClick={() => setIsPitchModalOpen(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-2xl text-sm font-semibold transition shadow-md"
              >
                Kapat
              </button>
            </div>
          </div>
        </DragDropContext>
      )}

      {/* PROFİL MODALİ */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-6">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <div className="w-16 h-16 bg-gradient-to-tr from-green-600 to-emerald-400 rounded-2xl flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">{displayName}</h2>
                {displayUsername && <p className="text-xs text-slate-400">@{displayUsername}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                Sezonluk / Genel Performans
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-800/40 border border-amber-500/30 p-3 rounded-xl col-span-2 sm:col-span-3 bg-amber-500/5">
                  <p className="text-[11px] text-amber-400 font-bold mb-1">Toplam Performans Puanı</p>
                  <p className="text-2xl font-black font-mono text-amber-300">{matchedPlayerInList?.totalPoints || 0} Puan</p>
                </div>
                {filteredStatDefs.map((def) => {
                  const val = matchedPlayerInList?.stats[def.key] || 0;
                  return (
                    <div key={def.id} className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl">
                      <p className="text-[11px] text-slate-400 font-medium mb-1">{def.title}</p>
                      <p className="text-xl font-bold font-mono text-green-400">{val}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">

        {/* FİLTRELEME & SEZON SEÇİMİ */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500/10 text-green-400 rounded-xl">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-200">İstatistik ve Lig Görünümü</h2>
              <p className="text-xs text-slate-400">Sezon ve Maç Bazlı Verileri Filtreleyin</p>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-auto flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400 hidden sm:block" />
              <select
                value={selectedSeasonId}
                onChange={(e) => {
                  setSelectedSeasonId(e.target.value);
                  setSelectedFilterMatchId('ALL');
                }}
                className="w-full sm:w-48 bg-slate-800 border border-amber-500/40 rounded-xl px-3 py-2 text-sm text-amber-300 font-bold focus:outline-none"
              >
                <option value="ALL">🌐 TÜM SEZONLAR (GENEL)</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.is_active ? '⚡ ' : '📁 '}{s.name} {s.is_active ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* ANA EKRAN MAÇ FİLTRESİ */}
            <div className="w-full sm:w-auto flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={selectedFilterMatchId}
                onChange={(e) => setSelectedFilterMatchId(e.target.value)}
                className="w-full sm:w-64 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-green-500 font-medium"
              >
                <option value="ALL">🏆 Sezon Tablosu (Genel)</option>
                {filteredMatchesForSelect.map((m) => (
                  <option key={m.id} value={m.id}>
                    {formatMatchLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ADMIN PANELİ */}
        {isAdmin && (
          <section className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-400">
                <PlusCircle className="w-5 h-5" />
                <h2 className="font-bold text-lg">Admin Yönetim Paneli</h2>
              </div>
              <button
                onClick={() => setShowNewMatchForm(!showNewMatchForm)}
                className="bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
              >
                {showNewMatchForm ? 'Vazgeç' : '➕ Yeni Maç Ekle'}
              </button>
            </div>

            {/* SEZON YÖNETİMİ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                  <Layers className="w-4 h-4 text-amber-400" /> Yeni Sezon Başlat
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="Örn: 2. Sezon veya 2027 Bahar"
                    value={newSeasonName}
                    onChange={(e) => setNewSeasonName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                  />
                  <button
                    onClick={handleCreateSeason}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs whitespace-nowrap transition"
                  >
                    Ekle & Başlat
                  </button>
                </div>
              </div>

              <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase">
                  <Trash2 className="w-4 h-4 text-rose-400" /> Sezon Sil (Yönetim)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    value={deletingSeasonId}
                    onChange={(e) => setDeletingSeasonId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                  >
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.is_active ? '(Aktif)' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleDeleteSeason}
                    disabled={seasons.length <= 1}
                    className="w-full sm:w-auto bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold px-4 py-2 rounded-lg text-xs whitespace-nowrap transition disabled:opacity-50"
                  >
                    Sezonu Sil
                  </button>
                </div>
              </div>
            </div>

            {showNewMatchForm && (
              <form onSubmit={handleCreateMatch} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" /> Yeni Maç Oluştur
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Maç Tarihi</label>
                    <input
                      type="date"
                      required
                      value={newMatchDate}
                      onChange={(e) => setNewMatchDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Açıklama</label>
                    <input
                      type="text"
                      placeholder="Örn: 1. Hafta"
                      value={newMatchDesc}
                      onChange={(e) => setNewMatchDesc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg text-xs transition"
                >
                  Maçı Kaydet
                </button>
              </form>
            )}

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                <div className="w-full sm:w-1/2">
                  <label className="block text-xs text-slate-400 mb-1">İşlem Yapılacak Maç</label>
                  <select
                    value={adminMatchId}
                    onChange={(e) => {
                      const mId = e.target.value;
                      setAdminMatchId(mId);
                      loadMatchSquadAndAwards(mId);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-medium"
                  >
                    {matches.length === 0 && <option value="">Önce Maç Ekleyin</option>}
                    {matches.map((m) => (
                      <option key={m.id} value={m.id}>
                        {formatMatchLabel(m)}
                      </option>
                    ))}
                  </select>
                </div>

                {adminMatchId && (
                  <button
                    onClick={handleDeleteMatch}
                    className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2.5 rounded-xl text-xs font-semibold transition"
                  >
                    <Trash2 className="w-4 h-4" /> Seçili Maçı Sil
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">İstatistik Girilecek Oyuncu</label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setSelectedPlayerId(pid);
                    const found = playersData.find((p) => p.profile.id === pid);
                    if (found) setInputStats(found.stats);
                    else setInputStats({});
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 text-slate-100"
                >
                  <option value="">-- Oyuncu Seçin --</option>
                  {playersData.map((p) => (
                    <option key={p.profile.id} value={p.profile.id}>
                      {p.profile.full_name || p.profile.username} (@{p.profile.username})
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlayerId && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredStatDefs.map((def) => (
                      <div key={def.id} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          {def.title}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={inputStats[def.key] ?? 0}
                          onChange={(e) => setInputStats({ ...inputStats, [def.key]: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-amber-400"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <button
                      onClick={handleSaveStats}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition cursor-pointer flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Kaydet
                    </button>
                    {saveSuccess && (
                      <span className="text-green-400 text-sm font-medium">✓ Başarıyla Kaydedildi!</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ÖDÜLLER VE KRALLIK KARTLARI */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:col-span-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <Award className="w-5 h-5" />
                  <h3 className="font-bold">
                    {selectedFilterMatchId === 'ALL' ? 'Genel / Sezonluk Liderler' : 'Haftanın En İyileri (Otomatik)'}
                  </h3>
                </div>
              </div>

              {selectedFilterMatchId !== 'ALL' && selectedMatch ? (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-amber-400/90 uppercase font-bold tracking-wider">Maçın Adamı (MVP)</p>
                      <p className="text-sm font-extrabold text-amber-300">{weeklyAwards.mvp}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">En İyi Kaleci (Sahadaki KL)</p>
                      <p className="text-sm font-bold text-slate-100">{weeklyAwards.gk}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">En İyi Defans (Sahadaki DF)</p>
                      <p className="text-sm font-bold text-slate-100">{weeklyAwards.def}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">En İyi Forvet (Sahadaki FV/OS)</p>
                      <p className="text-sm font-bold text-slate-100">{weeklyAwards.fwd}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-amber-400/90 uppercase font-bold tracking-wider">Lig Lideri (Puan)</p>
                        <p className="text-sm font-extrabold text-amber-300">
                          {sortedPlayers[0]?.profile.full_name || 'Henüz Yok'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-green-400">
                <Zap className="w-5 h-5" />
                <h3 className="font-bold">Gol Krallığı</h3>
              </div>
            </div>
            <div className="space-y-2">
              {[...playersData]
                .sort((a, b) => (b.stats['goals'] || 0) - (a.stats['goals'] || 0))
                .slice(0, 5)
                .map((p, index) => (
                  <div key={p.profile.id} className="flex justify-between items-center p-2.5 bg-slate-800/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 text-center font-bold text-sm ${index === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {index + 1}.
                      </span>
                      <span className="font-medium text-sm">{p.profile.full_name || p.profile.username}</span>
                    </div>
                    <span className="font-bold font-mono text-green-400 bg-green-500/10 px-3 py-1 rounded-lg text-sm">
                      {p.stats['goals'] || 0} Gol
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Star className="w-5 h-5" />
                <h3 className="font-bold">Asist Krallığı</h3>
              </div>
            </div>
            <div className="space-y-2">
              {[...playersData]
                .sort((a, b) => (b.stats['assists'] || 0) - (a.stats['assists'] || 0))
                .slice(0, 5)
                .map((p, index) => (
                  <div key={p.profile.id} className="flex justify-between items-center p-2.5 bg-slate-800/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 text-center font-bold text-sm ${index === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {index + 1}.
                      </span>
                      <span className="font-medium text-sm">{p.profile.full_name || p.profile.username}</span>
                    </div>
                    <span className="font-bold font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg text-sm">
                      {p.stats['assists'] || 0} Asist
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* İSTATİSTİK TABLOSU */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-lg">
                {isOverall
                  ? `🏆 ${seasons.find(s => s.id === selectedSeasonId)?.name || 'Genel'} Oyuncu İstatistikleri`
                  : `📅 Maç İstatistikleri (${selectedMatch ? formatMatchLabel(selectedMatch) : ''})`}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                {playersData.length} Oyuncu
              </span>
            </div>
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[11px] tracking-wider sticky top-0 z-20">
                <tr>
                  <th className="py-3.5 px-4 font-semibold sticky left-0 bg-slate-800 z-30 shadow-r border-b border-slate-700/50 min-w-[160px]">
                    # Oyuncu
                  </th>
                  
                  {isOverall ? (
                    <>
                      <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap border-b border-slate-700/50 text-amber-400 bg-amber-500/10">
                        PUAN
                      </th>
                      <th className="py-3.5 px-3 font-semibold text-center whitespace-nowrap border-b border-slate-700/50">
                        MAÇ
                      </th>
                      <th className="py-3.5 px-3 font-semibold text-center whitespace-nowrap border-b border-slate-700/50 text-emerald-400">
                        GALİBİYET
                      </th>
                      <th className="py-3.5 px-3 font-semibold text-center whitespace-nowrap border-b border-slate-700/50 text-rose-400">
                        MAĞLUBİYET
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap border-b border-slate-700/50 text-amber-400 bg-amber-500/10">
                        PUAN
                      </th>
                      {filteredStatDefs.map((def) => (
                        <th key={def.id} className="py-3.5 px-3 font-semibold text-center whitespace-nowrap border-b border-slate-700/50">
                          {def.title}
                        </th>
                      ))}
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={isOverall ? 5 : filteredStatDefs.length + 2} className="py-8 text-center text-slate-400 text-sm">
                      {selectedFilterMatchId !== 'ALL' 
                        ? '⚠️ Bu maç için henüz kadro dizilişi oluşturulmadı.' 
                        : 'Gösterilebilecek veri veya oyuncu bulunamadı.'}
                    </td>
                  </tr>
                ) : (
                  sortedPlayers.map((p, index) => {
                    const isSelf = p.profile.id === currentUser?.id || p.profile.email === currentUser?.email;

                    return (
                      <tr
                        key={p.profile.id}
                        className={`transition duration-150 ${
                          isSelf
                            ? 'bg-green-500/10 hover:bg-green-500/20 font-semibold'
                            : index % 2 === 0
                            ? 'bg-slate-900/60 hover:bg-slate-800/50'
                            : 'bg-slate-800/20 hover:bg-slate-800/50'
                        }`}
                      >
                        <td className={`py-3 px-4 whitespace-nowrap sticky left-0 z-10 border-r border-slate-800/60 transition ${isSelf ? 'bg-emerald-950 text-green-300' : 'bg-slate-900'}`}>
                          <div className="flex items-center gap-2.5">
                            <span className={`text-xs font-mono w-5 ${index < 3 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                              {index + 1}.
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className={`text-sm ${isSelf ? 'text-green-300 font-bold' : 'text-slate-100'}`}>
                                  {p.profile.full_name || 'İsimsiz'}
                                </p>
                                {p.matchPosition && (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold uppercase">
                                    {p.matchPosition}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">@{p.profile.username}</p>
                            </div>
                          </div>
                        </td>

                        {isOverall ? (
                          <>
                            <td className="py-3 px-3 text-center font-mono text-base font-black text-amber-300 bg-amber-500/5">
                              {p.totalPoints}
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-sm text-slate-200">
                              {p.stats['matches'] || 0}
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-sm text-emerald-400 font-semibold">
                              {p.stats['wins'] || 0}
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-sm text-rose-400 font-semibold">
                              {p.stats['losses'] || 0}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-3 text-center font-mono text-base font-black text-amber-300 bg-amber-500/5">
                              {p.totalPoints}
                            </td>
                            {filteredStatDefs.map((def) => {
                              const val = p.stats[def.key] || 0;
                              return (
                                <td
                                  key={def.id}
                                  className={`py-3 px-3 text-center font-mono text-sm ${
                                    val > 0 ? (isSelf ? 'text-green-300 font-bold' : 'text-slate-200') : 'text-slate-600'
                                  }`}
                                >
                                  {val}
                                </td>
                              );
                            })}
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}