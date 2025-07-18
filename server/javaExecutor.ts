import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

interface ExecutionResult {
  status: 'passed' | 'failed' | 'error';
  output?: string;
  error?: string;
  executionTime?: number;
  testCaseResults?: TestCaseResult[];
}

export async function executeJavaCode(code: string, testCases: TestCase[]): Promise<ExecutionResult> {
  const tempDir = path.join(process.cwd(), 'temp');
  const suffix = nanoid().replace(/-/g, '');
  const fileName = `Solution_${suffix}.java`;
  const filePath = path.join(tempDir, fileName);
  const className = fileName.replace('.java', '');

  try {
    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    // Add necessary imports
    const imports = `
      import java.util.Scanner;
      \n
    `
    
    // Create the Java file with proper class name
    const javaCode = code.replace(/public\s+class\s+\w+(\s*{)/, `public class ${className}$1`);
    await fs.writeFile(filePath, imports+javaCode);

    // Compile the Java file
    const compileResult = await runCommand('javac', [filePath], tempDir);
    
    if (compileResult.exitCode !== 0) {
      return {
        status: 'error',
        error: `Compilation Error: ${compileResult.stderr}`,
      };
    }

    // Run test cases
    const startTime = Date.now();
    let allTestsPassed = true;
    let output = '';
    let error = '';
    const testCaseResults: TestCaseResult[] = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      // Create input file for this test case if input is provided
      const inputFile = path.join(tempDir, `input_${i}.txt`);
      await fs.writeFile(inputFile, testCase.input || '');

      // Execute the Java program with input (empty string if no input)
      const executeResult = await runCommand(
        'java',
        ['-cp', tempDir, className],
        tempDir,
        testCase.input || '',
        5000 // 5 second timeout
      );

      if (executeResult.exitCode !== 0) {
        allTestsPassed = false;
        error = `Runtime Error in Test Case ${i + 1}: ${executeResult.stderr}`;
        
        // Add failed test case result
        testCaseResults.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: `Runtime Error: ${executeResult.stderr}`,
          passed: false
        });
        break;
      }

      // Compare outputs more carefully - only trim trailing newlines, preserve internal spacing
      const actualOutput = executeResult.stdout.replace(/\n+$/, '');
      const expectedOutput = testCase.expectedOutput.replace(/\n+$/, '');
      const testPassed = actualOutput === expectedOutput;

      testCaseResults.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: executeResult.stdout,
        passed: testPassed
      });

      if (!testPassed) {
        allTestsPassed = false;
        // Create a more detailed error message showing the difference
        const expectedLines = expectedOutput.split('\n');
        const actualLines = actualOutput.split('\n');
        
        if (expectedLines.length !== actualLines.length) {
          error = `Test Case ${i + 1} Failed - Different number of lines. Expected ${expectedLines.length} lines, got ${actualLines.length} lines.`;
        } else {
          // Find the first differing line
          for (let j = 0; j < expectedLines.length; j++) {
            if (expectedLines[j] !== actualLines[j]) {
              error = `Test Case ${i + 1} Failed - Line ${j + 1} differs.\nExpected: "${expectedLines[j]}"\nActual: "${actualLines[j]}"`;
              break;
            }
          }
          if (!error) {
            error = `Test Case ${i + 1} Failed - Outputs differ in whitespace or formatting.`;
          }
        }
        break;
      }

      output += `Test Case ${i + 1}: Passed\n`;
      
      // Clean up input file
      await fs.unlink(inputFile).catch(() => {});
    }

    const executionTime = Date.now() - startTime;

    return {
      status: allTestsPassed ? 'passed' : 'failed',
      output: allTestsPassed ? `All ${testCases.length} test cases passed!` : output,
      error: allTestsPassed ? undefined : error,
      executionTime,
      testCaseResults,
    };

  } catch (error) {
    console.error('Error executing Java code:', error);
    return {
      status: 'error',
      error: `Execution Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  } finally {
    // Clean up files
    try {
      await fs.unlink(filePath).catch(() => {});
      await fs.unlink(path.join(tempDir, `${className}.class`)).catch(() => {});
    } catch (error) {
      console.error('Error cleaning up files:', error);
    }
  }
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  input?: string,
  timeout = 10000
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd });
    
    let stdout = '';
    let stderr = '';
    let isResolved = false;

    const timer = setTimeout(() => {
      if (!isResolved) {
        child.kill('SIGKILL');
        isResolved = true;
        resolve({
          stdout: '',
          stderr: 'Timeout: Code execution took too long',
          exitCode: 1,
        });
      }
    }, timeout);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (!isResolved) {
        clearTimeout(timer);
        isResolved = true;
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
        });
      }
    });

    child.on('error', (error) => {
      if (!isResolved) {
        clearTimeout(timer);
        isResolved = true;
        resolve({
          stdout: '',
          stderr: error.message,
          exitCode: 1,
        });
      }
    });

    // Send input to the process if provided
    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }
  });
}
