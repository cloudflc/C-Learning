import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore, useLevelStore, useRankingStore } from '../stores';
import { Trophy, Target, Zap, Flame, ArrowRight } from 'lucide-react';

const Home = () => {
  const { user } = useAuthStore();
  const { levels, fetchLevels } = useLevelStore();
  const { fetchRanking } = useRankingStore();
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    fetchLevels();
    fetchRanking('exp', 'global', 'all').then(data => {
      if (data?.ranking) {
        setTopUsers(data.ranking.slice(0, 5));
      }
    });
  }, []);

  const getRankIcon = (rank) => {
    const icons = {
      'Bronze': '🥉',
      'Silver': '🥈', 
      'Gold': '🥇',
      'Platinum': '💎',
      'Diamond': '👑'
    };
    return icons[rank] || '🥉';
  };

  const getNextRankInfo = () => {
    const ranks = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const expThresholds = [0, 500, 1500, 5000, 15000];
    const currentIndex = ranks.indexOf(user?.rank);
    
    if (currentIndex === -1 || currentIndex === ranks.length - 1) {
      return null;
    }
    
    return {
      nextRank: ranks[currentIndex + 1],
      nextExp: expThresholds[currentIndex + 1],
      progress: ((user?.exp || 0) / expThresholds[currentIndex + 1]) * 100
    };
  };

  const nextRankInfo = getNextRankInfo();

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">
              欢迎回来，{user?.username}！{getRankIcon(user?.rank)}
            </h1>
            <p className="text-slate-400 mt-1">继续你的C++学习之旅</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Trophy size={18} />
              <span>段位</span>
            </div>
            <div className="text-2xl font-bold text-white">{user?.rank || 'Bronze'}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Zap size={18} />
              <span>经验值</span>
            </div>
            <div className="text-2xl font-bold text-white">{user?.exp || 0}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Target size={18} />
              <span>完成练习</span>
            </div>
            <div className="text-2xl font-bold text-white">{user?.totalExercises || 0}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Flame size={18} />
              <span>连续学习</span>
            </div>
            <div className="text-2xl font-bold text-white">{user?.consecutiveDays || 0} 天</div>
          </div>
        </div>

        {nextRankInfo && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">距离 {nextRankInfo.nextRank} 还需</span>
              <span className="text-primary-400">{nextRankInfo.nextExp - (user?.exp || 0)} EXP</span>
            </div>
            <div className="exp-bar">
              <div 
                className="exp-bar-fill" 
                style={{ width: `${Math.min(100, nextRankInfo.progress)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">关卡进度</h2>
            <Link to="/levels" className="text-primary-400 hover:text-primary-300 flex items-center gap-1">
              查看全部 <ArrowRight size={16} />
            </Link>
          </div>
          <div className="space-y-3">
            {levels.slice(0, 3).map((level) => (
              <div 
                key={level._id}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    level.isUnlocked ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-700 text-slate-500'
                  }`}>
                    {level.progress?.completed ? '✓' : level.order + 1}
                  </div>
                  <div>
                    <div className="text-white font-medium">{level.name}</div>
                    <div className="text-xs text-slate-400">{level.exercises?.length || 0} 个练习</div>
                  </div>
                </div>
                <span className={`text-sm ${level.isUnlocked ? 'text-primary-400' : 'text-slate-500'}`}>
                  {level.isUnlocked ? (level.progress?.completed ? '已完成' : '进行中') : '未解锁'}
                </span>
              </div>
            ))}
            {levels.length === 0 && (
              <p className="text-slate-400 text-center py-4">暂无关卡数据</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">排行榜 TOP 5</h2>
            <Link to="/rankings" className="text-primary-400 hover:text-primary-300 flex items-center gap-1">
              查看全部 <ArrowRight size={16} />
            </Link>
          </div>
          <div className="space-y-3">
            {topUsers.map((u, index) => (
              <div 
                key={u._id}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    index === 1 ? 'bg-slate-300/20 text-slate-300' :
                    index === 2 ? 'bg-amber-700/20 text-amber-600' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-medium">{u.username}</span>
                    <span>{getRankIcon(u.rank)}</span>
                  </div>
                </div>
                <span className="text-primary-400 font-medium">{u.exp} EXP</span>
              </div>
            ))}
            {topUsers.length === 0 && (
              <p className="text-slate-400 text-center py-4">暂无排行数据</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">快速开始</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            to="/levels"
            className="group p-6 bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-xl border border-primary-500/30 hover:border-primary-500/50 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <Target className="text-primary-400" size={24} />
              <span className="text-xl font-bold text-white">开始学习</span>
            </div>
            <p className="text-slate-400">选择一个关卡开始练习</p>
          </Link>
          <Link
            to="/rankings"
            className="group p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="text-purple-400" size={24} />
              <span className="text-xl font-bold text-white">查看排行</span>
            </div>
            <p className="text-slate-400">与同学竞争学习排名</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
