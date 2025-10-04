/**
 * Stub test file for explorer
 * This ensures the test infrastructure is set up correctly
 */

describe('Explorer Test Infrastructure', () => {
  it('should have working test setup', () => {
    expect(true).toBe(true)
  })

  it('should be able to use Jest matchers', () => {
    const value = 'arbius explorer'
    expect(value).toContain('arbius')
    expect(value).toBeDefined()
  })
})
