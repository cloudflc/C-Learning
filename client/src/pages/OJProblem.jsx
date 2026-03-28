import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOJStore, useAuthStore, useLevelStore } from '../stores';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Send, FileText, Play, Check, X, Clock, MemoryStick, Terminal, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import api from '../services/api';

const OJProblem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProblem, fetchProblem, submitCode, runCode, submissions, fetchSubmissions, isLoading } = useOJStore();
  const { updateUser } = useAuthStore();
  const { fetchLevels } = useLevelStore();
  
  const [code, setCode] = useState(`#include <iostream>
using namespace std;

int main() {
    
    return 0;
}
`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [terminalLines, setTerminalLines] = useState([]);
  const [customInput, setCustomInput] = useState('');
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    fetchProblem(id);
    fetchSubmissions(id);
  }, [id]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  useEffect(() => {
    if (currentSubmission && (currentSubmission.status === 'pending' || currentSubmission.status === 'judging')) {
      const interval = setInterval(async () => {
        try {
          const res = await api.get(`/oj/submission/${currentSubmission._id}`);
          const updated = res.data;
          setCurrentSubmission(updated);
          
          if (updated.status !== 'pending' && updated.status !== 'judging') {
            clearInterval(interval);
            
            if (updated.status === 'accepted') {
              toast.success(`恭喜！获得 ${updated.expEarned || currentProblem?.expReward || 20} 经验值！`);
              
              if (updated.totalExp !== undefined || updated.currentRank !== undefined) {
                updateUser({ exp: updated.totalExp, rank: updated.currentRank });
              } else {
                try {
                  const userRes = await api.get('/auth/me');
                  updateUser(userRes.data);
                } catch (error) {
                  console.error('Failed to fetch user info:', error);
                }
              }
              
              fetchLevels();
            } else if (updated.status === 'compile_error') {
              toast.error('编译错误！请检查代码');
            } else if (updated.status === 'wrong_answer') {
              toast.error('答案错误！查看详情了解哪个测试用例失败');
            } else if (updated.status === 'runtime_error') {
              toast.error('运行时错误！');
            } else if (updated.status === 'time_limit') {
              toast.error('超时！');
            }
            
            fetchSubmissions(id);
          }
        } catch (error) {
          console.error('Failed to fetch submission:', error);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [currentSubmission, id]);

  const addTerminalLine = (text, type = 'output') => {
    setTerminalLines(prev => [...prev, { text, type }]);
  };

  const clearTerminal = () => {
    setTerminalLines([]);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setCurrentSubmission(null);
    try {
      const response = await submitCode(id, { code, language: 'cpp' });
      
      if (response.submissionId) {
        setCurrentSubmission({ _id: response.submissionId, status: 'pending' });
        toast.success('代码已提交，正在判题...');
      } else if (response.status === 'accepted') {
        toast.success(`恭喜！获得 ${response.expEarned || currentProblem.expReward} 经验值！`);
        updateUser({ exp: response.totalExp, rank: response.currentRank });
        fetchSubmissions(id);
        fetchLevels();
      } else {
        toast.error('提交失败，请检查代码');
      }
    } catch (error) {
      toast.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRun = async () => {
    if (isRunning) return;
    
    clearTerminal();
    setIsRunning(true);
    
    try {
      const inputToUse = customInput || currentProblem?.sampleInput || '';
      
      if (!inputToUse) {
        addTerminalLine('请先在输入框填写测试数据', 'error');
        setIsRunning(false);
        return;
      }
      
      const response = await runCode(id, { code, input: inputToUse });
      
      if (response.error) {
        addTerminalLine(response.error, 'error');
      } else {
        addTerminalLine(response.output || '(无输出)', 'output');
      }
    } catch (error) {
      addTerminalLine(error.response?.data?.message || error.message, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      accepted: { bg: 'bg-green-500/20', text: 'text-green-400', icon: Check },
      wrong_answer: { bg: 'bg-red-500/20', text: 'text-red-400', icon: X },
      time_limit: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock },
      memory_limit: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: MemoryStick },
      compile_error: { bg: 'bg-red-500/20', text: 'text-red-400', icon: X },
      runtime_error: { bg: 'bg-red-500/20', text: 'text-red-400', icon: X },
      pending: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: Clock },
      judging: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Play }
    };
    
    const { bg, text, icon: Icon } = config[status] || config.pending;
    
    return (
      <span className={clsx(bg, text, 'px-2 py-1 rounded-full text-xs flex items-center gap-1')}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const toggleSubmissionDetails = (subId) => {
    setExpandedSubmission(expandedSubmission === subId ? null : subId);
  };

  if (isLoading || !currentProblem) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        <span>返回</span>
      </button>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">{currentProblem.title}</h1>
            <span className="text-primary-400 font-medium">+{currentProblem.expReward} EXP</span>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('description')}
              className={clsx(
                'px-4 py-2 rounded-lg transition-colors',
                activeTab === 'description' 
                  ? 'bg-primary-500/20 text-primary-400' 
                  : 'text-slate-400 hover:text-white'
              )}
            >
              题目描述
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={clsx(
                'px-4 py-2 rounded-lg transition-colors',
                activeTab === 'submissions' 
                  ? 'bg-primary-500/20 text-primary-400' 
                  : 'text-slate-400 hover:text-white'
              )}
            >
              提交记录
            </button>
          </div>

          {activeTab === 'description' && (
            <div className="space-y-4">
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{currentProblem.description}</ReactMarkdown>
              </div>

              {currentProblem.inputFormat && (
                <div>
                  <h3 className="text-white font-bold mb-2">输入格式</h3>
                  <ReactMarkdown>{currentProblem.inputFormat}</ReactMarkdown>
                </div>
              )}

              {currentProblem.outputFormat && (
                <div>
                  <h3 className="text-white font-bold mb-2">输出格式</h3>
                  <ReactMarkdown>{currentProblem.outputFormat}</ReactMarkdown>
                </div>
              )}

              {currentProblem.sampleInput && currentProblem.sampleOutput && (
                <div className="space-y-2">
                  <h3 className="text-white font-bold mb-2">样例</h3>
                  <div className="bg-slate-900 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">输入:</div>
                    <pre className="text-white font-mono text-sm whitespace-pre-wrap">{currentProblem.sampleInput}</pre>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">输出:</div>
                    <pre className="text-white font-mono text-sm whitespace-pre-wrap">{currentProblem.sampleOutput}</pre>
                  </div>
                </div>
              )}

              <div className="flex gap-4 text-sm text-slate-400">
                <span>时间限制: {currentProblem.timeLimit}ms</span>
                <span>内存限制: {currentProblem.memoryLimit}MB</span>
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-3">
              {currentSubmission && currentSubmission.status !== 'accepted' && (
                <div className="p-3 bg-slate-700/30 rounded-lg border border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">本次提交</span>
                    {getStatusBadge(currentSubmission.status)}
                  </div>
                  {currentSubmission.compileOutput && (
                    <div className="mt-2 text-sm">
                      <div className="text-red-400 mb-1">编译错误:</div>
                      <pre className="text-red-300 font-mono text-xs whitespace-pre-wrap bg-slate-900 p-2 rounded">{currentSubmission.compileOutput}</pre>
                    </div>
                  )}
                  {currentSubmission.testResults && currentSubmission.testResults.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm text-slate-400 mb-1">测试结果:</div>
                      {currentSubmission.testResults.map((result, idx) => (
                        <div key={idx} className={clsx(
                          'p-2 rounded text-sm mb-1',
                          result.status === 'accepted' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        )}>
                          <div className="flex items-center justify-between">
                            <span>测试点 {idx + 1}</span>
                            <span>{result.status === 'accepted' ? '通过' : '失败'}</span>
                          </div>
                          {result.status !== 'accepted' && (
                            <div className="mt-1 text-xs">
                              <div>期望: <span className="text-yellow-300">{result.expected}</span></div>
                              <div>实际: <span className="text-red-300">{result.actual}</span></div>
                              {result.message && result.message !== 'Output mismatch' && (
                                <div className="text-slate-400">原因: {result.message}</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {submissions.length === 0 ? (
                <p className="text-slate-400 text-center py-8">暂无提交记录</p>
              ) : (
                submissions.map((sub) => (
                  <div key={sub._id} className="bg-slate-700/30 rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/50"
                      onClick={() => toggleSubmissionDetails(sub._id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm">
                          {new Date(sub.createdAt).toLocaleString()}
                        </span>
                        {getStatusBadge(sub.status)}
                        <span className="text-primary-400 text-sm">{sub.score}分</span>
                      </div>
                      {expandedSubmission === sub._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    {expandedSubmission === sub._id && (
                      <div className="px-3 pb-3 border-t border-slate-700">
                        {sub.compileOutput && (
                          <div className="mt-2 text-sm">
                            <div className="text-red-400 mb-1">编译输出:</div>
                            <pre className="text-red-300 font-mono text-xs whitespace-pre-wrap bg-slate-900 p-2 rounded max-h-32 overflow-y-auto">{sub.compileOutput}</pre>
                          </div>
                        )}
                        {sub.testResults && sub.testResults.length > 0 && (
                          <div className="mt-2">
                            <div className="text-sm text-slate-400 mb-1">测试结果:</div>
                            {sub.testResults.map((result, idx) => (
                              <div key={idx} className={clsx(
                                'p-2 rounded text-sm mb-1',
                                result.status === 'accepted' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                              )}>
                                <div className="flex items-center justify-between">
                                  <span>测试点 {idx + 1}</span>
                                  <span>{result.status === 'accepted' ? '通过' : '失败'}</span>
                                </div>
                                {result.status !== 'accepted' && (
                                  <div className="mt-1 text-xs">
                                    <div>期望: <span className="text-yellow-300">{result.expected}</span></div>
                                    <div>实际: <span className="text-red-300">{result.actual}</span></div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {!sub.compileOutput && (!sub.testResults || sub.testResults.length === 0) && (
                          <div className="mt-2 text-slate-500 text-sm">无详细信息</div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-primary-400" size={20} />
                <span className="text-white font-medium">代码编辑器</span>
              </div>
              <span className="text-slate-400 text-sm">C++</span>
            </div>

            <div className="border border-slate-700 rounded-lg overflow-hidden mb-4">
              <CodeMirror
                value={code}
                height="200px"
                extensions={[cpp()]}
                onChange={(value) => setCode(value)}
                theme="dark"
                className="text-base"
                basicSetup={{
                  spellcheck: false
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2"
              >
                <Play size={20} />
                {isRunning ? '运行中...' : '运行测试'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
              >
                <Send size={20} />
                {isSubmitting ? '判题中...' : '提交代码'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="mb-3">
              <label className="block text-slate-400 text-sm mb-2">输入</label>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="输入测试数据"
                className="input w-full h-20 font-mono text-sm"
              />
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="text-green-400" size={20} />
                <span className="text-white font-medium">输出</span>
              </div>
              <button
                onClick={clearTerminal}
                className="text-slate-400 hover:text-white transition-colors"
                title="清空"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
              {terminalLines.length === 0 ? (
                <div className="text-slate-500">
                  点击"运行测试"查看输出
                </div>
              ) : (
                terminalLines.map((line, index) => (
                  <div 
                    key={index} 
                    className={clsx(
                      'whitespace-pre-wrap mb-1',
                      line.type === 'error' && 'text-red-400',
                      line.type === 'output' && 'text-white'
                    )}
                  >
                    {line.text}
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OJProblem;
