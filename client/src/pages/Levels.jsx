import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLevelStore } from '../stores';
import { Lock, CheckCircle, PlayCircle, ArrowRight } from 'lucide-react';

const Levels = () => {
  const { levels, fetchLevels, isLoading } = useLevelStore();

  useEffect(() => {
    fetchLevels();
  }, []);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">学习关卡</h1>
        <p className="text-slate-400">选择一个关卡开始你的C++学习之旅</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levels.filter(level => level.isAssigned).map((level) => (
            <Link
              key={level._id}
              to={level.isUnlocked ? `/levels/${level._id}` : '#'}
              className={`card group transition-all hover:scale-[1.02] ${
                !level.isUnlocked ? 'opacity-60' : ''
              }`}
            >
              <div className="relative mb-4">
                <div className="aspect-video rounded-lg bg-slate-700 flex items-center justify-center overflow-hidden">
                  {level.coverImage ? (
                    <img 
                      src={level.coverImage} 
                      alt={level.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl">🚪</div>
                  )}
                </div>
                <div className="absolute top-2 right-2">
                  {level.progress?.completed ? (
                    <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      <CheckCircle size={14} />
                      <span>已完成</span>
                    </div>
                  ) : level.isUnlocked ? (
                    <div className="bg-primary-500/20 text-primary-400 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      <PlayCircle size={14} />
                      <span>可进入</span>
                    </div>
                  ) : (
                    <div className="bg-slate-700 text-slate-400 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      <Lock size={14} />
                      <span>未解锁</span>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
                {level.name}
              </h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                {level.description || '点击进入关卡'}
              </p>

              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  {level.exercises?.length || 0} 个练习
                </div>
                {level.isUnlocked && (
                  <ArrowRight className="text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              {level.progress && !level.progress.completed && level.isUnlocked && (
                <div className="mt-4">
                  <div className="exp-bar">
                    <div 
                      className="exp-bar-fill" 
                      style={{ width: `${level.progress.progress || 0}%` }}
                    />
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {levels.length === 0 && !isLoading && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-white mb-2">暂无关卡</h3>
          <p className="text-slate-400">敬请期待更多关卡内容</p>
        </div>
      )}
    </div>
  );
};

export default Levels;
