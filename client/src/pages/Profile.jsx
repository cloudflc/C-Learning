import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores';
import { achievementsAPI, rankingAPI } from '../services/api';
import { Trophy, Target, Flame, Award, Calendar, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

const Profile = () => {
  const { user, refreshUser } = useAuthStore();
  const [achievements, setAchievements] = useState([]);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [achievementsRes, rankRes] = await Promise.all([
        achievementsAPI.getAll(),
        rankingAPI.getMyRank()
      ]);
      setAchievements(achievementsRes.data.filter(a => a.earned));
      setMyRank(rankRes.data);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  };

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

  const getRankColor = (rank) => {
    const colors = {
      'Bronze': 'from-amber-700 to-amber-600',
      'Silver': 'from-slate-400 to-slate-300',
      'Gold': 'from-yellow-500 to-yellow-400',
      'Platinum': 'from-slate-200 to-slate-100',
      'Diamond': 'from-cyan-300 to-blue-200'
    };
    return colors[rank] || 'from-amber-700 to-amber-600';
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
      progress: ((user?.exp || 0) / expThresholds[currentIndex + 1]) * 100,
      expNeeded: expThresholds[currentIndex + 1] - (user?.exp || 0)
    };
  };

  const nextRankInfo = getNextRankInfo();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">个人中心</h1>
        <p className="text-slate-400">查看你的学习统计和成就</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center gap-6 mb-6">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getRankColor(user?.rank)} flex items-center justify-center text-4xl shadow-lg`}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white">{user?.username}</h2>
                  <span className="text-2xl">{getRankIcon(user?.rank)}</span>
                </div>
                <div className="text-slate-400">{user?.role === 'teacher' ? '教师' : '学生'}</div>
                <div className="text-slate-400 text-sm mt-1">
                  排名 #{myRank?.rank || '-'}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">经验值</span>
                <span className="text-white font-medium">{user?.exp || 0} EXP</span>
              </div>
              <div className="exp-bar h-3">
                <div 
                  className="exp-bar-fill" 
                  style={{ width: `${Math.min(100, nextRankInfo?.progress || 0)}%` }}
                />
              </div>
              {nextRankInfo && (
                <div className="text-right text-sm text-slate-400 mt-1">
                  还需 {nextRankInfo.expNeeded} EXP 升级到 {nextRankInfo.nextRank}
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <Trophy className="mx-auto text-yellow-400 mb-2" size={24} />
                <div className="text-white font-bold">{user?.rank || 'Bronze'}</div>
                <div className="text-xs text-slate-400">段位</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <Target className="mx-auto text-primary-400 mb-2" size={24} />
                <div className="text-white font-bold">{user?.totalExercises || 0}</div>
                <div className="text-xs text-slate-400">练习数</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <Flame className="mx-auto text-orange-400 mb-2" size={24} />
                <div className="text-white font-bold">{user?.consecutiveDays || 0}</div>
                <div className="text-xs text-slate-400">连续天数</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <Award className="mx-auto text-purple-400 mb-2" size={24} />
                <div className="text-white font-bold">{achievements.length}</div>
                <div className="text-xs text-slate-400">成就</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4">学习统计</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="text-green-400" size={20} />
                  <span className="text-slate-400">正确率</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {user?.correctRate || 0}%
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="text-blue-400" size={20} />
                  <span className="text-slate-400">最近活跃</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {user?.lastActiveDate ? new Date(user.lastActiveDate).toLocaleDateString() : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4">成就徽章</h3>
            <div className="grid grid-cols-3 gap-3">
              {achievements.map((achievement) => (
                <div 
                  key={achievement._id}
                  className="aspect-square bg-slate-700/50 rounded-lg flex items-center justify-center text-3xl"
                  title={achievement.name}
                >
                  {achievement.icon}
                </div>
              ))}
              {achievements.length === 0 && (
                <div className="col-span-3 text-center py-8 text-slate-400">
                  暂无成就，继续努力！
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4">段位说明</h3>
            <div className="space-y-3">
              {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map((rank, index) => {
                const thresholds = [0, 500, 1500, 5000, 15000];
                return (
                  <div 
                    key={rank}
                    className={clsx(
                      'flex items-center justify-between p-3 rounded-lg',
                      rank === user?.rank ? 'bg-primary-500/20 border border-primary-500/30' : 'bg-slate-700/30'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{getRankIcon(rank)}</span>
                      <span className="text-white font-medium">{rank}</span>
                    </div>
                    <span className="text-slate-400 text-sm">{thresholds[index]} EXP</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
