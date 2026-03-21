import { useEffect, useState } from 'react';
import { useRankingStore } from '../stores';
import { Trophy, Medal, Crown, Keyboard, Code, Zap } from 'lucide-react';
import clsx from 'clsx';

const Rankings = () => {
  const { ranking, userRank, fetchRanking, isLoading } = useRankingStore();
  const [type, setType] = useState('exp');
  const [scope, setScope] = useState('global');
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    fetchRanking(type, scope, period);
  }, [type, scope, period]);

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

  const getRankBadge = (index) => {
    if (index === 0) return <Crown className="text-yellow-400" size={20} />;
    if (index === 1) return <Medal className="text-slate-300" size={20} />;
    if (index === 2) return <Medal className="text-amber-600" size={20} />;
    return <span className="text-slate-400 font-bold">{index + 1}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">排行榜</h1>
        <p className="text-slate-400">查看学习排名，与同学竞争</p>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setType('exp')}
              className={clsx(
                'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
                type === 'exp' 
                  ? 'bg-primary-500/20 text-primary-400' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              <Zap size={18} />
              经验值
            </button>
            <button
              onClick={() => setType('typing')}
              className={clsx(
                'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
                type === 'typing' 
                  ? 'bg-primary-500/20 text-primary-400' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              <Keyboard size={18} />
              打字
            </button>
            <button
              onClick={() => setType('oj')}
              className={clsx(
                'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
                type === 'oj' 
                  ? 'bg-primary-500/20 text-primary-400' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              <Code size={18} />
              OJ
            </button>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setScope('global')}
              className={clsx(
                'px-4 py-2 rounded-lg transition-colors',
                scope === 'global' 
                  ? 'bg-purple-500/20 text-purple-400' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              全网
            </button>
            <button
              onClick={() => setScope('class')}
              className={clsx(
                'px-4 py-2 rounded-lg transition-colors',
                scope === 'class' 
                  ? 'bg-purple-500/20 text-purple-400' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              )}
            >
              班级
            </button>
          </div>
        </div>

        {userRank && (
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="text-primary-400" size={24} />
                <span className="text-white">你的排名</span>
              </div>
              <span className="text-2xl font-bold text-primary-400">#{userRank}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {ranking.map((user, index) => (
              <div 
                key={user._id}
                className={clsx(
                  'flex items-center justify-between p-4 rounded-lg transition-colors',
                  index < 3 ? 'bg-slate-700/50' : 'bg-slate-800/50 hover:bg-slate-700'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 flex justify-center">
                    {getRankBadge(index)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.username}</div>
                      <div className="text-sm text-slate-400">{getRankIcon(user.rank)} {user.rank}</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xl font-bold text-primary-400">
                    {type === 'exp' ? `${user.exp}` : 
                     type === 'typing' ? `${user.count || 0}` :
                     `${user.totalScore || 0}`}
                  </div>
                  <div className="text-sm text-slate-400">
                    {type === 'exp' ? 'EXP' : 
                     type === 'typing' ? '完成数' : '总分'}
                  </div>
                </div>
              </div>
            ))}
            
            {ranking.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="mx-auto text-slate-600 mb-4" size={48} />
                <p className="text-slate-400">暂无排行数据</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rankings;
