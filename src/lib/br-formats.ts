/**
 * Utilitários de formatação e validação para dados brasileiros.
 * Cobre CPF, CNPJ, telefone e CEP com máscaras e checagem de dígitos.
 */

const onlyDigits = (v: string) => v.replace(/\D+/g, "");

// ---------- CPF ----------
export const maskCPF = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
};

export const isValidCPF = (input: string): boolean => {
  const cpf = onlyDigits(input);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const calc = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (factor - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
};

// ---------- CNPJ ----------
export const maskCNPJ = (v: string) => {
  const d = onlyDigits(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

export const isValidCNPJ = (input: string): boolean => {
  const cnpj = onlyDigits(input);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const calc = (base: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += Number(base[i]) * weights[i];
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const d1 = calc(cnpj.slice(0, 12), weights1);
  const d2 = calc(cnpj.slice(0, 13), weights2);
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
};

// ---------- Telefone BR ----------
export const maskPhoneBR = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
};

export const isValidPhoneBR = (input: string): boolean => {
  const d = onlyDigits(input);
  return d.length === 10 || d.length === 11;
};

// ---------- CEP ----------
export const maskCEP = (v: string) =>
  onlyDigits(v).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");

export const isValidCEP = (input: string): boolean =>
  onlyDigits(input).length === 8;

// ---------- Moeda BRL ----------
export const formatBRL = (value: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
