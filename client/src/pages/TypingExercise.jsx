import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTypingStore, useAuthStore, useLevelStore } from '../stores';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Heart, Clock, Send, RefreshCw, Lock, Check, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const TypingExercise = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentExercise, exerciseProgress, startExercise, submitLine, resetProgress, isLoading } = useTypingStore();
  const { updateUser } = useAuthStore();
  const { fetchLevels } = useLevelStore();
  
  const [userInput, setUserInput] = useState('');
  const [hp, setHp] = useState(3);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [shake, setShake] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    startExercise(id).then(data => {
      if (data.exercise) {
        setHp(data.exercise.initialHp || 3);
        setTimeLeft(data.exercise.timeLimit || 0);
        if (data.result?.isCompleted) {
          setResult({ isCompleted: true, completedLines: data.result.totalLines });
        }
        setIsStarted(false);
      }
    });
  }, [id]);

  useEffect(() => {
    console.log('=== exerciseProgress CHANGED ===');
    console.log('exerciseProgress:', exerciseProgress);
  }, [exerciseProgress]);

  useEffect(() => {
    if (isStarted && timeLeft > 0 && currentExercise?.timeLimit > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStarted, currentExercise?.timeLimit]);

  const handleStart = () => {
    setIsStarted(true);
    setStartTime(Date.now());
    inputRef.current?.focus();
  };

  const handleTimeout = async () => {
    toast.error('时间到！挑战失败');
    setResult({ isCompleted: false, message: '时间到，挑战失败' });
  };

  const handleSubmit = async () => {
    console.log('=== HANDLE SUBMIT CALLED ===');
    console.log('isSubmitting:', isSubmitting);
    console.log('isStarted:', isStarted);
    console.log('currentExercise:', !!currentExercise);
    console.log('hp:', hp);
    console.log('userInput:', userInput);
    console.log('exerciseProgress:', exerciseProgress);
    
    if (isSubmitting || !isStarted || !currentExercise) {
      console.log('EARLY RETURN: isSubmitting || !isStarted || !currentExercise');
      return;
    }
    if (hp <= 0) {
      console.log('EARLY RETURN: hp <= 0');
      toast.error('生命值已耗尽，请重新开始');
      return;
    }
    
    const currentLine = (exerciseProgress?.completedLines || 0) + 1;
    console.log('currentLine to submit:', currentLine);
    console.log('totalLines:', currentExercise.questions?.length);
    if (currentLine > currentExercise.questions?.length) {
      console.log('EARLY RETURN: currentLine > questions.length');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      console.log('=== SUBMITTING ===');
      console.log('lineNumber:', currentLine);
      console.log('submittedContent:', userInput);
      console.log('submittedContent length:', userInput.length);
      console.log('hpRemaining:', hp);
      console.log('timeSpent:', timeSpent);
      
      const response = await submitLine(id, {
        lineNumber: currentLine,
        submittedContent: userInput,
        hpRemaining: hp,
        timeSpent
      });

      console.log('=== RESPONSE RECEIVED ===');
      console.log('Full response:', response);
      console.log('response.isCorrect:', response.isCorrect);
      console.log('response.isCompleted:', response.isCompleted);
      console.log('response.completedLines:', response.completedLines);
      console.log('response.totalLines:', response.totalLines);
      console.log('response.expEarned:', response.expEarned);
      console.log('response.hpRemaining:', response.hpRemaining);
      console.log('response.correctAnswer:', response.correctAnswer);
      console.log('response.message:', response.message);
      console.log('response.coinsEarned:', response.coinsEarned);
      console.log('response.isNewRecord:', response.isNewRecord);
      console.log('response.isFirstCompletion:', response.isFirstCompletion);

      if (response.isCorrect) {
        setResult({
          completedLines: response.completedLines,
          totalLines: response.totalLines,
          isCompleted: response.isCompleted,
          expEarned: response.expEarned
        });
        
        fetchLevels();
        
        if (response.isCompleted) {
          let completionMessage = `恭喜完成全部题目！获得 ${response.expEarned} 经验值！`;
          
          if (response.coinsEarned > 0) {
            completionMessage += ` +${response.coinsEarned} 金币！`;
          }
          
          if (response.isNewRecord) {
            completionMessage += ' 🏆 打破纪录！';
          }
          
          toast.success(completionMessage);
          setIsStarted(false);
        } else {
          toast.success('正确！进入下一行');
          setUserInput('');
        }
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);

        if (response.hpRemaining <= 0) {
          setHp(0);
          toast.error('生命值耗尽，挑战失败');
          setResult({ isCompleted: false, message: '生命值耗尽，挑战失败', completedLines: 0 });
          setCorrectAnswer(response.correctAnswer || '');
          setShowCorrectAnswer(true);
          setIsStarted(false);
        } else {
          setHp(response.hpRemaining);
          toast.error('答案错误，请重试！');
          setCorrectAnswer(response.correctAnswer || '');
          setShowCorrectAnswer(true);
          setUserInput('');
        }
      }
    } catch (error) {
      console.error('=== SUBMIT ERROR ===');
      console.error('Error:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      toast.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    resetProgress();
    setUserInput('');
    setResult(null);
    setShowCorrectAnswer(false);
    setCorrectAnswer('');
    setHp(currentExercise?.initialHp || 3);
    setTimeLeft(currentExercise?.timeLimit || 0);
    setIsStarted(false);
    setStartTime(null);
    setIsSubmitting(false);
    
    const data = await startExercise(id);
    if (data.exercise) {
      setHp(data.exercise.initialHp || 3);
      setTimeLeft(data.exercise.timeLimit || 0);
    }
  };

  if (isLoading || !currentExercise) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const totalLines = currentExercise.questions?.length || 0;
  const baseCompletedLines = exerciseProgress?.completedLines ?? result?.completedLines ?? 0;
  const currentLine = baseCompletedLines >= totalLines ? 1 : baseCompletedLines + 1;
  const isLineUnlocked = (lineNum) => lineNum <= currentLine;
  const currentQuestion = currentExercise.questions?.find(q => q.lineNumber === currentLine);

  console.log('=== TypingExercise Render ===');
  console.log('exerciseProgress:', exerciseProgress);
  console.log('result:', result);
  console.log('currentLine:', currentLine);
  console.log('totalLines:', totalLines);
  console.log('currentQuestion:', currentQuestion);
  console.log('isStarted:', isStarted);
  console.log('currentExercise.questions:', currentExercise.questions);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        <span>返回</span>
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-white">{currentExercise.title}</h1>
              
              <div className="flex items-center gap-4">
                {currentExercise.timeLimit > 0 && (
                  <div className={clsx(
                    'flex items-center gap-2 px-3 py-1 rounded-lg',
                    timeLeft <= 30 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'
                  )}>
                    <Clock size={18} />
                    <span>{timeLeft}s</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/20 text-red-400">
                  <Heart size={18} />
                  <span>{hp}</span>
                </div>
              </div>
            </div>

            {currentExercise.description && (
              <div className="prose prose-invert max-w-none mb-4">
                <ReactMarkdown>{currentExercise.description}</ReactMarkdown>
              </div>
            )}

            {!isStarted && !result?.isCompleted && !result?.message && (
              <button
                onClick={handleStart}
                className="btn-primary w-full py-3 text-lg"
              >
                开始练习
              </button>
            )}

            {result?.isCompleted && (
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="text-green-400 font-bold text-lg mb-2">🎉 恭喜完成！</div>
                <div className="text-slate-300">
                  获得经验值：+{result.expEarned} EXP<br/>
                  用时：{Math.floor((Date.now() - startTime) / 1000)} 秒
                </div>
                {result.coinsEarned > 0 && (
                  <div className="mt-2 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <div className="text-yellow-400 font-bold">💰 获得金币</div>
                    <div className="text-slate-300 text-sm">+{result.coinsEarned} 金币</div>
                  </div>
                )}
                {result.isNewRecord && (
                  <div className="mt-2 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <div className="text-yellow-400 font-bold">🏆 打破纪录！</div>
                    <div className="text-slate-300 text-sm">新纪录：{result.timeSpent} 秒</div>
                  </div>
                )}
                <button
                  onClick={handleRetry}
                  className="btn-secondary mt-4 w-full"
                >
                  再次挑战
                </button>
              </div>
            )}

            {result?.message && !result?.isCompleted && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="text-red-400 font-bold">{result.message}</div>
                {showCorrectAnswer && correctAnswer && (
                  <div className="mt-3 p-3 bg-slate-800 rounded-lg">
                    <div className="text-yellow-400 text-sm font-medium mb-1">正确答案：</div>
                    <pre className="text-green-300 font-mono text-sm whitespace-pre-wrap">{correctAnswer}</pre>
                  </div>
                )}
                <button
                  onClick={handleRetry}
                  className="btn-secondary mt-4 w-full"
                >
                  重新挑战
                </button>
              </div>
            )}
          </div>

          {isStarted && !result?.isCompleted && currentQuestion && (
            <div className={clsx(
              'card transition-all',
              shake && 'animate-shake border-red-500'
            )}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400">第 {currentLine} / {totalLines} 行</span>
                <div className="exp-bar w-32">
                  <div 
                    className="exp-bar-fill" 
                    style={{ width: `${((currentLine - 1) / totalLines) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-4 mb-4">
                <div className="text-sm text-slate-400 mb-2">提示：</div>
                <pre className="text-primary-400 font-mono text-lg">{currentQuestion.prompt}</pre>
              </div>

              <div className="bg-slate-900 rounded-lg p-4">
                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => {
                    console.log('=== INPUT CHANGE ===');
                    console.log('value:', e.target.value);
                    setUserInput(e.target.value);
                    if (showCorrectAnswer) {
                      setShowCorrectAnswer(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      console.log('=== ENTER KEY PRESSED ===');
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="输入答案后按回车提交..."
                  className="w-full bg-transparent text-white font-mono text-lg resize-none focus:outline-none min-h-[100px]"
                  disabled={!isStarted || isSubmitting}
                />
              </div>

              {showCorrectAnswer && correctAnswer && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="text-red-400 text-sm font-medium mb-1">正确答案：</div>
                  <pre className="text-yellow-300 font-mono text-sm whitespace-pre-wrap">{correctAnswer}</pre>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !userInput}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                <Send size={20} />
                {isSubmitting ? '提交中...' : '提交 (Enter)'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4">题目进度</h3>
            <div className="space-y-2">
              {currentExercise.questions?.map((q) => {
                const isUnlocked = isLineUnlocked(q.lineNumber);
                const isCompleted = (exerciseProgress?.completedLines || result?.completedLines || 0) >= q.lineNumber;
                
                return (
                  <div 
                    key={q.lineNumber}
                    className={clsx(
                      'p-3 rounded-lg flex items-center gap-3 transition-all',
                      isCompleted ? 'bg-green-500/20 border border-green-500/30' :
                      isUnlocked ? 'bg-slate-700/50 border border-slate-600' :
                      'bg-slate-800/30 border border-slate-700 opacity-50'
                    )}
                  >
                    <div className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold',
                      isCompleted ? 'bg-green-500 text-white' :
                      isUnlocked ? 'bg-primary-500 text-white' :
                      'bg-slate-700 text-slate-500'
                    )}>
                      {isCompleted ? <Check size={16} /> : 
                       isUnlocked ? q.lineNumber : 
                       <Lock size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={clsx(
                        'text-sm font-mono truncate',
                        isUnlocked ? 'text-white' : 'text-slate-500'
                      )}>
                        {q.prompt || `第 ${q.lineNumber} 行`}
                      </div>
                    </div>
                    {isUnlocked && !isCompleted && (
                      <ChevronRight size={16} className="text-slate-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-white mb-2">练习信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">总行数</span>
                <span className="text-white">{totalLines} 行</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">初始生命</span>
                <span className="text-white">{currentExercise.initialHp} 点</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">时间限制</span>
                <span className="text-white">{currentExercise.timeLimit > 0 ? `${currentExercise.timeLimit}秒` : '不限时'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">经验奖励</span>
                <span className="text-primary-400">+{currentExercise.expReward} EXP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingExercise;
