import { useState, useEffect } from 'react';
import { levelsAPI, typingAPI, ojAPI, usersAPI } from '../services/api';
import api from '../services/api';
import {
  Plus, Trash2, Edit, Keyboard, Code, Settings, Users,
  ChevronRight, Save, X, Search, FolderPlus, UserPlus, Lock, Unlock, CheckCircle, Gift, ShoppingCart
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('levels');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">教师后台</h1>
        <p className="text-slate-400">管理关卡、练习和系统配置</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('levels')}
          className={clsx(
            'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
            activeTab === 'levels' 
              ? 'bg-primary-500/20 text-primary-400' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          )}
        >
          <Settings size={18} />
          关卡管理
        </button>
        <button
          onClick={() => setActiveTab('typing')}
          className={clsx(
            'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
            activeTab === 'typing' 
              ? 'bg-primary-500/20 text-primary-400' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          )}
        >
          <Keyboard size={18} />
          打字练习
        </button>
        <button
          onClick={() => setActiveTab('oj')}
          className={clsx(
            'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
            activeTab === 'oj'
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          )}
        >
          <Code size={18} />
          OJ题目
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={clsx(
            'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
            activeTab === 'students'
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          )}
        >
          <Users size={18} />
          学生管理
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={clsx(
            'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
            activeTab === 'rewards'
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          )}
        >
          <Gift size={18} />
          奖励配置
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={clsx(
            'px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
            activeTab === 'shop'
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          )}
        >
          <ShoppingCart size={18} />
          商品管理
        </button>
      </div>

      {activeTab === 'levels' && <LevelManagement />}
      {activeTab === 'typing' && <TypingManagement />}
      {activeTab === 'oj' && <OJManagement />}
      {activeTab === 'students' && <StudentManagement />}
      {activeTab === 'rewards' && <RewardManagement />}
      {activeTab === 'shop' && <ShopManagement />}
    </div>
  );
};

