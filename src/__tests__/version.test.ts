import { describe, it, expect } from 'vitest'
import packageJson from '../../package.json'

describe('Versão do aplicativo', () => {
  it('deve ser 3.1.1', () => {
    expect(packageJson.version).toBe('3.1.1')
  })
})
