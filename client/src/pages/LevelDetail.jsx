import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLevelStore } from '../stores';
import { Lock, CheckCircle, PlayCircle, ArrowLeft, Keyboard, Code } from 'lucide-react';
import toast from 'react-hot-toast';

const LevelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLevel, fetchLevel, startLevel, isLoading } = useLevelStore();
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchLevel(id);
  }, [id]);

  useEffect(() => {
    const handleFocus = () => {
      fetchLevel(id);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id, fetchLevel]);

  const handleStart = async () => {
    if (!currentLevel?.isUnlocked) {
      toast.error('关卡未解锁');
      return;
    }
    
    setStarting(true);
    try {
      await startLevel(id);
      toast.success('关卡已开始！');
    } catch (error) {
      toast.error('启动关卡失败');
    } finally {
      setStarting(false);
    }
  };

  const getExerciseIcon = (type) => {
    return type === 'typing' ? (
      <Keyboard className="text-primary-400" size={20} />
    ) : (
      <Code className="text-purple-400" size={20} />
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <CheckCircle size={12} />
            <span>已完成</span>
          </div>
        );
      case 'in_progress':
        return (
          <div className="bg-primary-500/20 text-primary-400 px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <PlayCircle size={12} />
            <span>进行中</span>
          </div>
        );
      case 'locked':
        return (
          <div className="bg-slate-700 text-slate-400 px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Lock size={12} />
            <span>未解锁</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading || !currentLevel) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/levels')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        <span>返回关卡列表</span>
      </button>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{currentLevel.name}</h1>
            <p className="text-slate-400">{currentLevel.description}</p>
          </div>
          
          {currentLevel.isUnlocked && !currentLevel.progress?.completed && (
            <button
              onClick={handleStart}
              disabled={starting}
              className="btn-primary"
            >
              {starting ? '启动中...' : '开始挑战'}
            </button>
          )}
        </div>

        {currentLevel.progress?.completed && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="text-green-400" size={24} />
            <span className="text-green-400 font-medium">恭喜！你已完成此关卡</span>
          </div>
        )}

        {!currentLevel.isUnlocked && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Lock className="text-yellow-400" size={24} />
            <span className="text-yellow-400 font-medium">完成前置关卡后可解锁此关卡</span>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">练习列表</h2>
        <div className="space-y-3">
          {currentLevel.exercises?.map((exercise, index) => (
            <Link
              key={exercise._id}
              to={exercise.isUnlocked ? `/${exercise.type}/${exercise._id}` : '#'}
              className={`card flex items-center justify-between transition-all hover:scale-[1.01] ${
                !exercise.isUnlocked ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  exercise.status === 'completed' ? 'bg-green-500/20' :
                  exercise.status === 'in_progress' ? 'bg-primary-500/20' :
                  'bg-slate-700'
                }`}>
                  {getExerciseIcon(exercise.type)}
                </div>
                <div>
                  <div className="text-white font-medium">{exercise.title}</div>
                  <div className="text-sm text-slate-400">
                    {exercise.type === 'typing' ? '打字练习' : 'OJ题目'} · {exercise.expReward} EXP
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {exercise.coinsReward > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-sm">
                    <span>💰</span>
                    <span>+{exercise.coinsReward}</span>
                  </div>
                )}
                {exercise.status !== 'locked' && exercise.progress > 0 && (
                  <div className="w-24">
                    <div className="exp-bar">
                      <div 
                        className="exp-bar-fill" 
                        style={{ width: `${exercise.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                {getStatusBadge(exercise.status)}
              </div>
            </Link>
          ))}
        </div>

        {(!currentLevel.exercises || currentLevel.exercises.length === 0) && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-slate-400">此关卡暂无练习</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelDetail;