const LevelManagement = () => {
  const [levels, setLevels] = useState([]);
  const [typingExercises, setTypingExercises] = useState([]);
  const [ojProblems, setOjProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(null);
  const [editingLevel, setEditingLevel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0,
    isPublic: true,
    unlockConditions: []
  });
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const [newCondition, setNewCondition] = useState({ type: 'level', targetId: '', logic: 'AND' });

  useEffect(() => {
    loadLevels();
    loadExercises();
  }, []);

  const loadLevels = async () => {
    try {
      const res = await levelsAPI.getAllForAdmin();
      setLevels(res.data);
    } catch (error) {
      toast.error('加载关卡失败');
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      const [typingRes, ojRes] = await Promise.all([
        typingAPI.getAll(),
        ojAPI.getAll()
      ]);
      setTypingExercises(typingRes.data.exercises);
      setOjProblems(ojRes.data.problems);
    } catch (error) {
      console.error('加载练习失败', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLevel) {
        await levelsAPI.update(editingLevel._id, formData);
        toast.success('关卡更新成功');
      } else {
        await levelsAPI.create(formData);
        toast.success('关卡创建成功');
      }
      setShowForm(false);
      setEditingLevel(null);
      setShowUnlockForm(false);
      setFormData({ name: '', description: '', order: 0, isPublic: true, unlockConditions: [] });
      loadLevels();
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个关卡吗？')) return;
    try {
      await levelsAPI.delete(id);
      toast.success('删除成功');
      loadLevels();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleEdit = (level) => {
    setEditingLevel(level);
    setFormData({
      name: level.name,
      description: level.description,
      order: level.order,
      isPublic: level.isPublic,
      unlockConditions: level.unlockConditions || []
    });
    setShowForm(true);
  };

  const handleAddExercise = async (levelId, exerciseId, exerciseType) => {
    try {
      const level = levels.find(l => l._id === levelId);
      const currentExercises = level.exercises || [];

      let conditions = [];
      if (currentExercises.length > 0) {
        const lastExercise = currentExercises[currentExercises.length - 1];
        conditions = [{
          type: 'exercise',
          targetId: lastExercise.exerciseId,
          targetType: lastExercise.exerciseType,
          logic: 'AND'
        }];
      }

      const newExercise = {
        exerciseId,
        exerciseType,
        conditions,
        progressThreshold: 0
      };

      await levelsAPI.update(levelId, {
        ...level,
        exercises: [...currentExercises, newExercise]
      });

      toast.success('练习添加成功');
      setShowAddExercise(null);
      loadLevels();
    } catch (error) {
      toast.error('添加练习失败');
    }
  };

  const handleRemoveExercise = async (levelId, index) => {
    try {
      const level = levels.find(l => l._id === levelId);
      const newExercises = [...level.exercises];
      newExercises.splice(index, 1);
      
      await levelsAPI.update(levelId, {
        ...level,
        exercises: newExercises
      });
      
      toast.success('练习移除成功');
      loadLevels();
    } catch (error) {
      toast.error('移除练习失败');
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">关卡管理</h2>
        <button
          onClick={() => { setShowForm(true); setEditingLevel(null); setFormData({ name: '', description: '', order: 0, isPublic: true, unlockConditions: [] }); setShowUnlockForm(false); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新建关卡
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-700/50 rounded-lg space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-2">关卡名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">排序</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="input w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-300 mb-2">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full"
              rows={3}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-300">前置条件（解锁条件）</label>
              <button
                type="button"
                onClick={() => setShowUnlockForm(!showUnlockForm)}
                className="text-primary-400 text-sm hover:underline"
              >
                {showUnlockForm ? '收起' : '配置'}
              </button>
            </div>
            {showUnlockForm && (
              <div className="p-3 bg-slate-800/50 rounded-lg space-y-3">
                <p className="text-xs text-slate-400">
                  设置解锁该关卡的前置条件。留空表示无需条件，初始即可访问。
                </p>
                {formData.unlockConditions && formData.unlockConditions.length > 0 && (
                  <div className="space-y-2">
                    {formData.unlockConditions.map((cond, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-700/50 rounded">
                        <span className="text-slate-300 text-sm">
                          {cond.type === 'level' ? '完成关卡' : cond.type === 'exercise' ? '完成练习' : cond.type}:
                        </span>
                        <span className="text-primary-400 text-sm">
                          {levels.find(l => l._id === cond.targetId)?.name || cond.targetId}
                        </span>
                        <span className="text-slate-500 text-xs">({cond.logic})</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newConds = [...formData.unlockConditions];
                            newConds.splice(idx, 1);
                            setFormData({ ...formData, unlockConditions: newConds });
                          }}
                          className="ml-auto text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-slate-400 text-xs mb-1">前置关卡</label>
                    <select
                      value={newCondition.targetId}
                      onChange={(e) => setNewCondition({ ...newCondition, targetId: e.target.value })}
                      className="input w-full text-sm"
                    >
                      <option value="">选择关卡...</option>
                      {levels.filter(l => l._id !== editingLevel?._id).map(l => (
                        <option key={l._id} value={l._id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">逻辑</label>
                    <select
                      value={newCondition.logic}
                      onChange={(e) => setNewCondition({ ...newCondition, logic: e.target.value })}
                      className="input w-full text-sm"
                    >
                      <option value="AND">AND (都要满足)</option>
                      <option value="OR">OR (满足其一)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (newCondition.targetId) {
                        setFormData({
                          ...formData,
                          unlockConditions: [...formData.unlockConditions, { ...newCondition, type: 'level' }]
                        });
                        setNewCondition({ type: 'level', targetId: '', logic: 'AND' });
                      }
                    }}
                    className="btn-secondary text-sm"
                  >
                    添加条件
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Save size={18} />
              保存
            </button>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="btn-secondary flex items-center gap-2"
            >
              <X size={18} />
              取消
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {levels.map((level) => (
          <div key={level._id} className="p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold">
                  {level.order + 1}
                </div>
                <div>
                  <div className="text-white font-medium">{level.name}</div>
                  <div className="text-sm text-slate-400">{level.exercises?.length || 0} 个练习</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddExercise(showAddExercise === level._id ? null : level._id)}
                  className="p-2 text-slate-400 hover:text-green-400 transition-colors"
                  title="添加练习"
                >
                  <FolderPlus size={18} />
                </button>
                <button
                  onClick={() => handleEdit(level)}
                  className="p-2 text-slate-400 hover:text-primary-400 transition-colors"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(level._id)}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {level.exercises && level.exercises.length > 0 && (
              <div className="ml-14 space-y-2 mb-3">
                {level.exercises.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      {ex.exerciseType === 'typing' ? (
                        <Keyboard size={14} className="text-primary-400" />
                      ) : (
                        <Code size={14} className="text-purple-400" />
                      )}
                      <span className="text-slate-300">{ex.title || ex.exerciseId}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(level._id, idx)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddExercise === level._id && (
              <div className="ml-14 mt-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="text-sm text-slate-400 mb-2">添加练习到该关卡：</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">打字练习</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {typingExercises.map(ex => (
                        <button
                          key={ex._id}
                          onClick={() => handleAddExercise(level._id, ex._id, 'typing')}
                          className="w-full text-left p-2 text-sm bg-slate-700 hover:bg-primary-500/20 rounded text-slate-300 hover:text-white"
                        >
                          {ex.title}
                        </button>
                      ))}
                      {typingExercises.length === 0 && (
                        <p className="text-xs text-slate-500">暂无打字练习，请先创建</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">OJ题目</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {ojProblems.map(prob => (
                        <button
                          key={prob._id}
                          onClick={() => handleAddExercise(level._id, prob._id, 'oj')}
                          className="w-full text-left p-2 text-sm bg-slate-700 hover:bg-purple-500/20 rounded text-slate-300 hover:text-white"
                        >
                          {prob.title}
                        </button>
                      ))}
                      {ojProblems.length === 0 && (
                        <p className="text-xs text-slate-500">暂无OJ题目，请先创建</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {levels.length === 0 && (
          <p className="text-slate-400 text-center py-8">暂无关卡</p>
        )}
      </div>
    </div>
  );
};

const TypingManagement = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: [{ lineNumber: 1, prompt: '', answer: '' }],
    judgeRule: 'exact',
    initialHp: 3,
    hpDeduction: 1,
    timeLimit: 300,
    expReward: 10,
    difficulty: 'easy',
    tags: []
  });

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const res = await typingAPI.getAll();
      setExercises(res.data.exercises);
    } catch (error) {
      toast.error('加载练习失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (exerciseId) => {
    try {
      const res = await typingAPI.getForEdit(exerciseId);
      const exercise = res.data;
      setEditingExercise(exercise);
      setFormData({
        title: exercise.title || '',
        description: exercise.description || '',
        questions: exercise.questions && exercise.questions.length > 0 
          ? exercise.questions.map(q => ({
              lineNumber: q.lineNumber,
              prompt: q.prompt || '',
              answer: q.answer || ''
            }))
          : [{ lineNumber: 1, prompt: '', answer: '' }],
        judgeRule: exercise.judgeRule || 'exact',
        initialHp: exercise.initialHp || 3,
        hpDeduction: exercise.hpDeduction || 1,
        timeLimit: exercise.timeLimit || 300,
        expReward: exercise.expReward || 10,
        difficulty: exercise.difficulty || 'easy',
        tags: exercise.tags || []
      });
      setShowForm(true);
    } catch (error) {
      toast.error('加载练习详情失败');
    }
  };

  const addQuestionLine = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { 
        lineNumber: formData.questions.length + 1, 
        prompt: '', 
        answer: '' 
      }]
    });
  };

  const removeQuestionLine = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      questions: newQuestions.map((q, i) => ({ ...q, lineNumber: i + 1 }))
    });
  };

  const updateQuestionLine = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        questions: formData.questions.filter(q => q.prompt && q.answer)
      };
      if (editingExercise) {
        await typingAPI.update(editingExercise._id, submitData);
        toast.success('更新成功');
      } else {
        await typingAPI.create(submitData);
        toast.success('创建成功');
      }
      setShowForm(false);
      setEditingExercise(null);
      setFormData({
        title: '',
        description: '',
        questions: [{ lineNumber: 1, prompt: '', answer: '' }],
        judgeRule: 'exact',
        initialHp: 3,
        hpDeduction: 1,
        timeLimit: 300,
        expReward: 10,
        difficulty: 'easy',
        tags: []
      });
      loadExercises();
    } catch (error) {
      toast.error('操作失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await typingAPI.delete(id);
      toast.success('删除成功');
      loadExercises();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">打字练习管理</h2>
        <button
          onClick={() => { setShowForm(true); setEditingExercise(null); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新建练习
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-700/50 rounded-lg space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-2">标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">难度</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="input w-full"
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-300 mb-2">描述 (Markdown)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full"
              rows={3}
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-slate-300">题目行（每行包括提示和答案）</label>
              <button
                type="button"
                onClick={addQuestionLine}
                className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
              >
                <Plus size={16} /> 添加行
              </button>
            </div>
            <div className="space-y-3">
              {(formData.questions || []).map((q, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <span className="text-slate-500 text-sm mt-2 w-6">{index + 1}</span>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="提示（如：#include <iostream>）"
                      value={q.prompt}
                      onChange={(e) => updateQuestionLine(index, 'prompt', e.target.value)}
                      className="input w-full text-sm mb-1"
                    />
                    <input
                      type="text"
                      placeholder="答案"
                      value={q.answer}
                      onChange={(e) => updateQuestionLine(index, 'answer', e.target.value)}
                      className="input w-full text-sm font-mono"
                    />
                  </div>
                  {formData.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestionLine(index)}
                      className="text-red-400 hover:text-red-300 mt-2"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-300 mb-2">初始生命值</label>
              <input
                type="number"
                value={formData.initialHp}
                onChange={(e) => setFormData({ ...formData, initialHp: parseInt(e.target.value) })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">每次错误扣血</label>
              <input
                type="number"
                value={formData.hpDeduction}
                onChange={(e) => setFormData({ ...formData, hpDeduction: parseInt(e.target.value) })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">时间限制(秒，0不限)</label>
              <input
                type="number"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">经验奖励</label>
              <input
                type="number"
                value={formData.expReward}
                onChange={(e) => setFormData({ ...formData, expReward: parseInt(e.target.value) })}
                className="input w-full"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-2">判定规则</label>
              <select
                value={formData.judgeRule}
                onChange={(e) => setFormData({ ...formData, judgeRule: e.target.value })}
                className="input w-full"
              >
                <option value="exact">精确匹配</option>
                <option value="ignoreWhitespace">忽略空白</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-2">难度</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="input w-full"
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Save size={18} />
              保存
            </button>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="btn-secondary flex items-center gap-2"
            >
              <X size={18} />
              取消
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {exercises.map((exercise) => (
          <div key={exercise._id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-4">
              <Keyboard className="text-primary-400" size={24} />
              <div>
                <div className="text-white font-medium">{exercise.title}</div>
                <div className="text-sm text-slate-400">
                  {exercise.difficulty} · {exercise.expReward} EXP
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(exercise._id)}
                className="p-2 text-slate-400 hover:text-primary-400 transition-colors"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDelete(exercise._id)}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {exercises.length === 0 && (
          <p className="text-slate-400 text-center py-8">暂无打字练习</p>
        )}
      </div>
    </div>
  );
};

const OJManagement = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    inputFormat: '',
    outputFormat: '',
    sampleInput: '',
    sampleOutput: '',
    timeLimit: 1000,
    memoryLimit: 128,
    expReward: 20,
    difficulty: 'easy',
    testCases: []
  });
  const [newTestCase, setNewTestCase] = useState({ input: '', output: '', score: 10 });

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      const res = await ojAPI.getAll();
      setProblems(res.data.problems);
    } catch (error) {
      toast.error('加载题目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProblem) {
        await ojAPI.update(editingProblem._id, formData);
        toast.success('更新成功');
      } else {
        await ojAPI.create(formData);
        toast.success('创建成功');
      }
      setShowForm(false);
      setEditingProblem(null);
      loadProblems();
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await ojAPI.delete(id);
      toast.success('删除成功');
      loadProblems();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const addTestCase = () => {
    if (!newTestCase.input || !newTestCase.output) {
      toast.error('请填写测试用例的输入和输出');
      return;
    }
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { ...newTestCase }]
    });
    setNewTestCase({ input: '', output: '', score: 10 });
  };

  const removeTestCase = (index) => {
    const newCases = [...formData.testCases];
    newCases.splice(index, 1);
    setFormData({ ...formData, testCases: newCases });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">OJ题目管理</h2>
        <button
          onClick={() => { setShowForm(true); setEditingProblem(null); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新建题目
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-700/50 rounded-lg space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-2">标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">难度</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="input w-full"
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-300 mb-2">题目描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full"
              rows={4}
              required
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-2">输入格式</label>
              <textarea
                value={formData.inputFormat}
                onChange={(e) => setFormData({ ...formData, inputFormat: e.target.value })}
                className="input w-full"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">输出格式</label>
              <textarea
                value={formData.outputFormat}
                onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value })}
                className="input w-full"
                rows={2}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-2">样例输入</label>
              <textarea
                value={formData.sampleInput}
                onChange={(e) => setFormData({ ...formData, sampleInput: e.target.value })}
                className="input w-full font-mono"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">样例输出</label>
              <textarea
                value={formData.sampleOutput}
                onChange={(e) => setFormData({ ...formData, sampleOutput: e.target.value })}
                className="input w-full font-mono"
                rows={2}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 mb-2">时间限制 (ms)</label>
              <input
                type="number"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">内存限制 (MB)</label>
              <input
                type="number"
                value={formData.memoryLimit}
                onChange={(e) => setFormData({ ...formData, memoryLimit: parseInt(e.target.value) })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">经验奖励</label>
              <input
                type="number"
                value={formData.expReward}
                onChange={(e) => setFormData({ ...formData, expReward: parseInt(e.target.value) })}
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-2">测试用例</label>
            <div className="space-y-2 mb-3">
              {formData.testCases.map((tc, index) => (
                <div key={index} className="flex gap-2 items-start bg-slate-800 p-2 rounded">
                  <div className="flex-1">
                    <div className="text-xs text-slate-500">输入</div>
                    <textarea
                      value={tc.input}
                      readOnly
                      className="input w-full text-sm font-mono h-16"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500">输出</div>
                    <textarea
                      value={tc.output}
                      readOnly
                      className="input w-full text-sm font-mono h-16"
                    />
                  </div>
                  <div className="text-xs text-slate-500 pt-4">{tc.score}分</div>
                  <button
                    type="button"
                    onClick={() => removeTestCase(index)}
                    className="text-red-400 hover:text-red-300 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-2 bg-slate-800 p-3 rounded-lg">
              <div>
                <label className="block text-slate-400 text-xs mb-1">输入</label>
                <textarea
                  value={newTestCase.input}
                  onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                  className="input w-full text-sm font-mono h-16"
                  placeholder="测试输入"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">输出</label>
                <textarea
                  value={newTestCase.output}
                  onChange={(e) => setNewTestCase({ ...newTestCase, output: e.target.value })}
                  className="input w-full text-sm font-mono h-16"
                  placeholder="期望输出"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">分值</label>
                  <input
                    type="number"
                    value={newTestCase.score}
                    onChange={(e) => setNewTestCase({ ...newTestCase, score: parseInt(e.target.value) })}
                    className="input w-full text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={addTestCase}
                  className="btn-secondary text-sm py-1"
                >
                  添加测试用例
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Save size={18} />
              保存
            </button>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="btn-secondary flex items-center gap-2"
            >
              <X size={18} />
              取消
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {problems.map((problem) => (
          <div key={problem._id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-4">
              <Code className="text-purple-400" size={24} />
              <div>
                <div className="text-white font-medium">{problem.title}</div>
                <div className="text-sm text-slate-400">
                  {problem.difficulty} · {problem.expReward} EXP · {problem.timeLimit}ms
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  console.log('点击编辑，problem._id:', problem._id);
                  try {
                    const res = await ojAPI.getDetail(problem._id);
                    const fullProblem = res.data;
                    console.log('获取到的题目:', fullProblem);
                    setEditingProblem(fullProblem);
                    setFormData({
                      title: fullProblem.title || '',
                      description: fullProblem.description || '',
                      inputFormat: fullProblem.inputFormat || '',
                      outputFormat: fullProblem.outputFormat || '',
                      sampleInput: fullProblem.sampleInput || '',
                      sampleOutput: fullProblem.sampleOutput || '',
                      timeLimit: fullProblem.timeLimit || 1000,
                      memoryLimit: fullProblem.memoryLimit || 128,
                      expReward: fullProblem.expReward || 20,
                      difficulty: fullProblem.difficulty || 'easy',
                      testCases: fullProblem.testCases || []
                    });
                    setShowForm(true);
                  } catch (error) {
                    console.error('获取题目详情失败:', error);
                    toast.error('获取题目详情失败: ' + (error.response?.data?.message || error.message));
                  }
                }}
                className="p-2 text-slate-400 hover:text-primary-400 transition-colors"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDelete(problem._id)}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {problems.length === 0 && (
          <p className="text-slate-400 text-center py-8">暂无OJ题目</p>
        )}
      </div>
    </div>
  );
};

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    assignedLevels: []
  });

  useEffect(() => {
    loadStudents();
    loadLevels();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await usersAPI.getStudents();
      setStudents(res.data);
    } catch (error) {
      toast.error('加载学生失败');
    } finally {
      setLoading(false);
    }
  };

  const loadLevels = async () => {
    try {
      const res = await levelsAPI.getAllForAdmin();
      setLevels(res.data);
    } catch (error) {
      console.error('加载关卡失败', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await usersAPI.updateStudentLevels(editingStudent._id, formData);
        toast.success('学生更新成功');
      } else {
        await usersAPI.createStudent(formData);
        toast.success('学生创建成功');
      }
      setShowForm(false);
      setEditingStudent(null);
      setFormData({ username: '', email: '', password: '', assignedLevels: [] });
      loadStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      username: student.username,
      email: student.email,
      password: '',
      assignedLevels: student.assignedLevels?.map(l => l._id || l) || []
    });
    setShowForm(true);
  };

  const handleToggleLevel = (levelId) => {
    const currentLevels = formData.assignedLevels || [];
    if (currentLevels.includes(levelId)) {
      setFormData({
        ...formData,
        assignedLevels: currentLevels.filter(id => id !== levelId)
      });
    } else {
      setFormData({
        ...formData,
        assignedLevels: [...currentLevels, levelId]
      });
    }
  };

  const handleQuickUnlock = async (studentId, levelId) => {
    try {
      await usersAPI.updateStudentLevelStatus(studentId, {
        levelId,
        status: 'unlocked'
      });
      toast.success('已解锁该关卡');
      loadStudents();
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleQuickComplete = async (studentId, levelId) => {
    try {
      await usersAPI.updateStudentLevelStatus(studentId, {
        levelId,
        status: 'completed'
      });
      toast.success('已完成该关卡');
      loadStudents();
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleQuickLock = async (studentId, levelId) => {
    try {
      await usersAPI.updateStudentLevelStatus(studentId, {
        levelId,
        status: 'locked'
      });
      toast.success('已锁定该关卡');
      loadStudents();
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const getLevelStatus = (student, levelId) => {
    if (!student.assignedLevels?.some(l => (l._id || l) === levelId)) {
      return 'not_assigned';
    }
    const status = student.levelStatuses?.find(ls => (ls.levelId._id || ls.levelId) === levelId);
    return status?.status || 'unlocked';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">学生管理</h2>
        <button
          onClick={() => { setShowForm(true); setEditingStudent(null); setFormData({ username: '', email: '', password: '', assignedLevels: [] }); }}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} />
          添加学生
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-700/50 rounded-lg space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-2">用户名</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">邮箱</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input w-full"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-300 mb-2">
              {editingStudent ? '重置密码（留空则不修改）' : '密码'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input w-full"
              required={!editingStudent}
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-2">分配关卡</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-800/50 rounded-lg">
              {levels.map(level => (
                <label
                  key={level._id}
                  className={clsx(
                    'flex items-center gap-2 p-2 rounded cursor-pointer text-sm',
                    formData.assignedLevels?.includes(level._id)
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-slate-400 hover:bg-slate-700'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={formData.assignedLevels?.includes(level._id) || false}
                    onChange={() => handleToggleLevel(level._id)}
                    className="rounded"
                  />
                  {level.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Save size={18} />
              保存
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary flex items-center gap-2"
            >
              <X size={18} />
              取消
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {students.length === 0 ? (
          <p className="text-slate-400 text-center py-8">暂无学生</p>
        ) : (
          students.map(student => (
            <div key={student._id} className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold">
                    {student.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-medium">{student.username}</div>
                    <div className="text-sm text-slate-400">{student.email}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(student)}
                    className="p-2 text-slate-400 hover:text-primary-400 transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                </div>
              </div>

              <div className="ml-14">
                <div className="text-sm text-slate-400 mb-2">
                  已分配 {student.assignedLevels?.length || 0} 个关卡
                </div>
                <div className="space-y-1">
                  {levels.map(level => {
                    const status = getLevelStatus(student, level._id);
                    return (
                      <div
                        key={level._id}
                        className={clsx(
                          'flex items-center justify-between p-2 rounded text-sm',
                          status === 'not_assigned' ? 'bg-slate-800/30 text-slate-500' :
                          status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          status === 'unlocked' ? 'bg-primary-500/10 text-primary-400' :
                          'bg-red-500/10 text-red-400'
                        )}
                      >
                        <span>{level.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">
                            {status === 'not_assigned' ? '未分配' :
                             status === 'completed' ? '已完成' :
                             status === 'unlocked' ? '已解锁' : '已锁定'}
                          </span>
                          {status !== 'not_assigned' && (
                            <>
                              {status !== 'completed' && (
                                <button
                                  onClick={() => handleQuickComplete(student._id, level._id)}
                                  className="p-1 hover:text-green-400"
                                  title="标记完成"
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              {status === 'locked' && (
                                <button
                                  onClick={() => handleQuickUnlock(student._id, level._id)}
                                  className="p-1 hover:text-primary-400"
                                  title="解锁"
                                >
                                  <Unlock size={14} />
                                </button>
                              )}
                              {status !== 'locked' && (
                                <button
                                  onClick={() => handleQuickLock(student._id, level._id)}
                                  className="p-1 hover:text-red-400"
                                  title="锁定"
                                >
                                  <Lock size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const RewardManagement = () => {
  const [rewards, setRewards] = useState([]);
  const [typingExercises, setTypingExercises] = useState([]);
  const [ojProblems, setOjProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'exercise_completion',
    exerciseId: '',
    ojProblemId: '',
    coinsReward: 0,
    isActive: true,
    isRepeatable: false,
    condition: {
      minAttempts: 0,
      maxTime: null
    }
  });

  useEffect(() => {
    loadRewards();
    loadExercises();
  }, []);

  const loadRewards = async () => {
    try {
      const res = await api.get('/rewards');
      setRewards(res.data);
    } catch (error) {
      toast.error('加载奖励失败');
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      const typingRes = await api.get('/typing');
      setTypingExercises(typingRes.data.exercises || []);
      
      const ojRes = await api.get('/oj');
      setOjProblems(ojRes.data.problems || []);
    } catch (error) {
      console.error('加载练习失败', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        exerciseId: formData.exerciseId || null,
        ojProblemId: formData.ojProblemId || null
      };
      
      if (editingReward) {
        await api.put(`/rewards/${editingReward._id}`, submitData);
        toast.success('奖励更新成功');
      } else {
        await api.post('/rewards', submitData);
        toast.success('奖励创建成功');
      }
      setShowForm(false);
      setEditingReward(null);
      setFormData({
        name: '',
        description: '',
        type: 'exercise_completion',
        exerciseId: '',
        ojProblemId: '',
        coinsReward: 0,
        isActive: true,
        isRepeatable: false,
        condition: {
          minAttempts: 0,
          maxTime: null
        }
      });
      loadRewards();
    } catch (error) {
      toast.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleEdit = (reward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description || '',
      type: reward.type,
      exerciseId: reward.exerciseId?._id || '',
      ojProblemId: reward.ojProblemId?._id || '',
      coinsReward: reward.coinsReward,
      isActive: reward.isActive,
      isRepeatable: reward.isRepeatable,
      condition: reward.condition || {
        minAttempts: 0,
        maxTime: null
      }
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个奖励吗？')) return;
    try {
      await api.delete(`/rewards/${id}`);
      toast.success('奖励删除成功');
      loadRewards();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.post(`/rewards/${id}/toggle`);
      toast.success('状态更新成功');
      loadRewards();
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const getTypeName = (type) => {
    const typeNames = {
      'exercise_completion': '完成练习奖励',
      'record_break': '打破纪录奖励',
      'first_completion': '首次完成奖励',
      'achievement': '成就奖励'
    };
    return typeNames[type] || type;
  };

  const [rewardTargetType, setRewardTargetType] = useState('typing');

  const getExerciseName = (reward) => {
    if (reward.exerciseId) {
      return `打字练习: ${reward.exerciseId.title || '已删除的练习'}`;
    }
    if (reward.ojProblemId) {
      return `OJ题目: ${reward.ojProblemId.title || '已删除的题目'}`;
    }
    return '全局奖励';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">奖励配置</h2>
        <button
          onClick={() => { setShowForm(true); setEditingReward(null); setFormData({
            name: '',
            description: '',
            type: 'exercise_completion',
            exerciseId: '',
            ojProblemId: '',
            coinsReward: 0,
            isActive: true,
            isRepeatable: false,
            condition: { minAttempts: 0, maxTime: null }
          }); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          添加奖励
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-700/50 rounded-lg space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-2">奖励名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                required
                placeholder="例如：完成OJ题目奖励"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">奖励类型</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input w-full"
              >
                <option value="exercise_completion">完成练习奖励</option>
                <option value="record_break">打破纪录奖励</option>
                <option value="first_completion">首次完成奖励</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-2">关联题目类型</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="radio"
                  name="targetType"
                  value="typing"
                  checked={!formData.exerciseId && !formData.ojProblemId ? false : (formData.exerciseId && !formData.ojProblemId)}
                  onChange={() => { setFormData({ ...formData, exerciseId: '', ojProblemId: '' }); }}
                  className="rounded"
                />
                全局奖励（所有题目）
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="radio"
                  name="targetType"
                  value="typing"
                  checked={!!formData.exerciseId}
                  onChange={() => { setFormData({ ...formData, exerciseId: typingExercises[0]?._id || '', ojProblemId: '' }); }}
                  className="rounded"
                />
                打字练习
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="radio"
                  name="targetType"
                  value="oj"
                  checked={!!formData.ojProblemId}
                  onChange={() => { setFormData({ ...formData, exerciseId: '', ojProblemId: ojProblems[0]?._id || '' }); }}
                  className="rounded"
                />
                OJ题目
              </label>
            </div>
            
            {formData.exerciseId && !formData.ojProblemId && (
              <select
                value={formData.exerciseId}
                onChange={(e) => setFormData({ ...formData, exerciseId: e.target.value, ojProblemId: '' })}
                className="input w-full"
              >
                <option value="">选择打字练习...</option>
                {typingExercises.map(ex => (
                  <option key={ex._id} value={ex._id}>{ex.title}</option>
                ))}
              </select>
            )}
            
            {formData.ojProblemId && !formData.exerciseId && (
              <select
                value={formData.ojProblemId}
                onChange={(e) => setFormData({ ...formData, ojProblemId: e.target.value, exerciseId: '' })}
                className="input w-full"
              >
                <option value="">选择OJ题目...</option>
                {ojProblems.map(problem => (
                  <option key={problem._id} value={problem._id}>{problem.title}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 mb-2">金币奖励数量</label>
              <input
                type="number"
                value={formData.coinsReward}
                onChange={(e) => setFormData({ ...formData, coinsReward: parseInt(e.target.value) || 0 })}
                className="input w-full"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">最小尝试次数</label>
              <input
                type="number"
                value={formData.condition.minAttempts}
                onChange={(e) => setFormData({
                  ...formData,
                  condition: { ...formData.condition, minAttempts: parseInt(e.target.value) || 0 }
                })}
                className="input w-full"
                min="0"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">最大时间限制(秒)</label>
              <input
                type="number"
                value={formData.condition.maxTime || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  condition: { ...formData.condition, maxTime: e.target.value ? parseInt(e.target.value) : null }
                })}
                className="input w-full"
                min="0"
                placeholder="留空表示无限制"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-2">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full"
              rows={2}
              placeholder="奖励说明..."
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              启用奖励
            </label>
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={formData.isRepeatable}
                onChange={(e) => setFormData({ ...formData, isRepeatable: e.target.checked })}
                className="rounded"
              />
              可重复获得
            </label>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              {editingReward ? '更新' : '创建'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingReward(null); }}
              className="btn-secondary"
            >
              取消
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {rewards.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            暂无奖励配置
          </div>
        ) : (
          rewards.map(reward => (
            <div key={reward._id} className={clsx(
              'p-4 rounded-lg border',
              reward.isActive 
                ? 'bg-slate-700/50 border-slate-600' 
                : 'bg-slate-800/30 border-slate-700 opacity-60'
            )}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-bold">{reward.name}</h3>
                    <span className={clsx(
                      'px-2 py-0.5 rounded text-xs',
                      reward.isActive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-slate-600 text-slate-400'
                    )}>
                      {reward.isActive ? '启用' : '禁用'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                      {getTypeName(reward.type)}
                    </span>
                    {reward.isRepeatable && (
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                        可重复
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400 space-y-1">
                    <div>关联题目: {getExerciseName(reward)}</div>
                    <div>金币奖励: <span className="text-yellow-400 font-bold">{reward.coinsReward}</span> 金币</div>
                    {reward.condition?.minAttempts > 0 && (
                      <div>最小尝试次数: {reward.condition.minAttempts} 次</div>
                    )}
                    {reward.condition?.maxTime && (
                      <div>最大时间限制: {reward.condition.maxTime} 秒</div>
                    )}
                    {reward.description && (
                      <div className="text-slate-500 mt-1">{reward.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(reward._id)}
                    className={clsx(
                      'px-3 py-1 rounded text-sm',
                      reward.isActive 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    )}
                  >
                    {reward.isActive ? '禁用' : '启用'}
                  </button>
                  <button
                    onClick={() => handleEdit(reward)}
                    className="px-3 py-1 rounded text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(reward._id)}
                    className="px-3 py-1 rounded text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ShopManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    type: 'badge',
    imageUrl: '',
    isActive: true,
    stock: -1
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await api.get('/shop/items');
      setItems(res.data);
    } catch (error) {
      toast.error('加载商品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/shop/items/${editingItem._id}`, formData);
        toast.success('商品更新成功');
      } else {
        await api.post('/shop/items', formData);
        toast.success('商品创建成功');
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        type: 'badge',
        imageUrl: '',
        isActive: true,
        stock: -1
      });
      loadItems();
    } catch (error) {
      toast.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      type: item.type,
      imageUrl: item.imageUrl || '',
      isActive: item.isActive,
      stock: item.stock
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个商品吗？')) return;
    try {
      await api.delete(`/shop/items/${id}`);
      toast.success('商品删除成功');
      loadItems();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.post(`/shop/items/${id}/toggle`);
      toast.success('状态更新成功');
      loadItems();
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      badge: '🏅',
      avatar: '👤',
      title: '👑',
      theme: '🎨'
    };
    return icons[type] || '📦';
  };

  const getTypeName = (type) => {
    const names = {
      badge: '徽章',
      avatar: '头像',
      title: '称号',
      theme: '主题'
    };
    return names[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">商品管理</h2>
        <button
          onClick={() => { setShowForm(true); setEditingItem(null); setFormData({
            name: '',
            description: '',
            price: 0,
            type: 'badge',
            imageUrl: '',
            isActive: true,
            stock: -1
          }); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          添加商品
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-700/50 rounded-lg space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-2">商品名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                required
                placeholder="例如：高级程序员徽章"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">商品类型</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input w-full"
              >
                <option value="badge">🏅 徽章</option>
                <option value="avatar">👤 头像</option>
                <option value="title">👑 称号</option>
                <option value="theme">🎨 主题</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-2">价格（金币）</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                className="input w-full"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">库存（-1表示无限）</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || -1 })}
                className="input w-full"
                min="-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-2">图片URL（可选）</label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="input w-full"
              placeholder="https://example.com/image.png"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-2">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full"
              rows={2}
              placeholder="商品描述..."
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              上架商品
            </label>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              {editingItem ? '更新' : '创建'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingItem(null); }}
              className="btn-secondary"
            >
              取消
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            暂无商品
          </div>
        ) : (
          items.map(item => (
            <div key={item._id} className={clsx(
              'p-4 rounded-lg border',
              item.isActive 
                ? 'bg-slate-700/50 border-slate-600' 
                : 'bg-slate-800/30 border-slate-700 opacity-60'
            )}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-2xl">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold">{item.name}</h3>
                  <div className="text-yellow-400 font-bold">{item.price} 金币</div>
                </div>
              </div>
              <div className="text-sm text-slate-400 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                    {getTypeName(item.type)}
                  </span>
                  {item.stock === -1 ? (
                    <span className="text-green-400">无限库存</span>
                  ) : (
                    <span className="text-slate-500">库存: {item.stock}</span>
                  )}
                </div>
                {item.description && (
                  <div className="text-slate-500 mt-1">{item.description}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggle(item._id)}
                  className={clsx(
                    'px-3 py-1 rounded text-xs flex-1',
                    item.isActive 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  )}
                >
                  {item.isActive ? '下架' : '上架'}
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  className="px-3 py-1 rounded text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="px-3 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
