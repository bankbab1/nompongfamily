import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

// Tests assume the Thai-first default, whatever language the test browser reports.
localStorage.setItem('nompong.locale', 'th')
