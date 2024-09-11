export type Config = {
  github: {
    owner: string | null
    repo: string | null
    auth: GitHubAuthConfig
  }
  committer: {
    author: string | null
    email: string | null
  }
}

type GitHubTokenAuthConfig = {
  type: 'token'
  token: string | null
}
type GitHubAppAuthConfig = {
  type: 'app'
  token: string | null
  tokenExpiresIn: Date | null
  refreshToken: string | null
  refreshTokenExpiresIn: Date | null
}
export type GitHubAuthConfig = GitHubTokenAuthConfig | GitHubAppAuthConfig

const GithubOwnerStorageItem = 'markdiary.github.owner'
const GithubRepoStorageItem = 'markdiary.github.repo'
const GithubAuthTypeStorageItem = 'markdiary.github.auth.type'
const GithubAuthTokenStorageItem = 'markdiary.github.auth.token'
const GithubAuthTokenExpirationStorageItem =
  'markdiary.github.auth.token-expiration'
const GithubAuthRefreshTokenStorageItem = 'markdiary.github.auth.refresh-token'
const GithubAuthRefreshTokenExpirationStorageItem =
  'markdiary.github.auth.refresh-token-expiration'
const GithubAuthorStorageItem = 'markdiary.committer.author'
const GithubEmailStorageItem = 'markdiary.committer.email'

function setNullableStorageItem(
  key: string,
  value: string | null | undefined
): void {
  if (value) localStorage.setItem(key, value)
  else localStorage.removeItem(key)
}

function getDateStorageItem(key: string): Date | null {
  const valueStr = localStorage.getItem(key)
  return valueStr ? new Date(valueStr) : null
}

export function saveGitHubToken(authConfig: GitHubAuthConfig): void {
  if (!authConfig.token) {
    throw new Error('GitHub token must be not empty.')
  }

  localStorage.setItem(GithubAuthTypeStorageItem, authConfig.type)
  localStorage.setItem(GithubAuthTokenStorageItem, authConfig.token)
  if (authConfig.type === 'app') {
    setNullableStorageItem(
      GithubAuthTokenExpirationStorageItem,
      authConfig.tokenExpiresIn?.toISOString()
    )
    setNullableStorageItem(
      GithubAuthRefreshTokenStorageItem,
      authConfig.refreshToken
    )
    setNullableStorageItem(
      GithubAuthRefreshTokenExpirationStorageItem,
      authConfig.refreshTokenExpiresIn?.toISOString()
    )
  }
}

export function saveConfig(config: Config): void {
  if (
    !config.github.owner ||
    !config.github.repo ||
    !config.github.auth.token ||
    !config.committer.author ||
    !config.committer.email
  ) {
    throw new Error('Incomplete config can not be saved.')
  }

  localStorage.setItem(GithubOwnerStorageItem, config.github.owner)
  localStorage.setItem(GithubRepoStorageItem, config.github.repo)

  saveGitHubToken(config.github.auth)

  localStorage.setItem(GithubAuthorStorageItem, config.committer.author)
  localStorage.setItem(GithubEmailStorageItem, config.committer.email)
}

function loadAuthConfig(): GitHubAuthConfig {
  let token = localStorage.getItem(GithubAuthTokenStorageItem)
  if (!token) {
    // fallback to legacy config item
    // TODO: remove this config after migration
    token = localStorage.getItem('markdiary.github.token')
  }

  const type = localStorage.getItem(GithubAuthTypeStorageItem)
  if (type === 'app') {
    const refreshTokenExpiresIn = getDateStorageItem(
      GithubAuthRefreshTokenExpirationStorageItem
    )
    const tokenExpiresIn = getDateStorageItem(
      GithubAuthTokenExpirationStorageItem
    )
    return {
      type,
      token,
      tokenExpiresIn,
      refreshToken: localStorage.getItem(GithubAuthRefreshTokenStorageItem),
      refreshTokenExpiresIn,
    }
  } else {
    return {
      type: 'token',
      token,
    }
  }
}

export function loadConfig(): Config {
  return {
    github: {
      owner: localStorage.getItem(GithubOwnerStorageItem),
      repo: localStorage.getItem(GithubRepoStorageItem),
      auth: loadAuthConfig(),
    },
    committer: {
      author: localStorage.getItem(GithubAuthorStorageItem),
      email: localStorage.getItem(GithubEmailStorageItem),
    },
  }
}

export function hasRequiredConfiguration(): boolean {
  const requiredItems = [GithubAuthTokenStorageItem]
  return requiredItems.every((item) => localStorage.getItem(item))
}
