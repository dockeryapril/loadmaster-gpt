import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

export function resolve(specifier, context, defaultResolve) {
  if (specifier.endsWith('.ts')) {
    return { url: new URL(specifier, context.parentURL).href, shortCircuit: true };
  }
  if (specifier.endsWith('.js')) {
    const tsUrl = new URL(specifier.replace(/\.js$/, '.ts'), context.parentURL);
    if (existsSync(fileURLToPath(tsUrl))) {
      return { url: tsUrl.href, shortCircuit: true };
    }
  }
  return defaultResolve(specifier, context, defaultResolve);
}

export function load(url, context, defaultLoad) {
  if (url.endsWith('.ts')) {
    const source = readFileSync(fileURLToPath(url), 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 }
    });
    return { format: 'module', source: outputText, shortCircuit: true };
  }
  return defaultLoad(url, context, defaultLoad);
}
