// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      user: import('$lib/server/auth/auth').SessionValidationResult['user']
      session: import('$lib/server/auth/auth').SessionValidationResult['session']
    }
  }
}

export {}
