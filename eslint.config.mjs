import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// Next 16 에서 `next lint` 가 없어져 ESLint 를 직접 돌린다 (flat config).
export default [
  ...nextVitals,
  ...nextTs,
  // Next 16 과 함께 들어온 React Compiler 규칙. 기존 화면 동작을 바꾸지 않으려 경고로 둔다
  { rules: { 'react-hooks/set-state-in-effect': 'warn' } },
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'coverage/**'] },
]
