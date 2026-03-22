const { OJSubmission } = require('../models/OJProblem');
const axios = require('axios');

const PISTON_API = 'https://emkc.org/api/v2/piston';

const judgeCode = async (submissionId, problem) => {
  const submission = await OJSubmission.findById(submissionId);

  submission.status = 'judging';
  await submission.save();

  try {
    const result = await executeInSandbox(submission.code, problem.testCases, {
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit
    });

    const passedTests = result.results.filter(r => r.status === 'accepted').length;
    const totalTests = problem.testCases.length;
    const score = totalTests > 0 ? Math.floor((passedTests / totalTests) * 100) : 0;

    let status = 'wrong_answer';
    if (score === 100 && totalTests > 0) {
      status = 'accepted';
    } else if (result.timeExceeded) {
      status = 'time_limit';
    } else if (result.memoryExceeded) {
      status = 'memory_limit';
    } else if (result.compileError) {
      status = 'compile_error';
    }

    return {
      status,
      score,
      testResults: result.results,
      compileOutput: result.compileOutput || ''
    };
  } catch (error) {
    return {
      status: 'runtime_error',
      score: 0,
      testResults: [],
      compileOutput: error.message
    };
  }
};

const executeCpp = async (code, stdin = '', timeout = 5000) => {
  try {
    const response = await axios.post(`${PISTON_API}/execute`, {
      language: 'cpp',
      version: '10.2.0',
      files: [
        {
          name: 'main.cpp',
          content: code
        }
      ],
      stdin: stdin,
      args: [],
      run_timeout: timeout,
      compile_memory_limit: -1,
      run_memory_limit: -1
    }, {
      timeout: Math.max(timeout + 5000, 10000)
    });

    const { run, compile } = response.data;

    if (compile && compile.stderr && compile.stderr.trim()) {
      return {
        success: false,
        output: '',
        error: compile.stderr,
        time: 0,
        compileError: true
      };
    }

    if (run && run.stderr && run.stderr.includes('Execution timed out')) {
      return {
        success: false,
        output: run.stdout || '',
        error: 'Time limit exceeded',
        time: timeout,
        isTimeout: true
      };
    }

    if (run && run.exit_code !== 0) {
      return {
        success: false,
        output: run.stdout || '',
        error: run.stderr || `Runtime error (exit code: ${run.exit_code})`,
        time: run.duration || 0
      };
    }

    return {
      success: true,
      output: run.stdout || '',
      error: run.stderr || '',
      time: run.duration || 0
    };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        output: '',
        error: error.response.data?.message || 'Piston API error',
        time: 0
      };
    }
    return {
      success: false,
      output: '',
      error: error.message || 'Failed to execute code',
      time: 0
    };
  }
};

const executeInSandbox = async (code, testCases, limits) => {
  const results = [];
  const timeout = (limits.timeLimit || 2000) + 1000;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];

    const runResult = await executeCpp(
      code,
      testCase.input || '',
      limits.timeLimit || 2000
    );

    const actualOutput = (runResult.output || '').trim();
    const expectedOutput = (testCase.output || '').trim();

    let status = 'wrong_answer';
    let message = 'Output mismatch';

    if (runResult.isTimeout) {
      status = 'time_limit';
      message = 'Time limit exceeded';
    } else if (!runResult.success || runResult.compileError) {
      status = 'runtime_error';
      message = runResult.error;
    } else if (actualOutput === expectedOutput) {
      status = 'accepted';
      message = 'OK';
    }

    results.push({
      testCase: i + 1,
      status,
      time: runResult.time,
      memory: 0,
      message,
      expected: expectedOutput,
      actual: actualOutput
    });
  }

  return {
    results,
    compileOutput: '',
    compileError: false,
    timeExceeded: results.some(r => r.status === 'time_limit'),
    memoryExceeded: false
  };
};

async function executeCode(code, input, language) {
  const result = await executeCpp(code, input || '', 5000);

  return {
    output: result.output,
    error: result.error,
    time: result.time,
    memory: 0
  };
}

module.exports = {
  judgeCode,
  executeCode
};
