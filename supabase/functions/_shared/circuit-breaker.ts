// =============================================================================
// FUXICO - Circuit Breaker for External API Calls
// Arquivo: supabase/functions/_shared/circuit-breaker.ts
// Descricao: Previne cascading failures em integracoes externas
// =============================================================================

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitConfig {
  failureThreshold: number;   // Number of failures before opening
  resetTimeoutMs: number;     // Time to wait before trying again
  name: string;               // Identifier for logging
}

interface CircuitEntry {
  state: CircuitState;
  failures: number;
  lastFailure: number;
  lastSuccess: number;
}

// In-memory circuit state (per-isolate, like rate limiter)
const circuits = new Map<string, CircuitEntry>();

const defaultConfig: Omit<CircuitConfig, 'name'> = {
  failureThreshold: 5,
  resetTimeoutMs: 60_000, // 1 minute
};

function getCircuit(name: string): CircuitEntry {
  if (!circuits.has(name)) {
    circuits.set(name, {
      state: 'closed',
      failures: 0,
      lastFailure: 0,
      lastSuccess: Date.now(),
    });
  }
  return circuits.get(name)!;
}

/**
 * Check if the circuit allows a request through.
 */
export function isCircuitOpen(name: string, config?: Partial<CircuitConfig>): boolean {
  const cfg = { ...defaultConfig, name, ...config };
  const circuit = getCircuit(name);

  if (circuit.state === 'closed') return false;

  if (circuit.state === 'open') {
    const elapsed = Date.now() - circuit.lastFailure;
    if (elapsed >= cfg.resetTimeoutMs) {
      circuit.state = 'half-open';
      return false; // Allow one test request
    }
    return true; // Circuit is open, block request
  }

  // half-open: allow one request through
  return false;
}

/**
 * Record a successful request (closes the circuit).
 */
export function recordSuccess(name: string): void {
  const circuit = getCircuit(name);
  circuit.state = 'closed';
  circuit.failures = 0;
  circuit.lastSuccess = Date.now();
}

/**
 * Record a failed request (may open the circuit).
 */
export function recordFailure(name: string, config?: Partial<CircuitConfig>): void {
  const cfg = { ...defaultConfig, name, ...config };
  const circuit = getCircuit(name);
  circuit.failures++;
  circuit.lastFailure = Date.now();

  if (circuit.failures >= cfg.failureThreshold) {
    circuit.state = 'open';
  }
}

/**
 * Execute a function with circuit breaker protection.
 * Returns null if circuit is open (caller should handle gracefully).
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  config?: Partial<CircuitConfig>
): Promise<T | null> {
  if (isCircuitOpen(name, config)) {
    return null; // Circuit open - fail fast
  }

  try {
    const result = await fn();
    recordSuccess(name);
    return result;
  } catch (error) {
    recordFailure(name, config);
    throw error;
  }
}
