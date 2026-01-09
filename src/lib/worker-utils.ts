/**
 * Web Worker Utilities
 * @description Helpers para processamento em background
 */

export function createWorker(workerFunction: () => void): Worker {
  const blob = new Blob([`(${workerFunction.toString()})()`], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

export function runInWorker<T, R>(data: T, processor: (data: T) => R): Promise<R> {
  return new Promise((resolve, reject) => {
    const workerCode = `
      self.onmessage = function(e) {
        try {
          const result = (${processor.toString()})(e.data);
          self.postMessage({ success: true, result });
        } catch (error) {
          self.postMessage({ success: false, error: error.message });
        }
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    worker.onmessage = (e) => {
      worker.terminate();
      if (e.data.success) resolve(e.data.result);
      else reject(new Error(e.data.error));
    };
    
    worker.postMessage(data);
  });
}
